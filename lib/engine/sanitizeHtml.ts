import sanitizeHtml from "sanitize-html";
import type { ExtractedLink, Finding } from "./types";

const MAX_PREVIEW_HTML_BYTES = 500 * 1024;
const MAX_HIGHLIGHT_PHRASE_LENGTH = 60;

// A tiny inert gray-box placeholder — used in place of every remote image by
// default so no tracking pixel or remote resource loads without the user
// explicitly opting in via the "load images" toggle.
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80'%3E%3Crect width='100%25' height='100%25' fill='%23d4d4d4'/%3E%3C/svg%3E";

// Colors match the app's fixed status palette (--status-critical / --status-warning),
// used as plain hex here since this HTML is rendered inside an isolated iframe
// document, independent of the parent page's CSS custom properties.
const HIGHLIGHT_HIGH = "rgba(208, 59, 59, 0.28)";
const HIGHLIGHT_MEDIUM = "rgba(250, 178, 25, 0.32)";

const LINK_FLAG_SEVERITY: Record<string, "high" | "medium"> = {
  "ip-literal": "high",
  "punycode-homograph": "high",
  "anchor-text-mismatch": "high",
  "url-shortener": "medium",
};

function linkHighlightColor(flags: string[]): string | null {
  let best: "high" | "medium" | null = null;
  for (const flag of flags) {
    const key = flag.startsWith("brand-in-subdomain:") ? "brand-in-subdomain" : flag;
    const severity = key === "brand-in-subdomain" ? "high" : LINK_FLAG_SEVERITY[key];
    if (severity === "high") best = "high";
    else if (severity === "medium" && best !== "high") best = "medium";
  }
  if (best === "high") return HIGHLIGHT_HIGH;
  if (best === "medium") return HIGHLIGHT_MEDIUM;
  return null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wraps phrase matches in `<mark>` — but ONLY inside text-node segments, never
 * inside a tag. Splitting on `/(<[^>]+>)/` alternates the string between tags
 * and the text between them; only the non-tag segments are ever rewritten, so
 * attacker-controlled `evidence` text can never smuggle in a new attribute or
 * break out into a new tag, no matter what it contains — worst case a phrase
 * simply fails to match and nothing gets highlighted.
 */
function highlightTextNodes(html: string, phrases: { phrase: string; color: string; title: string }[]): string {
  const usable = phrases.filter((p) => p.phrase.trim().length > 0 && p.phrase.length <= MAX_HIGHLIGHT_PHRASE_LENGTH);
  if (usable.length === 0) return html;

  const parts = html.split(/(<[^>]+>)/);
  return parts
    .map((part, i) => {
      const isTag = i % 2 === 1; // split() keeps captured tag delimiters at odd indices
      if (isTag) return part;
      let text = part;
      for (const { phrase, color, title } of usable) {
        const re = new RegExp(escapeRegExp(phrase), "gi");
        text = text.replace(
          re,
          (match) => `<mark style="background:${color};border-radius:2px;padding:0 1px" title="Finding: ${title}">${match}</mark>`
        );
      }
      return text;
    })
    .join("");
}

export interface SanitizedPreview {
  html: string;
  blockedImages: number;
  truncated: boolean;
}

/**
 * Produces a preview-only HTML fragment safe to render inside a fully
 * sandboxed, scriptless iframe (`sandbox=""`, CSP `default-src 'none'`).
 *
 * This does NOT rely on the iframe sandbox alone: `sandbox=""` blocks
 * scripting/forms/popups/navigation, but it does NOT stop ordinary
 * subresource loads like `<img src>` or CSS `background-image: url(...)` —
 * those are neutralized here, at sanitize time, by stripping every real
 * image reference into a `data-safe-src` attribute the caller can
 * selectively restore. The caller's CSP `img-src` policy is the actual
 * enforcement layer for "no external loads by default."
 *
 * Links lose their `href` entirely (not in `allowedAttributes`, so
 * sanitize-html strips whatever `transformTags` sets it to) — the real URL
 * survives only in `title`, which the browser renders as a native tooltip
 * with zero script/navigation risk. Flagged links and suspicious phrases are
 * additionally highlighted in-place (see `highlightTextNodes` above for why
 * this can't be used to break the sanitizer).
 */
export function sanitizeEmailHtml(
  rawHtml: string,
  opts?: { flaggedLinks?: ExtractedLink[]; contentFindings?: Finding[] }
): SanitizedPreview {
  let blockedImages = 0;

  const linkColorByHref = new Map<string, string>();
  for (const link of opts?.flaggedLinks ?? []) {
    if (link.flags.length === 0) continue;
    const color = linkHighlightColor(link.flags);
    if (color) linkColorByHref.set(link.href, color);
  }

  const clean = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags
      .concat(["img", "font", "center", "mark"])
      .filter((t) => !["script", "iframe", "object", "embed", "form", "base"].includes(t)),
    allowedAttributes: {
      "*": ["style", "class", "align", "valign", "width", "height", "color", "bgcolor", "title"],
      img: ["data-safe-src", "alt", "width", "height"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["data"],
    disallowedTagsMode: "discard",
    allowVulnerableTags: false,
    transformTags: {
      a: (_tagName, attribs) => {
        const color = attribs.href ? linkColorByHref.get(attribs.href) : undefined;
        return {
          tagName: "a",
          attribs: {
            title: attribs.href ? `Real destination: ${attribs.href}` : "",
            style: color ? `background:${color};border-radius:2px;padding:0 1px` : "",
          },
        };
      },
      img: (_tagName, attribs) => {
        const src = attribs.src ?? "";
        const isRemote = /^https?:\/\//i.test(src);
        if (isRemote) blockedImages++;
        return {
          tagName: "img",
          attribs: {
            src: PLACEHOLDER_IMG,
            "data-safe-src": isRemote ? src : "",
            alt: attribs.alt ?? "",
          },
        };
      },
      meta: () => ({ tagName: "meta", attribs: {} }),
      link: () => ({ tagName: "meta", attribs: {} }),
    },
  });

  // Belt-and-suspenders: strip any CSS `url(...)` reference to a remote
  // resource that might have survived inside an inline `style` attribute —
  // CSS can load images identically to <img>, and the iframe sandbox
  // attribute does not block that subresource fetch either.
  const withoutCssUrls = clean.replace(/url\s*\(\s*['"]?(https?:)?\/\/[^)'"]+['"]?\s*\)/gi, "none");

  const contentPhrases = (opts?.contentFindings ?? [])
    .filter((f) => f.evidence)
    .map((f) => ({
      phrase: f.evidence as string,
      color: f.severity === "critical" || f.severity === "high" ? HIGHLIGHT_HIGH : HIGHLIGHT_MEDIUM,
      title: f.title,
    }));
  const withTextHighlights = highlightTextNodes(withoutCssUrls, contentPhrases);

  let truncated = false;
  let finalHtml = withTextHighlights;
  if (Buffer.byteLength(finalHtml, "utf8") > MAX_PREVIEW_HTML_BYTES) {
    finalHtml = finalHtml.slice(0, MAX_PREVIEW_HTML_BYTES);
    truncated = true;
  }

  return { html: finalHtml, blockedImages, truncated };
}

import sanitizeHtml from "sanitize-html";

const MAX_PREVIEW_HTML_BYTES = 500 * 1024;

// A tiny inert gray-box placeholder — used in place of every remote image by
// default so no tracking pixel or remote resource loads without the user
// explicitly opting in via the "load images" toggle.
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80'%3E%3Crect width='100%25' height='100%25' fill='%23d4d4d4'/%3E%3C/svg%3E";

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
 * with zero script/navigation risk.
 */
export function sanitizeEmailHtml(rawHtml: string): SanitizedPreview {
  let blockedImages = 0;

  const clean = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags
      .concat(["img", "font", "center"])
      .filter((t) => !["script", "iframe", "object", "embed", "form", "base"].includes(t)),
    allowedAttributes: {
      "*": ["style", "class", "align", "valign", "width", "height", "color", "bgcolor"],
      a: ["title"],
      img: ["data-safe-src", "alt", "width", "height"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["data"],
    disallowedTagsMode: "discard",
    allowVulnerableTags: false,
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: { title: attribs.href ? `Real destination: ${attribs.href}` : "" },
      }),
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

  let truncated = false;
  let finalHtml = withoutCssUrls;
  if (Buffer.byteLength(finalHtml, "utf8") > MAX_PREVIEW_HTML_BYTES) {
    finalHtml = finalHtml.slice(0, MAX_PREVIEW_HTML_BYTES);
    truncated = true;
  }

  return { html: finalHtml, blockedImages, truncated };
}

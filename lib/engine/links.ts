import * as cheerio from "cheerio";
import type { NormalizedEmail } from "./parseEmail";
import type { ExtractedLink, Finding } from "./types";
import { COMMONLY_IMPERSONATED_BRANDS, RISKY_TLDS, URL_SHORTENER_DOMAINS } from "./brandList";
import { getHostname, getRegistrableDomain, isIpLiteral, isPunycode } from "@/lib/utils/domain";

const RAW_URL_RE = /https?:\/\/[^\s"'<>()]+/gi;

function extractFromHtml(html: string): { href: string; text: string }[] {
  const $ = cheerio.load(html);
  const links: { href: string; text: string }[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const text = $(el).text().trim();
    if (/^https?:\/\//i.test(href)) {
      links.push({ href, text });
    }
  });
  return links;
}

function extractFromText(text: string): { href: string; text: string }[] {
  const matches = text.match(RAW_URL_RE) ?? [];
  return matches.map((href) => ({ href, text: href }));
}

function dedupeLinks(links: { href: string; text: string }[]): { href: string; text: string }[] {
  const seen = new Set<string>();
  const result: { href: string; text: string }[] = [];
  for (const link of links) {
    const key = `${link.href}::${link.text}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(link);
    }
  }
  return result;
}

function brandNameInSubdomainOnly(hostname: string, registrableDomain: string): string | null {
  const labels = hostname.split(".");
  const registrableLabels = registrableDomain.split(".");
  const subdomainLabels = labels.slice(0, labels.length - registrableLabels.length);
  if (subdomainLabels.length === 0) return null;
  const subdomainStr = subdomainLabels.join(".").toLowerCase();

  for (const brand of COMMONLY_IMPERSONATED_BRANDS) {
    const brandKey = brand.name.toLowerCase().replace(/\s+/g, "");
    if (subdomainStr.replace(/[.-]/g, "").includes(brandKey)) {
      const ownsRegistrable = brand.domains.some((d) => d === registrableDomain);
      if (!ownsRegistrable) return brand.name;
    }
  }
  return null;
}

export function analyzeLinks(email: NormalizedEmail): { findings: Finding[]; links: ExtractedLink[] } {
  const findings: Finding[] = [];

  // Only fall back to raw-text URL scraping for plain-text-only messages —
  // when HTML exists, `email.text` is derived from it (see parseEmail.ts) and
  // scraping both would duplicate every link and pick up html-to-text's
  // "label [url]" formatting artifacts (trailing brackets, etc).
  const rawLinks = dedupeLinks(
    email.html ? extractFromHtml(email.html) : email.text ? extractFromText(email.text) : []
  );

  const links: ExtractedLink[] = [];
  let flaggedCount = 0;

  for (const { href, text } of rawLinks) {
    const flags: string[] = [];
    let hostname: string | null = null;
    let domain: string | null = null;

    try {
      const urlObj = new URL(href);
      hostname = urlObj.hostname;
      domain = getRegistrableDomain(hostname);
    } catch {
      flags.push("unparseable-url");
    }

    if (hostname) {
      if (isIpLiteral(hostname)) flags.push("ip-literal");
      if (isPunycode(hostname)) flags.push("punycode-homograph");
      if (domain && URL_SHORTENER_DOMAINS.has(domain)) flags.push("url-shortener");
      if (domain) {
        const tld = domain.split(".").pop() ?? "";
        if (RISKY_TLDS.has(tld)) flags.push("risky-tld");
        const impersonated = brandNameInSubdomainOnly(hostname, domain);
        if (impersonated) flags.push(`brand-in-subdomain:${impersonated}`);
      }

      // Anchor text that itself looks like a URL/domain, but points elsewhere.
      const textDomainMatch = text.match(/([a-z0-9-]+\.)+[a-z]{2,}/i);
      if (textDomainMatch) {
        const textDomain = getRegistrableDomain(textDomainMatch[0]);
        if (textDomain && domain && textDomain !== domain) {
          flags.push("anchor-text-mismatch");
        }
      }
    }

    if (flags.length > 0) flaggedCount++;
    links.push({ href, text, domain: getHostname(href), flags });
  }

  const ipLinks = links.filter((l) => l.flags.includes("ip-literal"));
  if (ipLinks.length > 0) {
    findings.push({
      category: "links",
      severity: "high",
      title: "Link points to a raw IP address",
      detail:
        "One or more links point directly to a numeric IP address rather than a domain name. Legitimate organizations almost never link directly to bare IPs; this is a common way to bypass domain-based reputation checks.",
      evidence: ipLinks[0].href,
      weight: 20,
    });
  }

  const punycodeLinks = links.filter((l) => l.flags.includes("punycode-homograph"));
  if (punycodeLinks.length > 0) {
    findings.push({
      category: "links",
      severity: "critical",
      title: "Link uses punycode / lookalike characters",
      detail:
        "A link domain contains punycode (xn--) encoding, which is frequently used to display characters that visually mimic a trusted brand's domain (a homograph attack).",
      evidence: punycodeLinks[0].href,
      weight: 28,
    });
  }

  const shortenerLinks = links.filter((l) => l.flags.includes("url-shortener"));
  if (shortenerLinks.length > 0) {
    findings.push({
      category: "links",
      severity: "medium",
      title: "Link uses a URL shortener",
      detail:
        "One or more links use a URL-shortening service, which hides the true destination until clicked. This is not inherently malicious but is frequently used to disguise phishing links.",
      evidence: shortenerLinks[0].href,
      weight: 12,
    });
  }

  const riskyTldLinks = links.filter((l) => l.flags.includes("risky-tld"));
  if (riskyTldLinks.length > 0) {
    findings.push({
      category: "links",
      severity: "low",
      title: "Link uses a top-level domain often abused for spam/phishing",
      detail:
        "One or more links use a TLD (e.g. .zip, .top, .xyz, .click) that is disproportionately associated with spam and phishing campaigns due to low registration cost and weak vetting.",
      evidence: riskyTldLinks[0].href,
      weight: 8,
    });
  }

  const brandSubdomainLinks = links.filter((l) => l.flags.some((f) => f.startsWith("brand-in-subdomain:")));
  if (brandSubdomainLinks.length > 0) {
    const flag = brandSubdomainLinks[0].flags.find((f) => f.startsWith("brand-in-subdomain:"))!;
    const brand = flag.split(":")[1];
    findings.push({
      category: "links",
      severity: "high",
      title: `Link disguises an unrelated domain as "${brand}"`,
      detail: `A link's subdomain contains "${brand}", making it look official (e.g. "${brand.toLowerCase()}.something.example.com"), but the actual registrable domain is unrelated to ${brand}.`,
      evidence: brandSubdomainLinks[0].href,
      weight: 24,
    });
  }

  const mismatchLinks = links.filter((l) => l.flags.includes("anchor-text-mismatch"));
  if (mismatchLinks.length > 0) {
    findings.push({
      category: "links",
      severity: "high",
      title: "Displayed link text doesn't match its real destination",
      detail:
        "One or more links display one domain as clickable text but actually point to a completely different domain — a classic phishing disguise technique.",
      evidence: `Shown: "${mismatchLinks[0].text}" → Actual: ${mismatchLinks[0].href}`,
      weight: 22,
    });
  }

  if (links.length === 0) {
    findings.push({
      category: "links",
      severity: "info",
      title: "No links found",
      detail: "This message does not contain any hyperlinks.",
      weight: 0,
    });
  } else if (flaggedCount === 0) {
    findings.push({
      category: "links",
      severity: "info",
      title: "No suspicious links detected",
      detail: `Analyzed ${links.length} link(s); none matched known phishing patterns.`,
      weight: 0,
    });
  }

  return { findings, links };
}

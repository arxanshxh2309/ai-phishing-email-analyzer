import type { NormalizedEmail } from "./parseEmail";
import type { Finding } from "./types";
import { COMMONLY_IMPERSONATED_BRANDS, FREEMAIL_DOMAINS } from "./brandList";
import { extractEmailDomain, getRegistrableDomain } from "@/lib/utils/domain";
import { similarity } from "@/lib/utils/editDistance";

const LOOKALIKE_SIMILARITY_THRESHOLD = 0.75;

export function checkSpoofing(email: NormalizedEmail): Finding[] {
  const findings: Finding[] = [];

  const fromDomain = extractEmailDomain(email.fromAddress);
  const replyToDomain = extractEmailDomain(email.replyToAddress);

  // Reply-To domain differs from From domain.
  if (replyToDomain && fromDomain && replyToDomain !== fromDomain) {
    findings.push({
      category: "spoofing",
      severity: "medium",
      title: "Reply-To domain differs from sender domain",
      detail: `Replies to this message will go to "${replyToDomain}", which is different from the sender's domain "${fromDomain}". This is a common tactic to redirect victim replies to an attacker-controlled mailbox while the visible From address looks legitimate.`,
      evidence: `From: ${email.fromAddress}  Reply-To: ${email.replyToAddress}`,
      weight: 15,
    });
  }

  // Display name impersonates a brand while the actual domain doesn't match it.
  if (email.fromName && fromDomain) {
    const nameLower = email.fromName.toLowerCase();
    for (const brand of COMMONLY_IMPERSONATED_BRANDS) {
      if (nameLower.includes(brand.name.toLowerCase())) {
        const matchesOwnDomain = brand.domains.some((d) => fromDomain === d || fromDomain.endsWith(`.${d}`));
        if (!matchesOwnDomain) {
          findings.push({
            category: "spoofing",
            severity: "high",
            title: `Display name impersonates "${brand.name}"`,
            detail: `The sender's display name references "${brand.name}", but the actual email domain "${fromDomain}" does not belong to ${brand.name}. Attackers set a trusted-looking display name while sending from an unrelated address.`,
            evidence: `"${email.fromName}" <${email.fromAddress}>`,
            weight: 22,
          });
        }
        break;
      }
    }
  }

  // Lookalike / typosquat domain against curated brand list.
  if (fromDomain) {
    for (const brand of COMMONLY_IMPERSONATED_BRANDS) {
      for (const brandDomain of brand.domains) {
        if (fromDomain === brandDomain) continue;
        const sim = similarity(fromDomain, brandDomain);
        if (sim >= LOOKALIKE_SIMILARITY_THRESHOLD) {
          findings.push({
            category: "spoofing",
            severity: "critical",
            title: `Sender domain looks like "${brandDomain}"`,
            detail: `The sender domain "${fromDomain}" is suspiciously similar to the legitimate domain "${brandDomain}" (used by ${brand.name}). This is a classic typosquatting / lookalike-domain phishing technique.`,
            evidence: fromDomain,
            weight: 30,
          });
          break;
        }
      }
    }
  }

  // Sender uses a free webmail domain while display name implies a business/brand.
  if (fromDomain && FREEMAIL_DOMAINS.has(fromDomain) && email.fromName) {
    const looksLikeOrg = /\b(support|security|billing|account|team|service|admin|help desk|helpdesk|bank|dept|department)\b/i.test(
      email.fromName
    );
    if (looksLikeOrg) {
      findings.push({
        category: "spoofing",
        severity: "medium",
        title: "Business-sounding sender on a free email domain",
        detail: `The display name "${email.fromName}" suggests an official department or company, but the message was sent from a free consumer email domain ("${fromDomain}"). Legitimate organizations rarely use free webmail for official correspondence.`,
        evidence: `"${email.fromName}" <${email.fromAddress}>`,
        weight: 12,
      });
    }
  }

  // Return-Path / envelope-from mismatch, when available in headers.
  const returnPathHeader = email.headerLines.find((h) => h.key.toLowerCase() === "return-path");
  if (returnPathHeader) {
    const rpMatch = returnPathHeader.line.match(/<([^>]+)>/);
    const rpDomain = rpMatch ? getRegistrableDomain(rpMatch[1].split("@")[1] ?? "") : null;
    if (rpDomain && fromDomain && rpDomain !== fromDomain) {
      findings.push({
        category: "spoofing",
        severity: "low",
        title: "Return-Path domain differs from sender domain",
        detail: `The envelope Return-Path domain ("${rpDomain}") differs from the visible From domain ("${fromDomain}"). This can be legitimate (e.g. mailing list services) but is also seen in spoofed mail.`,
        weight: 6,
      });
    }
  }

  return findings;
}

import { fetchJsonGuarded } from "@/lib/net/guardedFetch";
import type { Finding } from "./types";

interface RdapEvent {
  eventAction?: string;
  eventDate?: string;
}
interface RdapResponse {
  events?: RdapEvent[];
}

export interface DomainAgeResult {
  domain: string;
  ageDays: number | null;
  registeredDate: string | null;
}

/**
 * `rdap.org` is a fixed, IANA-affiliated bootstrap entry point, but it
 * REDIRECTS to whichever registry's RDAP server is authoritative for the
 * looked-up TLD — meaning the actual final host is influenced by
 * attacker-controlled input (the domain in the email). It is deliberately
 * routed through `fetchJsonGuarded`, the same SSRF-guarded primitive used
 * for link-redirect resolution, rather than treated as a fully-trusted
 * single-host API call.
 */
export async function lookupDomainAge(domain: string): Promise<DomainAgeResult> {
  const empty: DomainAgeResult = { domain, ageDays: null, registeredDate: null };

  const data = await fetchJsonGuarded<RdapResponse>(`https://rdap.org/domain/${encodeURIComponent(domain)}`).catch(
    () => null
  );
  if (!data?.events) return empty;

  const registration = data.events.find((e) => e.eventAction === "registration");
  if (!registration?.eventDate) return empty;

  const registeredDate = new Date(registration.eventDate);
  if (Number.isNaN(registeredDate.getTime())) return empty;

  const ageDays = Math.floor((Date.now() - registeredDate.getTime()) / (1000 * 60 * 60 * 24));
  return { domain, ageDays, registeredDate: registeredDate.toISOString() };
}

/** Looks up multiple domains concurrently; individual failures never throw or block the others. */
export async function lookupDomainAges(domains: string[]): Promise<DomainAgeResult[]> {
  const results = await Promise.allSettled(domains.map(lookupDomainAge));
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { domain: domains[i], ageDays: null, registeredDate: null }
  );
}

function ageFinding(domain: string, ageDays: number, isSender: boolean): Finding | null {
  const subject = isSender ? "The sender's domain" : "A linked domain";
  const category = isSender ? "spoofing" : "links";

  if (ageDays < 7) {
    return {
      category,
      severity: "high",
      title: `${isSender ? "Sender" : "Link"} domain registered ${ageDays} day${ageDays === 1 ? "" : "s"} ago`,
      detail: `${subject} ("${domain}") was registered only ${ageDays} day${ageDays === 1 ? "" : "s"} ago. Brand-new domains are heavily over-represented in phishing campaigns since attackers routinely burn through disposable domains.`,
      weight: 20,
    };
  }
  if (ageDays < 30) {
    return {
      category,
      severity: "medium",
      title: `${isSender ? "Sender" : "Link"} domain registered ${ageDays} days ago`,
      detail: `${subject} ("${domain}") was registered less than a month ago — still an uncommonly short lifetime for an established sender.`,
      weight: 12,
    };
  }
  if (ageDays < 90) {
    return {
      category,
      severity: "low",
      title: `${isSender ? "Sender" : "Link"} domain registered ${Math.round(ageDays / 30)} months ago`,
      detail: `${subject} ("${domain}") is relatively new (under 3 months old).`,
      weight: 4,
    };
  }
  return null;
}

/**
 * Looks up the sender's From domain and up to `maxLinkDomains` distinct
 * link domains concurrently. A lookup failure/timeout NEVER produces a
 * finding or affects the score — only a confirmed young registration date
 * does. Non-fatal and bounded, safe to call on every scan.
 */
export async function analyzeDomainAge(
  fromDomain: string | null,
  linkDomains: string[],
  maxLinkDomains = 3
): Promise<Finding[]> {
  const uniqueLinkDomains = [...new Set(linkDomains)].filter((d) => d && d !== fromDomain).slice(0, maxLinkDomains);
  const domainsToCheck = [...(fromDomain ? [fromDomain] : []), ...uniqueLinkDomains];
  if (domainsToCheck.length === 0) return [];

  const results = await lookupDomainAges(domainsToCheck);

  const findings: Finding[] = [];
  for (const result of results) {
    if (result.ageDays === null) continue;
    const finding = ageFinding(result.domain, result.ageDays, result.domain === fromDomain);
    if (finding) findings.push(finding);
  }
  return findings;
}

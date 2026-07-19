import { parse } from "tldts";

export function getRegistrableDomain(hostOrUrl: string): string | null {
  const parsed = parse(hostOrUrl);
  return parsed.domain ?? null;
}

export function getHostname(hostOrUrl: string): string | null {
  const parsed = parse(hostOrUrl);
  return parsed.hostname ?? null;
}

export function isIpLiteral(hostOrUrl: string): boolean {
  const parsed = parse(hostOrUrl);
  if (parsed.isIp) return true;
  const host = parsed.hostname ?? hostOrUrl;
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /^\[?[0-9a-f:]+\]?$/i.test(host) && host.includes(":");
}

export function isPunycode(hostOrUrl: string): boolean {
  const hostname = getHostname(hostOrUrl) ?? hostOrUrl;
  return hostname.split(".").some((label) => label.startsWith("xn--"));
}

export function domainsMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

export function extractEmailDomain(address: string | null | undefined): string | null {
  if (!address) return null;
  const match = address.match(/@([^\s>]+)/);
  if (!match) return null;
  return getRegistrableDomain(match[1]) ?? match[1].toLowerCase();
}

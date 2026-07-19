import ipaddr from "ipaddr.js";

/**
 * Allowlist-of-one check: an address must PROVE it's globally routable
 * ("unicast" per ipaddr.js's range classifier) to be considered safe to
 * connect to. This is deliberately an allowlist rather than a denylist
 * enumerating known-private CIDR blocks — a denylist can miss ranges
 * (CGNAT 100.64.0.0/10, Teredo, 6to4, benchmarking, etc); requiring
 * "unicast" fails closed for anything not explicitly known-public,
 * including the cloud metadata address 169.254.169.254.
 */
export function isPublicUnicastIp(ip: string): boolean {
  let addr: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    addr = ipaddr.process(ip); // unwraps IPv4-mapped IPv6 (::ffff:a.b.c.d) automatically
  } catch {
    return false;
  }
  return addr.range() === "unicast";
}

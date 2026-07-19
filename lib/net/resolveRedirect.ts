import * as https from "node:https";
import * as http from "node:http";
import * as dns from "node:dns";
import { isPublicUnicastIp } from "./ipGuard";

export interface ResolveResult {
  finalUrl: string | null;
  chain: string[];
  blockedPrivateIp: boolean;
  error?: string;
}

const MAX_HOPS = 5;
const PER_HOP_TIMEOUT_MS = 4000;
const TOTAL_BUDGET_MS = 10000;

function resolveHostnameIps(hostname: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
      if (err) return reject(err);
      resolve(addresses.map((a) => a.address));
    });
  });
}

function requestHeadOnly(
  url: URL,
  pinnedIp: string,
  method: "HEAD" | "GET",
  timeoutMs: number
): Promise<{ status: number; location: string | null }> {
  return new Promise((resolve, reject) => {
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;

    const req = lib.request(
      {
        method,
        hostname: pinnedIp, // connect to the pre-validated IP, not a re-resolved hostname
        port: url.port ? Number(url.port) : isHttps ? 443 : 80,
        path: url.pathname + url.search,
        headers: {
          Host: url.hostname,
          "User-Agent": "phishguard-link-checker/1.0",
          Accept: "*/*",
        },
        servername: isHttps ? url.hostname : undefined, // correct TLS SNI/cert check against the real hostname
        timeout: timeoutMs,
        agent: false, // no connection/cookie reuse across requests
      },
      (res) => {
        resolve({ status: res.statusCode ?? 0, location: (res.headers.location as string) ?? null });
        res.resume();
        res.destroy(); // never buffer/consume the body
      }
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

/**
 * Follows HTTP redirects from `startUrl` to their final destination, with
 * SSRF protections applied fresh at every hop:
 *  1. scheme must be http/https
 *  2. every resolved IP (not just the first) must be public-unicast
 *  3. the actual TCP connection is pinned to the validated IP (closes the
 *     DNS-rebinding TOCTOU gap between validation and connect)
 *  4. HEAD-only, no body ever consumed; no cookies/credentials forwarded
 *  5. bounded hop count and total wall-clock budget
 *
 * A redirect target resolving to a private/reserved IP is reported via
 * `blockedPrivateIp: true` rather than silently dropped — that's itself a
 * meaningful signal worth surfacing to the caller as a finding.
 */
export async function resolveRedirectChain(startUrl: string): Promise<ResolveResult> {
  const chain: string[] = [];
  let currentUrl: URL;

  try {
    currentUrl = new URL(startUrl);
  } catch {
    return { finalUrl: null, chain, blockedPrivateIp: false, error: "invalid-url" };
  }

  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    if (currentUrl.protocol !== "http:" && currentUrl.protocol !== "https:") {
      return { finalUrl: null, chain, blockedPrivateIp: false, error: "non-http-scheme" };
    }
    chain.push(currentUrl.toString());

    if (Date.now() > deadline) {
      return { finalUrl: currentUrl.toString(), chain, blockedPrivateIp: false, error: "budget-exceeded" };
    }

    let ips: string[];
    try {
      ips = await resolveHostnameIps(currentUrl.hostname);
    } catch {
      return { finalUrl: null, chain, blockedPrivateIp: false, error: "dns-error" };
    }

    if (ips.length === 0 || !ips.every(isPublicUnicastIp)) {
      return { finalUrl: null, chain, blockedPrivateIp: true };
    }

    const remaining = Math.max(500, deadline - Date.now());
    const timeout = Math.min(PER_HOP_TIMEOUT_MS, remaining);

    let response: { status: number; location: string | null };
    try {
      response = await requestHeadOnly(currentUrl, ips[0], "HEAD", timeout);
      if (response.status === 405 || response.status === 0) {
        response = await requestHeadOnly(currentUrl, ips[0], "GET", timeout);
      }
    } catch {
      return { finalUrl: null, chain, blockedPrivateIp: false, error: "request-failed" };
    }

    if (response.status >= 300 && response.status < 400 && response.location) {
      try {
        currentUrl = new URL(response.location, currentUrl);
      } catch {
        return { finalUrl: null, chain, blockedPrivateIp: false, error: "invalid-redirect-location" };
      }
      continue;
    }

    return { finalUrl: currentUrl.toString(), chain, blockedPrivateIp: false };
  }

  return { finalUrl: currentUrl.toString(), chain, blockedPrivateIp: false, error: "too-many-redirects" };
}

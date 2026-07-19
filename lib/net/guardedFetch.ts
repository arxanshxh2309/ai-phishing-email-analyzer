import * as https from "node:https";
import * as http from "node:http";
import * as dns from "node:dns";
import { isPublicUnicastIp } from "./ipGuard";

const MAX_HOPS = 4;
const PER_HOP_TIMEOUT_MS = 4000;
const TOTAL_BUDGET_MS = 8000;
const MAX_BODY_BYTES = 100 * 1024;

function resolveHostnameIps(hostname: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
      if (err) return reject(err);
      resolve(addresses.map((a) => a.address));
    });
  });
}

function getCapped(
  url: URL,
  pinnedIp: string,
  timeoutMs: number
): Promise<{ status: number; location: string | null; body: string | null }> {
  return new Promise((resolve, reject) => {
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;

    const req = lib.request(
      {
        method: "GET",
        hostname: pinnedIp,
        port: url.port ? Number(url.port) : isHttps ? 443 : 80,
        path: url.pathname + url.search,
        headers: { Host: url.hostname, "User-Agent": "phishguard-domain-lookup/1.0", Accept: "application/json" },
        servername: isHttps ? url.hostname : undefined,
        timeout: timeoutMs,
        agent: false,
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
          resolve({ status: res.statusCode, location: (res.headers.location as string) ?? null, body: null });
          res.resume();
          res.destroy();
          return;
        }
        let received = 0;
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => {
          received += chunk.length;
          if (received > MAX_BODY_BYTES) {
            res.destroy();
            resolve({ status: res.statusCode ?? 0, location: null, body: Buffer.concat(chunks).toString("utf8") });
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          resolve({ status: res.statusCode ?? 0, location: null, body: Buffer.concat(chunks).toString("utf8") });
        });
        res.on("error", reject);
      }
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

/**
 * Same SSRF-guarding discipline as `resolveRedirectChain` (fresh scheme +
 * DNS + IP-unicast validation at every hop, connection pinned to the
 * validated IP), but follows redirects to completion and reads a small,
 * byte-capped JSON body — for trusted-but-redirecting APIs like RDAP
 * bootstrap redirectors, where the final host is influenced by attacker
 * input (the TLD being looked up) even though the entry point is fixed.
 */
export async function fetchJsonGuarded<T>(startUrl: string): Promise<T | null> {
  let currentUrl: URL;
  try {
    currentUrl = new URL(startUrl);
  } catch {
    return null;
  }

  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    if (currentUrl.protocol !== "http:" && currentUrl.protocol !== "https:") return null;
    if (Date.now() > deadline) return null;

    let ips: string[];
    try {
      ips = await resolveHostnameIps(currentUrl.hostname);
    } catch {
      return null;
    }
    if (ips.length === 0 || !ips.every(isPublicUnicastIp)) return null;

    const remaining = Math.max(500, deadline - Date.now());
    const timeout = Math.min(PER_HOP_TIMEOUT_MS, remaining);

    let response: { status: number; location: string | null; body: string | null };
    try {
      response = await getCapped(currentUrl, ips[0], timeout);
    } catch {
      return null;
    }

    if (response.status >= 300 && response.status < 400 && response.location) {
      try {
        currentUrl = new URL(response.location, currentUrl);
      } catch {
        return null;
      }
      continue;
    }

    if (!response.body) return null;
    try {
      return JSON.parse(response.body) as T;
    } catch {
      return null;
    }
  }

  return null;
}

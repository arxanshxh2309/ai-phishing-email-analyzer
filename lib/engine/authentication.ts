import type { NormalizedEmail } from "./parseEmail";
import type { Finding } from "./types";

type AuthVerdict = "pass" | "fail" | "softfail" | "neutral" | "none" | "temperror" | "permerror" | "unknown";

function extractVerdict(authResultsValue: string, mechanism: "spf" | "dkim" | "dmarc"): AuthVerdict | null {
  const re = new RegExp(`${mechanism}\\s*=\\s*(\\w+)`, "i");
  const match = authResultsValue.match(re);
  if (!match) return null;
  const raw = match[1].toLowerCase();
  const known: AuthVerdict[] = ["pass", "fail", "softfail", "neutral", "none", "temperror", "permerror"];
  return known.includes(raw as AuthVerdict) ? (raw as AuthVerdict) : "unknown";
}

function getHeaderLineValues(email: NormalizedEmail, key: string): string[] {
  return email.headerLines
    .filter((h) => h.key.toLowerCase() === key.toLowerCase())
    .map((h) => h.line.slice(h.line.indexOf(":") + 1).trim());
}

export function checkAuthentication(email: NormalizedEmail): Finding[] {
  const findings: Finding[] = [];

  const authResultsLines = getHeaderLineValues(email, "authentication-results");
  const receivedSpfLines = getHeaderLineValues(email, "received-spf");

  let spf: AuthVerdict | null = null;
  let dkim: AuthVerdict | null = null;
  let dmarc: AuthVerdict | null = null;

  for (const line of authResultsLines) {
    spf = spf ?? extractVerdict(line, "spf");
    dkim = dkim ?? extractVerdict(line, "dkim");
    dmarc = dmarc ?? extractVerdict(line, "dmarc");
  }

  if (!spf && receivedSpfLines.length > 0) {
    const first = receivedSpfLines[0].toLowerCase();
    if (first.startsWith("pass")) spf = "pass";
    else if (first.startsWith("fail")) spf = "fail";
    else if (first.startsWith("softfail")) spf = "softfail";
    else if (first.startsWith("neutral")) spf = "neutral";
    else if (first.startsWith("none")) spf = "none";
  }

  if (authResultsLines.length === 0 && receivedSpfLines.length === 0) {
    findings.push({
      category: "authentication",
      severity: "medium",
      title: "No authentication results found",
      detail:
        "This message has no Authentication-Results or Received-SPF headers, so SPF/DKIM/DMARC status could not be verified. This is common for forwarded mail or manually pasted content, but also for spoofed mail sent directly to a victim.",
      weight: 10,
    });
    return findings;
  }

  if (spf === "fail" || spf === "softfail") {
    findings.push({
      category: "authentication",
      severity: spf === "fail" ? "high" : "medium",
      title: `SPF ${spf === "fail" ? "failed" : "soft-failed"}`,
      detail:
        "The sending server is not authorized to send mail for this domain according to its SPF record. This is a strong indicator of a spoofed sender address.",
      evidence: receivedSpfLines[0] ?? authResultsLines[0],
      weight: spf === "fail" ? 25 : 12,
      code: "auth.spf_fail",
    });
  } else if (spf === "pass") {
    findings.push({
      category: "authentication",
      severity: "info",
      title: "SPF passed",
      detail: "The sending server is authorized to send mail for this domain.",
      weight: 0,
    });
  }

  if (dkim === "fail") {
    findings.push({
      category: "authentication",
      severity: "high",
      title: "DKIM failed",
      detail:
        "The message's DKIM signature failed verification, meaning its content or headers may have been altered in transit, or the signature is invalid/spoofed.",
      evidence: authResultsLines[0],
      weight: 22,
      code: "auth.dkim_fail",
    });
  } else if (dkim === "pass") {
    findings.push({
      category: "authentication",
      severity: "info",
      title: "DKIM passed",
      detail: "The message's DKIM signature is valid.",
      weight: 0,
    });
  }

  if (dmarc === "fail") {
    findings.push({
      category: "authentication",
      severity: "critical",
      title: "DMARC failed",
      detail:
        "The message fails the domain's DMARC policy, meaning it did not properly align with SPF or DKIM for the From domain. Legitimate senders almost never fail DMARC.",
      evidence: authResultsLines[0],
      weight: 30,
      code: "auth.dmarc_fail",
    });
  } else if (dmarc === "pass") {
    findings.push({
      category: "authentication",
      severity: "info",
      title: "DMARC passed",
      detail: "The message aligns with the domain's DMARC policy.",
      weight: 0,
    });
  }

  return findings;
}

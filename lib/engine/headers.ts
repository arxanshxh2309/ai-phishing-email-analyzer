import type { NormalizedEmail } from "./parseEmail";
import type { Finding } from "./types";
import { extractEmailDomain, getRegistrableDomain } from "@/lib/utils/domain";

export function checkHeaderAnomalies(email: NormalizedEmail): Finding[] {
  const findings: Finding[] = [];

  const fromDomain = extractEmailDomain(email.fromAddress);
  const messageIdDomain = email.messageId
    ? getRegistrableDomain(email.messageId.replace(/[<>]/g, "").split("@")[1] ?? "")
    : null;

  if (fromDomain && messageIdDomain && fromDomain !== messageIdDomain) {
    findings.push({
      category: "headers",
      severity: "info",
      title: "Message-ID domain differs from sender domain",
      detail: `The Message-ID header domain ("${messageIdDomain}") differs from the From address domain ("${fromDomain}"). This is common with mailing-list and marketing platforms, but occasionally seen with spoofed mail.`,
      weight: 4,
    });
  }

  const receivedLines = email.headerLines.filter((h) => h.key.toLowerCase() === "received");
  if (receivedLines.length === 0 && email.fromAddress) {
    findings.push({
      category: "headers",
      severity: "info",
      title: "No Received headers present",
      detail:
        "This message has no Received headers showing its delivery path. This is expected for pasted/forwarded content but would be unusual for a directly-delivered message.",
      weight: 3,
    });
  }

  if (findings.length === 0) {
    findings.push({
      category: "headers",
      severity: "info",
      title: "No header anomalies detected",
      detail: "Message-ID and delivery headers appear consistent.",
      weight: 0,
    });
  }

  return findings;
}

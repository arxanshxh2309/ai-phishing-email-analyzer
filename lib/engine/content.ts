import type { NormalizedEmail } from "./parseEmail";
import type { Finding } from "./types";

const URGENCY_PATTERNS = [
  /\baccount\s+(will be|has been)\s+(suspend|clos|lock|terminat|delet)/i,
  /\bwithin\s+(24|48|12)\s*hours\b/i,
  /\bact(ion)?\s+(now|required|immediately)\b/i,
  /\burgent(ly)?\b/i,
  /\bimmediate(ly)?\s+action\b/i,
  /\bverify\s+your\s+(account|identity|information)\s+(now|immediately|today)\b/i,
  /\bfailure\s+to\s+(respond|verify|update)\b/i,
  /\byour\s+(payment|order|delivery)\s+(failed|could not be processed|was declined)\b/i,
  /\bfinal\s+(notice|warning|reminder)\b/i,
  /\bsuspicious\s+(activity|login|sign-?in)\s+(detected|on your account)\b/i,
];

const CREDENTIAL_HARVEST_PATTERNS = [
  /\bconfirm\s+your\s+(password|username|ssn|social security)\b/i,
  /\bupdate\s+your\s+(billing|payment|card)\s+(information|details)\b/i,
  /\bclick\s+(here|below)\s+to\s+(verify|confirm|log ?in|sign ?in|update)\b/i,
  /\benter\s+your\s+(login|credentials|password)\b/i,
  /\bre-?enter\s+your\s+(password|details)\b/i,
  /\bwire\s+transfer\b/i,
  /\bgift\s?cards?\b.{0,40}\b(purchase|send|buy)\b/i,
];

const GENERIC_GREETING_PATTERNS = [
  /^\s*dear\s+(customer|user|member|valued customer|sir\/?madam|account holder)\b/im,
  /^\s*hello\s+(customer|user|member)\b/im,
];

const SENSITIVE_INFO_REQUEST_PATTERNS = [
  /\b(ssn|social security number)\b/i,
  /\bdate of birth\b/i,
  /\b(bank account|routing)\s+number\b/i,
  /\bcredit card\s+(number|details)\b/i,
  /\bone-?time\s+(passcode|password|code)\b/i,
  /\b2fa\s+code\b/i,
];

function countMatches(text: string, patterns: RegExp[]): { count: number; example: string | null } {
  let count = 0;
  let example: string | null = null;
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      count++;
      if (!example) example = match[0].replace(/\s+/g, " ").trim();
    }
  }
  return { count, example };
}

export function analyzeContent(email: NormalizedEmail): Finding[] {
  const findings: Finding[] = [];
  const text = (email.text ?? "") + "\n" + (email.subject ?? "");

  if (!text.trim()) {
    return findings;
  }

  const urgency = countMatches(text, URGENCY_PATTERNS);
  const credential = countMatches(text, CREDENTIAL_HARVEST_PATTERNS);
  const greeting = countMatches(text, GENERIC_GREETING_PATTERNS);
  const sensitive = countMatches(text, SENSITIVE_INFO_REQUEST_PATTERNS);

  // Require co-occurrence of at least two weak signals, or one strong signal,
  // to keep false positives low on legitimate transactional/marketing email.
  if (urgency.count > 0) {
    findings.push({
      category: "content",
      severity: urgency.count >= 2 ? "medium" : "low",
      title: "Urgency / pressure language detected",
      detail:
        "The message uses language designed to create urgency or fear (e.g. account suspension threats, tight deadlines), a common social-engineering pressure tactic.",
      evidence: urgency.example ?? undefined,
      weight: urgency.count >= 2 ? 12 : 6,
    });
  }

  if (credential.count > 0) {
    findings.push({
      category: "content",
      severity: credential.count >= 2 ? "high" : "medium",
      title: "Credential or payment-detail harvesting language",
      detail:
        "The message asks the recipient to confirm, verify, or re-enter credentials, payment details, or asks for a wire transfer / gift cards — common phishing and fraud requests.",
      evidence: credential.example ?? undefined,
      weight: credential.count >= 2 ? 20 : 10,
      code: "content.credential_harvest",
    });
  }

  if (sensitive.count > 0) {
    findings.push({
      category: "content",
      severity: "high",
      title: "Requests highly sensitive personal information",
      detail:
        "The message references sensitive data such as SSNs, bank account numbers, or one-time passcodes. Legitimate organizations rarely request this information over email.",
      evidence: sensitive.example ?? undefined,
      weight: 18,
      code: "content.sensitive_info_request",
    });
  }

  if (greeting.count > 0 && (urgency.count > 0 || credential.count > 0)) {
    findings.push({
      category: "content",
      severity: "low",
      title: "Generic greeting combined with a call to action",
      detail:
        "The message uses an impersonal greeting (e.g. \"Dear Customer\") rather than the recipient's name, while also asking for urgent action — legitimate account-specific emails usually address the recipient by name.",
      evidence: greeting.example ?? undefined,
      weight: 6,
    });
  }

  if (findings.length === 0) {
    findings.push({
      category: "content",
      severity: "info",
      title: "No social-engineering language patterns detected",
      detail: "The message body did not match known urgency, credential-harvesting, or sensitive-data-request patterns.",
      weight: 0,
    });
  }

  return findings;
}

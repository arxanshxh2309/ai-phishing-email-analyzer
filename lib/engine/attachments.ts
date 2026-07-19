import type { NormalizedEmail } from "./parseEmail";
import type { Finding } from "./types";
import { DANGEROUS_ATTACHMENT_EXTENSIONS, OFFICE_MACRO_EXTENSIONS } from "./brandList";

function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

// Detects a double extension trick, e.g. "invoice.pdf.exe".
function hasDoubleExtensionTrick(filename: string): boolean {
  const parts = filename.toLowerCase().split(".");
  if (parts.length < 3) return false;
  const finalExt = parts[parts.length - 1];
  const priorExt = parts[parts.length - 2];
  const commonBenign = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "png", "txt"];
  return DANGEROUS_ATTACHMENT_EXTENSIONS.has(finalExt) && commonBenign.includes(priorExt);
}

export function checkAttachments(email: NormalizedEmail): Finding[] {
  const findings: Finding[] = [];

  if (email.attachments.length === 0) {
    return findings;
  }

  const dangerous: string[] = [];
  const macros: string[] = [];
  const doubleExt: string[] = [];

  for (const att of email.attachments) {
    if (!att.filename) continue;
    const ext = getExtension(att.filename);

    if (DANGEROUS_ATTACHMENT_EXTENSIONS.has(ext)) dangerous.push(att.filename);
    if (OFFICE_MACRO_EXTENSIONS.has(ext)) macros.push(att.filename);
    if (hasDoubleExtensionTrick(att.filename)) doubleExt.push(att.filename);
  }

  if (dangerous.length > 0) {
    findings.push({
      category: "attachments",
      severity: "critical",
      title: "Potentially dangerous attachment type",
      detail:
        "This message includes an attachment with a file type commonly used to deliver malware (executables, scripts, or disk images). Do not open this attachment unless you are certain of its origin.",
      evidence: dangerous.join(", "),
      weight: 30,
    });
  }

  if (doubleExt.length > 0) {
    findings.push({
      category: "attachments",
      severity: "critical",
      title: "Attachment uses a disguised double file extension",
      detail:
        "One or more attachments use a double extension (e.g. \"invoice.pdf.exe\") to make a dangerous file appear to be a harmless document at a glance.",
      evidence: doubleExt.join(", "),
      weight: 25,
    });
  }

  if (macros.length > 0) {
    findings.push({
      category: "attachments",
      severity: "high",
      title: "Macro-enabled Office document attached",
      detail:
        "This message includes a macro-enabled Office file (e.g. .docm, .xlsm). Macro documents are a common malware delivery method — only enable macros if you fully trust the sender.",
      evidence: macros.join(", "),
      weight: 18,
    });
  }

  if (dangerous.length === 0 && doubleExt.length === 0 && macros.length === 0) {
    findings.push({
      category: "attachments",
      severity: "info",
      title: "No high-risk attachment types detected",
      detail: `${email.attachments.length} attachment(s) analyzed; none matched known dangerous file-type patterns.`,
      weight: 0,
    });
  }

  return findings;
}

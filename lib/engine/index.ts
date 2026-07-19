import { parseEmailSource } from "./parseEmail";
import { checkAuthentication } from "./authentication";
import { checkSpoofing } from "./spoofing";
import { analyzeLinks } from "./links";
import { analyzeContent } from "./content";
import { checkAttachments } from "./attachments";
import { checkHeaderAnomalies } from "./headers";
import { scoreFindings } from "./scoring";
import type { ScanResult } from "./types";

export async function runEngine(source: string | Buffer): Promise<ScanResult> {
  const email = await parseEmailSource(source);

  const { findings: linkFindings, links } = analyzeLinks(email);

  const findings = [
    ...checkAuthentication(email),
    ...checkSpoofing(email),
    ...linkFindings,
    ...analyzeContent(email),
    ...checkAttachments(email),
    ...checkHeaderAnomalies(email),
  ];

  const { score, tier, categoryScores } = scoreFindings(findings);

  return {
    score,
    tier,
    findings,
    categoryScores,
    links,
    summary: {
      from: email.fromAddress,
      fromName: email.fromName,
      replyTo: email.replyToAddress,
      subject: email.subject,
      date: email.date,
      attachmentCount: email.attachments.length,
    },
  };
}

export * from "./types";

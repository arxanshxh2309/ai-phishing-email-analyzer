import { parseEmailSource } from "./parseEmail";
import { checkAuthentication } from "./authentication";
import { checkSpoofing } from "./spoofing";
import { analyzeLinks } from "./links";
import { analyzeContent } from "./content";
import { checkAttachments } from "./attachments";
import { checkHeaderAnomalies } from "./headers";
import { scoreFindings } from "./scoring";
import { sanitizeEmailHtml } from "./sanitizeHtml";
import { analyzeDomainAge } from "./domainAge";
import { extractEmailDomain, getRegistrableDomain } from "@/lib/utils/domain";
import type { ScanResult } from "./types";

export async function runEngine(source: string | Buffer): Promise<ScanResult> {
  const email = await parseEmailSource(source);

  const { findings: linkFindings, links } = analyzeLinks(email);
  const preview = email.html ? sanitizeEmailHtml(email.html) : null;

  const fromDomain = extractEmailDomain(email.fromAddress);
  const linkDomains = links
    .map((l) => (l.domain ? getRegistrableDomain(l.domain) : null))
    .filter((d): d is string => Boolean(d));
  const domainAgeFindings = await analyzeDomainAge(fromDomain, linkDomains).catch(() => []);

  const findings = [
    ...checkAuthentication(email),
    ...checkSpoofing(email),
    ...linkFindings,
    ...analyzeContent(email),
    ...checkAttachments(email),
    ...checkHeaderAnomalies(email),
    ...domainAgeFindings,
  ];

  const { score, tier, categoryScores } = scoreFindings(findings);

  return {
    score,
    tier,
    findings,
    categoryScores,
    links,
    preview,
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

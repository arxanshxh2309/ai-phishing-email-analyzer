export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type Category =
  | "authentication"
  | "spoofing"
  | "links"
  | "content"
  | "attachments"
  | "headers";

export interface Finding {
  category: Category;
  severity: Severity;
  title: string;
  detail: string;
  evidence?: string;
  weight: number;
  /** Stable machine ID, e.g. "auth.dmarc_fail" — used to look up a MITRE ATT&CK tag. Optional. */
  code?: string;
}

export type RiskTier = "safe" | "suspicious" | "dangerous";

export interface CategoryScore {
  category: Category;
  score: number;
  findingCount: number;
}

export interface ExtractedLink {
  href: string;
  text: string;
  domain: string | null;
  flags: string[];
}

export interface PreviewData {
  html: string;
  blockedImages: number;
  truncated: boolean;
}

export interface ScanResult {
  score: number;
  tier: RiskTier;
  findings: Finding[];
  categoryScores: CategoryScore[];
  links: ExtractedLink[];
  preview: PreviewData | null;
  summary: {
    from: string | null;
    fromName: string | null;
    replyTo: string | null;
    subject: string | null;
    date: string | null;
    attachmentCount: number;
  };
}

export interface EngineInput {
  source: "paste" | "upload" | "gmail";
}

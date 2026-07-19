import type { RiskTier, Severity } from "@/lib/engine/types";

export const TIER_META: Record<RiskTier, { label: string; colorVar: string; description: string }> = {
  safe: {
    label: "Safe",
    colorVar: "var(--status-good)",
    description: "No significant phishing indicators were found.",
  },
  suspicious: {
    label: "Suspicious",
    colorVar: "var(--status-warning)",
    description: "Some indicators are present. Proceed with caution.",
  },
  dangerous: {
    label: "Dangerous",
    colorVar: "var(--status-critical)",
    description: "Strong phishing indicators detected. Do not click links or open attachments.",
  },
};

export const SEVERITY_META: Record<Severity, { label: string; colorVar: string }> = {
  info: { label: "Info", colorVar: "var(--muted-foreground)" },
  low: { label: "Low", colorVar: "var(--status-good)" },
  medium: { label: "Medium", colorVar: "var(--status-warning)" },
  high: { label: "High", colorVar: "var(--status-critical)" },
  critical: { label: "Critical", colorVar: "var(--status-critical)" },
};

export const CATEGORY_LABELS: Record<string, string> = {
  authentication: "Authentication",
  spoofing: "Sender & spoofing",
  links: "Links",
  content: "Language & content",
  attachments: "Attachments",
  headers: "Headers",
};

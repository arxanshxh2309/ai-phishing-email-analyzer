import type { Category, CategoryScore, Finding, RiskTier } from "./types";

const CATEGORY_CAPS: Record<Category, number> = {
  authentication: 40,
  spoofing: 45,
  links: 45,
  content: 25,
  attachments: 30,
  headers: 8,
};

const SAFE_THRESHOLD = 25;
const DANGEROUS_THRESHOLD = 60;

export function scoreFindings(findings: Finding[]): {
  score: number;
  tier: RiskTier;
  categoryScores: CategoryScore[];
} {
  const byCategory = new Map<Category, Finding[]>();
  for (const finding of findings) {
    const list = byCategory.get(finding.category) ?? [];
    list.push(finding);
    byCategory.set(finding.category, list);
  }

  const categoryScores: CategoryScore[] = [];
  let total = 0;

  for (const category of Object.keys(CATEGORY_CAPS) as Category[]) {
    const list = byCategory.get(category) ?? [];
    const rawSum = list.reduce((acc, f) => acc + f.weight, 0);
    const capped = Math.min(rawSum, CATEGORY_CAPS[category]);
    total += capped;
    categoryScores.push({
      category,
      score: capped,
      findingCount: list.filter((f) => f.weight > 0).length,
    });
  }

  const score = Math.max(0, Math.min(100, Math.round(total)));
  const tier: RiskTier = score < SAFE_THRESHOLD ? "safe" : score < DANGEROUS_THRESHOLD ? "suspicious" : "dangerous";

  return { score, tier, categoryScores };
}

import { CheckCircle2 } from "lucide-react";
import type { Category, Finding } from "@/lib/engine/types";
import { CATEGORY_LABELS } from "@/lib/tier";
import { FindingCard } from "@/components/FindingCard";
import { StaggerItem, StaggerList } from "@/components/motion/StaggerList";

const CATEGORY_ORDER: Category[] = ["authentication", "spoofing", "links", "content", "attachments", "headers"];

export function FindingsList({ findings }: { findings: Finding[] }) {
  const byCategory = new Map<Category, Finding[]>();
  for (const f of findings) {
    const list = byCategory.get(f.category) ?? [];
    list.push(f);
    byCategory.set(f.category, list);
  }

  return (
    <StaggerList className="flex flex-col gap-5">
      {CATEGORY_ORDER.map((category) => {
        const list = byCategory.get(category) ?? [];
        if (list.length === 0) return null;

        const hasIssues = list.some((f) => f.weight > 0);
        const sorted = [...list].sort((a, b) => b.weight - a.weight);

        return (
          <StaggerItem key={category}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {CATEGORY_LABELS[category] ?? category}
            </h3>
            {hasIssues ? (
              <div className="flex flex-col gap-2">
                {sorted.map((f, i) => (
                  <FindingCard key={i} finding={f} />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <CheckCircle2 size={16} className="shrink-0" style={{ color: "var(--status-good)" }} aria-hidden />
                {sorted[0]?.detail ?? "No issues detected."}
              </div>
            )}
          </StaggerItem>
        );
      })}
    </StaggerList>
  );
}

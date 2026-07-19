import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { Finding } from "@/lib/engine/types";
import { SEVERITY_META } from "@/lib/tier";
import { Badge } from "@/components/ui/badge";

function SeverityIcon({ severity }: { severity: Finding["severity"] }) {
  if (severity === "info") return <Info size={14} aria-hidden />;
  if (severity === "critical" || severity === "high") return <ShieldAlert size={14} aria-hidden />;
  return <AlertTriangle size={14} aria-hidden />;
}

export function FindingCard({ finding }: { finding: Finding }) {
  const meta = SEVERITY_META[finding.severity];
  const isInfo = finding.severity === "info";

  return (
    <div
      className={`rounded-lg border p-4 ${isInfo ? "bg-muted/40" : "bg-card"}`}
      style={{ borderColor: isInfo ? undefined : `color-mix(in oklch, ${meta.colorVar} 35%, var(--border))` }}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium">{finding.title}</h4>
        <Badge
          variant="outline"
          className="shrink-0 gap-1 text-xs"
          style={{ color: meta.colorVar, borderColor: meta.colorVar }}
        >
          <SeverityIcon severity={finding.severity} />
          {meta.label}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{finding.detail}</p>
      {finding.evidence && (
        <code className="mt-2 block break-all rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
          {finding.evidence}
        </code>
      )}
    </div>
  );
}

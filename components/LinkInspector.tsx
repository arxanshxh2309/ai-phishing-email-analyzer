import { AlertTriangle, ExternalLink } from "lucide-react";
import type { ExtractedLink } from "@/lib/engine/types";

const FLAG_LABELS: Record<string, string> = {
  "ip-literal": "Raw IP address",
  "punycode-homograph": "Punycode / lookalike",
  "url-shortener": "URL shortener",
  "risky-tld": "Risky TLD",
  "anchor-text-mismatch": "Text doesn't match destination",
  "unparseable-url": "Malformed URL",
};

function flagLabel(flag: string): string {
  if (flag.startsWith("brand-in-subdomain:")) {
    return `Impersonates "${flag.split(":")[1]}"`;
  }
  return FLAG_LABELS[flag] ?? flag;
}

export function LinkInspector({ links }: { links: ExtractedLink[] }) {
  if (links.length === 0) {
    return <p className="text-sm text-muted-foreground">No links were found in this message.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {links.map((link, i) => {
        const flagged = link.flags.length > 0;
        return (
          <div
            key={i}
            className={`rounded-lg border p-3 ${flagged ? "border-[color-mix(in_oklch,var(--status-critical)_35%,var(--border))] bg-[color-mix(in_oklch,var(--status-critical)_6%,transparent)]" : "bg-card"}`}
          >
            <div className="flex items-start gap-2">
              {flagged ? (
                <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--status-critical)" }} aria-hidden />
              ) : (
                <ExternalLink size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                {link.text && link.text !== link.href && (
                  <p className="truncate text-sm font-medium">{link.text}</p>
                )}
                <p className="break-all text-xs text-muted-foreground">{link.href}</p>
                {flagged && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {link.flags.map((flag) => (
                      <span
                        key={flag}
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          color: "var(--status-critical)",
                          backgroundColor: "color-mix(in oklch, var(--status-critical) 12%, transparent)",
                        }}
                      >
                        {flagLabel(flag)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

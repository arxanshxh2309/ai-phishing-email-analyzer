"use client";

import { useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, Search, ShieldAlert } from "lucide-react";
import type { ExtractedLink } from "@/lib/engine/types";
import { Button } from "@/components/ui/button";

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

interface ResolveState {
  status: "idle" | "loading" | "done" | "error";
  finalUrl?: string | null;
  blockedPrivateIp?: boolean;
  error?: string;
}

export function LinkInspector({ links }: { links: ExtractedLink[] }) {
  const [resolved, setResolved] = useState<Record<number, ResolveState>>({});

  if (links.length === 0) {
    return <p className="text-sm text-muted-foreground">No links were found in this message.</p>;
  }

  async function resolveLink(i: number, href: string) {
    setResolved((prev) => ({ ...prev, [i]: { status: "loading" } }));
    try {
      const res = await fetch("/api/resolve-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: href }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResolved((prev) => ({ ...prev, [i]: { status: "error", error: data.error } }));
        return;
      }
      setResolved((prev) => ({
        ...prev,
        [i]: { status: "done", finalUrl: data.finalUrl, blockedPrivateIp: data.blockedPrivateIp },
      }));
    } catch {
      setResolved((prev) => ({ ...prev, [i]: { status: "error", error: "Network error" } }));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {links.map((link, i) => {
        const flagged = link.flags.length > 0;
        const canResolve = /^https?:\/\//i.test(link.href);
        const state = resolved[i];

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

                {canResolve && (
                  <div className="mt-2">
                    {(!state || state.status === "idle") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1.5 text-xs"
                        onClick={() => resolveLink(i, link.href)}
                      >
                        <Search size={12} />
                        Resolve real destination
                      </Button>
                    )}
                    {state?.status === "loading" && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 size={12} className="animate-spin" />
                        Following redirects…
                      </span>
                    )}
                    {state?.status === "done" && state.blockedPrivateIp && (
                      <span
                        className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: "var(--status-critical)" }}
                      >
                        <ShieldAlert size={12} />
                        Blocked: this link redirects to an internal/private address
                      </span>
                    )}
                    {state?.status === "done" && !state.blockedPrivateIp && state.finalUrl && (
                      <p className="break-all text-xs">
                        <span className="text-muted-foreground">Resolves to: </span>
                        <span className="font-medium">{state.finalUrl}</span>
                      </p>
                    )}
                    {state?.status === "done" && !state.blockedPrivateIp && !state.finalUrl && (
                      <span className="text-xs text-muted-foreground">Couldn&apos;t resolve this link.</span>
                    )}
                    {state?.status === "error" && (
                      <span className="text-xs text-muted-foreground">Couldn&apos;t resolve this link.</span>
                    )}
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

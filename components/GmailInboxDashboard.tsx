"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskGauge } from "@/components/RiskGauge";
import { FindingsList } from "@/components/FindingsList";
import { LinkInspector } from "@/components/LinkInspector";
import { EmailPreview } from "@/components/EmailPreview";
import { ErrorState } from "@/components/ErrorState";
import { TIER_META } from "@/lib/tier";
import type { RiskTier, ScanResult } from "@/lib/engine/types";

interface InboxSummary {
  gmailMessageId: string;
  subject: string | null;
  from: string | null;
  date: string | null;
  score: number;
  tier: RiskTier;
}

export function GmailInboxDashboard() {
  const [messages, setMessages] = useState<InboxSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [selected, setSelected] = useState<{ id: string; subject: string | null } | null>(null);

  async function loadInbox() {
    setLoading(true);
    setError(null);
    setNeedsReconnect(false);
    try {
      const res = await fetch("/api/gmail/scan-inbox");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to scan inbox.");
        setNeedsReconnect(Boolean(data.needsReconnect));
        return;
      }
      setMessages(data.messages);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInbox();
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Your {messages?.length ?? "..."} most recent inbox messages, ranked by risk.
        </p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={loadInbox} disabled={loading}>
          <RotateCw size={13} className={loading ? "animate-spin" : ""} />
          Rescan
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col gap-3">
          <ErrorState message={error} />
          {needsReconnect && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertTriangle size={12} />
              Use the Disconnect / Connect Gmail buttons above to reconnect.
            </p>
          )}
        </div>
      )}

      {!loading && !error && messages && messages.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No inbox messages found.</p>
      )}

      {!loading && !error && messages && messages.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((m) => (
              <TableRow
                key={m.gmailMessageId}
                className="cursor-pointer"
                onClick={() => setSelected({ id: m.gmailMessageId, subject: m.subject })}
              >
                <TableCell className="max-w-[240px] truncate whitespace-normal">{m.subject ?? "(no subject)"}</TableCell>
                <TableCell className="max-w-[180px] truncate text-muted-foreground">{m.from ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" style={{ color: TIER_META[m.tier].colorVar, borderColor: TIER_META[m.tier].colorVar }}>
                    {m.score} · {TIER_META[m.tier].label}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate">{selected?.subject ?? "Message detail"}</DialogTitle>
          </DialogHeader>
          {selected && <MessageDetail messageId={selected.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessageDetail({ messageId }: { messageId: string }) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);
    fetch(`/api/gmail/message/${messageId}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Failed to load this message.");
          return;
        }
        setResult(data as ScanResult);
      })
      .catch(() => !cancelled && setError("Network error — please try again."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [messageId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <Skeleton className="h-[140px] w-[140px] rounded-full" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !result) {
    return <ErrorState message={error ?? "Couldn't load this message."} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-center">
        <RiskGauge score={result.score} tier={result.tier} />
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Findings</h4>
        <FindingsList findings={result.findings} />
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Links</h4>
        <LinkInspector links={result.links} />
      </div>
      {result.preview && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Preview</h4>
          <EmailPreview preview={result.preview} />
        </div>
      )}
    </div>
  );
}

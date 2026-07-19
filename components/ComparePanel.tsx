"use client";

import { useState } from "react";
import { ArrowRightLeft, GitCompareArrows } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasteEmailForm } from "@/components/PasteEmailForm";
import { UploadDropzone } from "@/components/UploadDropzone";
import { RiskGauge } from "@/components/RiskGauge";
import { FindingsList } from "@/components/FindingsList";
import { LinkInspector } from "@/components/LinkInspector";
import { EmailPreview } from "@/components/EmailPreview";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ScanSkeleton } from "@/components/ScanSkeleton";
import { useEmailScan } from "@/lib/useEmailScan";
import type { ScanResult } from "@/lib/engine/types";

function senderDomain(result: ScanResult): string | null {
  const match = result.summary.from?.match(/@([^\s>]+)/);
  return match ? match[1].toLowerCase() : null;
}

function authenticationFailed(result: ScanResult): boolean {
  return result.findings.some((f) => f.category === "authentication" && (f.severity === "high" || f.severity === "critical"));
}

function topFinding(result: ScanResult) {
  return [...result.findings].filter((f) => f.weight > 0).sort((a, b) => b.weight - a.weight)[0];
}

interface SlotState {
  result: ScanResult | null;
  loading: boolean;
  error: string | null;
  analyzePaste: (raw: string) => void;
  analyzeFile: (file: File) => void;
}

function CompareSlot({ label, scan }: { label: string; scan: SlotState }) {
  const [pasteValue, setPasteValue] = useState("");
  const { result, loading, error, analyzePaste, analyzeFile } = scan;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <h3 className="text-sm font-semibold text-muted-foreground">Email {label}</h3>
      <Tabs defaultValue="paste">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paste">Paste</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="paste" className="pt-3">
          <PasteEmailForm value={pasteValue} onChange={setPasteValue} onSubmit={analyzePaste} disabled={loading} />
        </TabsContent>
        <TabsContent value="upload" className="pt-3">
          <UploadDropzone onFile={analyzeFile} disabled={loading} />
        </TabsContent>
      </Tabs>

      {loading && <ScanSkeleton />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && !result && <EmptyState />}
      {!loading && !error && result && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-4">
            <RiskGauge score={result.score} tier={result.tier} />
            <p className="w-full truncate text-center text-xs text-muted-foreground">
              {result.summary.subject ?? "(no subject)"}
            </p>
          </div>
          <Tabs defaultValue="findings">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="findings" className="text-xs">
                Findings ({result.findings.filter((f) => f.weight > 0).length})
              </TabsTrigger>
              <TabsTrigger value="links" className="text-xs">
                Links ({result.links.length})
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs" disabled={!result.preview}>
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="findings" className="pt-3">
              <FindingsList findings={result.findings} />
            </TabsContent>
            <TabsContent value="links" className="pt-3">
              <LinkInspector links={result.links} />
            </TabsContent>
            <TabsContent value="preview" className="pt-3">
              {result.preview && <EmailPreview preview={result.preview} />}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function DifferencesCallout({ a, b }: { a: ScanResult; b: ScanResult }) {
  const lines: string[] = [];

  if (a.score !== b.score) {
    const [safer, riskier] = a.score < b.score ? ["A", "B"] : ["B", "A"];
    lines.push(`Email ${riskier} scores higher risk (${Math.max(a.score, b.score)} vs ${Math.min(a.score, b.score)}) than Email ${safer}.`);
  }

  const domainA = senderDomain(a);
  const domainB = senderDomain(b);
  if (domainA && domainB && domainA !== domainB) {
    lines.push(`Sender domains differ: "${domainA}" (A) vs "${domainB}" (B).`);
  }

  const authA = authenticationFailed(a);
  const authB = authenticationFailed(b);
  if (authA !== authB) {
    lines.push(`${authA ? "Email A" : "Email B"} fails SPF/DKIM/DMARC checks while the other passes — a strong signal on its own.`);
  }

  const linksA = a.links.filter((l) => l.flags.length > 0).length;
  const linksB = b.links.filter((l) => l.flags.length > 0).length;
  if (linksA !== linksB) {
    lines.push(`Flagged links: A has ${linksA}, B has ${linksB}.`);
  }

  const topA = topFinding(a);
  const topB = topFinding(b);
  if (topA && (!topB || topA.weight > topB.weight)) {
    lines.push(`Email A's top concern: "${topA.title}".`);
  }
  if (topB && (!topA || topB.weight > topA.weight)) {
    lines.push(`Email B's top concern: "${topB.title}".`);
  }

  if (lines.length === 0) {
    lines.push("Both emails look broadly similar on the signals this tool checks.");
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <GitCompareArrows size={16} />
        Key differences
      </div>
      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export function ComparePanel() {
  const scanA = useEmailScan();
  const scanB = useEmailScan();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <CompareSlot label="A" scan={scanA} />
        <div className="hidden items-center justify-center pt-16 text-muted-foreground lg:flex">
          <ArrowRightLeft size={18} />
        </div>
        <CompareSlot label="B" scan={scanB} />
      </div>
      {scanA.result && scanB.result && <DifferencesCallout a={scanA.result} b={scanB.result} />}
    </div>
  );
}

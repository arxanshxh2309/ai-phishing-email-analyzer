"use client";

import { useState } from "react";
import { TestTube2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PasteEmailForm } from "@/components/PasteEmailForm";
import { UploadDropzone } from "@/components/UploadDropzone";
import { RiskGauge } from "@/components/RiskGauge";
import { FindingsList } from "@/components/FindingsList";
import { LinkInspector } from "@/components/LinkInspector";
import { EmailPreview } from "@/components/EmailPreview";
import { ExportButton } from "@/components/export/ExportButton";
import { CommandPalette } from "@/components/CommandPalette";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ScanSkeleton } from "@/components/ScanSkeleton";
import { FadeIn } from "@/components/motion/FadeIn";
import { SAMPLE_EMAILS } from "@/lib/samples";
import type { ScanResult } from "@/lib/engine/types";

export default function Home() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");
  const [pasteValue, setPasteValue] = useState("");

  async function runAnalysis(body: BodyInit, headers?: HeadersInit) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body, headers });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setResult(data as ScanResult);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePaste(raw: string) {
    runAnalysis(JSON.stringify({ raw }), { "Content-Type": "application/json" });
  }

  function handleFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    runAnalysis(formData);
  }

  function handleLoadSample(raw: string) {
    setActiveTab("paste");
    setPasteValue(raw);
    handlePaste(raw);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <CommandPalette onSwitchTab={setActiveTab} onLoadSample={handleLoadSample} />

      <FadeIn>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Is this email phishing?</h1>
          <p className="mt-2 text-muted-foreground">
            Paste a raw email or upload a .eml file to check sender authenticity, malicious links, and
            social-engineering language — instantly, and free.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Nothing to try? </span>
            {SAMPLE_EMAILS.map((sample) => (
              <Button
                key={sample.id}
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => handleLoadSample(sample.raw)}
                disabled={loading}
              >
                <TestTube2 size={12} />
                {sample.label}
              </Button>
            ))}
            <kbd className="ml-1 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "paste" | "upload")} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste">Paste email</TabsTrigger>
            <TabsTrigger value="upload">Upload .eml</TabsTrigger>
          </TabsList>
          <TabsContent value="paste" className="pt-4">
            <PasteEmailForm value={pasteValue} onChange={setPasteValue} onSubmit={handlePaste} disabled={loading} />
          </TabsContent>
          <TabsContent value="upload" className="pt-4">
            <UploadDropzone onFile={handleFile} disabled={loading} />
          </TabsContent>
        </Tabs>
      </FadeIn>

      <div>
        {loading && <ScanSkeleton />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && !result && <EmptyState />}
        {!loading && !error && result && <ScanResultView result={result} />}
      </div>
    </div>
  );
}

function ScanResultView({ result }: { result: ScanResult }) {
  return (
    <FadeIn className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-6 rounded-xl border bg-card p-6 sm:flex-row sm:items-start sm:justify-between">
        <RiskGauge score={result.score} tier={result.tier} />
        <div className="w-full space-y-1.5 text-sm sm:max-w-xs">
          <SummaryRow
            label="From"
            value={result.summary.fromName ? `${result.summary.fromName} <${result.summary.from}>` : result.summary.from}
          />
          <SummaryRow label="Reply-To" value={result.summary.replyTo} />
          <SummaryRow label="Subject" value={result.summary.subject} />
          <SummaryRow
            label="Date"
            value={result.summary.date ? new Date(result.summary.date).toLocaleString() : null}
          />
          <SummaryRow label="Attachments" value={String(result.summary.attachmentCount)} />
          <div className="pt-2">
            <ExportButton result={result} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="findings">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="findings">Findings ({result.findings.filter((f) => f.weight > 0).length})</TabsTrigger>
          <TabsTrigger value="links">Links ({result.links.length})</TabsTrigger>
          <TabsTrigger value="preview" disabled={!result.preview}>
            Preview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="findings" className="pt-4">
          <FindingsList findings={result.findings} />
        </TabsContent>
        <TabsContent value="links" className="pt-4">
          <LinkInspector links={result.links} />
        </TabsContent>
        <TabsContent value="preview" className="pt-4">
          {result.preview && <EmailPreview preview={result.preview} />}
        </TabsContent>
      </Tabs>
    </FadeIn>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

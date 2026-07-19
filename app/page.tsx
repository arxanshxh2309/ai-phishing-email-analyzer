"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasteEmailForm } from "@/components/PasteEmailForm";
import { UploadDropzone } from "@/components/UploadDropzone";
import { RiskGauge } from "@/components/RiskGauge";
import { FindingsList } from "@/components/FindingsList";
import { LinkInspector } from "@/components/LinkInspector";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ScanSkeleton } from "@/components/ScanSkeleton";
import { FadeIn } from "@/components/motion/FadeIn";
import type { ScanResult } from "@/lib/engine/types";

export default function Home() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <FadeIn>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Is this email phishing?</h1>
          <p className="mt-2 text-muted-foreground">
            Paste a raw email or upload a .eml file to check sender authenticity, malicious links, and
            social-engineering language — instantly, and free.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Tabs defaultValue="paste" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste">Paste email</TabsTrigger>
            <TabsTrigger value="upload">Upload .eml</TabsTrigger>
          </TabsList>
          <TabsContent value="paste" className="pt-4">
            <PasteEmailForm onSubmit={handlePaste} disabled={loading} />
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
        </div>
      </div>

      <Tabs defaultValue="findings">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="findings">Findings ({result.findings.filter((f) => f.weight > 0).length})</TabsTrigger>
          <TabsTrigger value="links">Links ({result.links.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="findings" className="pt-4">
          <FindingsList findings={result.findings} />
        </TabsContent>
        <TabsContent value="links" className="pt-4">
          <LinkInspector links={result.links} />
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

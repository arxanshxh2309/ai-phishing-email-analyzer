"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportCard } from "@/components/export/ExportCard";
import type { ScanResult } from "@/lib/engine/types";

export function ExportButton({ result }: { result: ScanResult }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `phishguard-report-${result.tier}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // Best-effort feature — silently ignore export failures.
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={exporting}>
        {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Download report
      </Button>
      {/* Rendered off-screen (not display:none, which would break layout for rasterization) purely for capture. */}
      <div style={{ position: "fixed", top: 0, left: -10000, pointerEvents: "none" }} aria-hidden>
        <div ref={cardRef}>
          <ExportCard result={result} />
        </div>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import type { ScanResult } from "@/lib/engine/types";

export function useEmailScan() {
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

  function analyzePaste(raw: string) {
    return runAnalysis(JSON.stringify({ raw }), { "Content-Type": "application/json" });
  }

  function analyzeFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return runAnalysis(formData);
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return { result, loading, error, analyzePaste, analyzeFile, reset };
}

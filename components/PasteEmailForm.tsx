"use client";

import { useState } from "react";
import { ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLACEHOLDER = `Paste the full raw email source here, including headers, e.g.:

Delivered-To: you@example.com
From: "Some Sender" <sender@example.com>
Subject: ...
Authentication-Results: ...

<email body>`;

export function PasteEmailForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (raw: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value);
      }}
      className="flex flex-col gap-3"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={PLACEHOLDER}
        spellCheck={false}
        className="min-h-[240px] w-full resize-y rounded-lg border bg-background p-3 font-mono text-xs leading-relaxed outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          For the most accurate result, paste the full source (headers included), not just the visible body.
        </p>
        <Button type="submit" disabled={disabled || !value.trim()} className="gap-2">
          <ScanSearch size={16} />
          Analyze
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import { FileWarning, UploadCloud } from "lucide-react";

const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB — stays under Vercel's default body size limit.

export function UploadDropzone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (file.size > MAX_SIZE_BYTES) {
        setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 4MB.`);
        return;
      }
      onFile(file);
    },
    [onFile]
  );

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (disabled) return;
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging ? "border-primary bg-accent" : "border-border hover:bg-accent/50"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <UploadCloud size={32} className="text-muted-foreground" aria-hidden />
        <div>
          <p className="text-sm font-medium">Drop a .eml file here, or click to browse</p>
          <p className="mt-1 text-xs text-muted-foreground">Max 4MB · .eml / .msg exported from your mail client</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".eml,.msg,message/rfc822"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--status-critical)" }}>
          <FileWarning size={14} />
          {error}
        </div>
      )}
    </div>
  );
}

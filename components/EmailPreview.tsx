"use client";

import { useMemo, useState } from "react";
import { Eye, ImageOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPreviewDocument, restoreImages } from "@/lib/engine/previewDocument";
import type { PreviewData } from "@/lib/engine/types";

export function EmailPreview({ preview }: { preview: PreviewData }) {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const srcDoc = useMemo(() => {
    const body = imagesLoaded ? restoreImages(preview.html) : preview.html;
    return buildPreviewDocument(body, { allowImages: imagesLoaded });
  }, [preview.html, imagesLoaded]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} style={{ color: "var(--status-good)" }} aria-hidden />
          Rendered in a sandboxed frame — scripts disabled, links inert, images blocked by default.
        </div>
        {preview.blockedImages > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setImagesLoaded((v) => !v)}
          >
            {imagesLoaded ? <ImageOff size={13} /> : <Eye size={13} />}
            {imagesLoaded ? "Hide images" : `Load ${preview.blockedImages} image${preview.blockedImages === 1 ? "" : "s"}`}
          </Button>
        )}
      </div>
      <iframe
        title="Email preview (sandboxed)"
        sandbox=""
        referrerPolicy="no-referrer"
        srcDoc={srcDoc}
        className="h-[420px] w-full rounded-lg border bg-white"
      />
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "rgba(208, 59, 59, 0.5)" }} />
          Critical / high finding highlighted in place
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "rgba(250, 178, 25, 0.5)" }} />
          Medium finding highlighted in place
        </span>
      </div>
      {preview.truncated && (
        <p className="text-xs text-muted-foreground">Preview truncated — the original message body is unusually large.</p>
      )}
    </div>
  );
}

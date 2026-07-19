import { NextRequest, NextResponse } from "next/server";
import { runEngine } from "@/lib/engine";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_SIZE_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  let source: string | Buffer;

  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided." }, { status: 400 });
      }
      if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: "File is too large. Max size is 4MB." }, { status: 413 });
      }
      source = Buffer.from(await file.arrayBuffer());
    } else {
      const body = await req.json();
      if (typeof body?.raw !== "string" || !body.raw.trim()) {
        return NextResponse.json({ error: "No email source provided." }, { status: 400 });
      }
      if (Buffer.byteLength(body.raw, "utf8") > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: "Pasted content is too large. Max size is 4MB." }, { status: 413 });
      }
      source = body.raw;
    }
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  try {
    const result = await runEngine(source);
    return NextResponse.json(result);
  } catch (err) {
    console.error("analyze error", err);
    return NextResponse.json(
      { error: "Couldn't parse this as a valid email. Make sure you included the full raw source." },
      { status: 422 }
    );
  }
}

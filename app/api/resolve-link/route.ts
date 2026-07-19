import { NextRequest, NextResponse } from "next/server";
import { resolveRedirectChain } from "@/lib/net/resolveRedirect";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(req: NextRequest) {
  let url: unknown;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "A valid http(s) URL is required." }, { status: 400 });
  }

  const result = await resolveRedirectChain(url);
  return NextResponse.json(result);
}

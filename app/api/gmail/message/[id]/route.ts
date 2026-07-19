import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGmailClient, GmailAuthError } from "@/lib/gmail/client";
import { getRawMessageBuffer } from "@/lib/gmail/getRawMessage";
import { runEngine } from "@/lib/engine";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const gmail = await getGmailClient(user.id);
    const raw = await getRawMessageBuffer(gmail, id);
    const result = await runEngine(raw);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof GmailAuthError) {
      return NextResponse.json({ error: err.message, needsReconnect: true }, { status: 409 });
    }
    console.error("gmail message scan error", err);
    return NextResponse.json({ error: "Failed to fetch or analyze this message." }, { status: 500 });
  }
}

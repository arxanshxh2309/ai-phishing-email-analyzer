import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGmailClient, GmailAuthError } from "@/lib/gmail/client";
import { listRecentMessageIds } from "@/lib/gmail/listMessages";
import { getRawMessageBuffer } from "@/lib/gmail/getRawMessage";
import { runEngine } from "@/lib/engine";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MESSAGES = 10;
const BATCH_SIZE = 4;

interface InboxSummary {
  gmailMessageId: string;
  subject: string | null;
  from: string | null;
  date: string | null;
  score: number;
  tier: string;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let gmail;
  try {
    gmail = await getGmailClient(user.id);
  } catch (err) {
    if (err instanceof GmailAuthError) {
      return NextResponse.json({ error: err.message, needsReconnect: true }, { status: 409 });
    }
    console.error("gmail client error", err);
    return NextResponse.json({ error: "Failed to connect to Gmail." }, { status: 500 });
  }

  let messageIds: string[];
  try {
    messageIds = await listRecentMessageIds(gmail, MAX_MESSAGES);
  } catch (err) {
    console.error("gmail list messages error", err);
    return NextResponse.json({ error: "Failed to list Gmail messages." }, { status: 502 });
  }

  const summaries: InboxSummary[] = [];

  for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
    const batch = messageIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (id): Promise<InboxSummary> => {
        const raw = await getRawMessageBuffer(gmail, id);
        const result = await runEngine(raw);
        return {
          gmailMessageId: id,
          subject: result.summary.subject,
          from: result.summary.from,
          date: result.summary.date,
          score: result.score,
          tier: result.tier,
        };
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") summaries.push(r.value);
    }
  }

  summaries.sort((a, b) => b.score - a.score);
  return NextResponse.json({ messages: summaries });
}

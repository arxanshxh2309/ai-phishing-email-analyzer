import type { gmail_v1 } from "googleapis";

export async function listRecentMessageIds(gmail: gmail_v1.Gmail, maxResults = 10): Promise<string[]> {
  const res = await gmail.users.messages.list({ userId: "me", maxResults, q: "in:inbox" });
  return (res.data.messages ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));
}

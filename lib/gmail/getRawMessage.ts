import type { gmail_v1 } from "googleapis";

export async function getRawMessageBuffer(gmail: gmail_v1.Gmail, messageId: string): Promise<Buffer> {
  const res = await gmail.users.messages.get({ userId: "me", id: messageId, format: "raw" });
  const raw = res.data.raw;
  if (!raw) throw new Error("Message has no raw content.");
  return Buffer.from(raw, "base64url");
}

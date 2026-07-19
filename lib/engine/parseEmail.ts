import { simpleParser, type ParsedMail, type AddressObject } from "mailparser";
import { htmlToText } from "html-to-text";

export interface ParsedAttachment {
  filename: string | null;
  contentType: string;
  size: number;
  content: Buffer;
}

export interface NormalizedEmail {
  fromAddress: string | null;
  fromName: string | null;
  replyToAddress: string | null;
  toAddresses: string[];
  subject: string | null;
  date: string | null;
  messageId: string | null;
  html: string | null;
  text: string | null;
  headers: Map<string, unknown>;
  headerLines: readonly { key: string; line: string }[];
  attachments: ParsedAttachment[];
  raw: ParsedMail;
}

function firstAddress(addr: AddressObject | AddressObject[] | undefined): {
  address: string | null;
  name: string | null;
} {
  if (!addr) return { address: null, name: null };
  const obj = Array.isArray(addr) ? addr[0] : addr;
  const value = obj?.value?.[0];
  return { address: value?.address ?? null, name: value?.name ?? null };
}

export async function parseEmailSource(source: string | Buffer): Promise<NormalizedEmail> {
  const parsed = await simpleParser(source, {});

  // mailparser only auto-derives `text` from `html` in specific structures
  // (e.g. a lone text/html root) — it does NOT do this for the very common
  // multipart/mixed case (HTML body + attachment), which would silently
  // leave content.ts scanning nothing. Derive it ourselves whenever missing.
  const html = typeof parsed.html === "string" ? parsed.html : null;
  const text = parsed.text || (html ? htmlToText(html) : null);

  const from = firstAddress(parsed.from);
  const replyTo = firstAddress(parsed.replyTo);

  const toAddresses: string[] = [];
  if (parsed.to) {
    const toObjs = Array.isArray(parsed.to) ? parsed.to : [parsed.to];
    for (const t of toObjs) {
      for (const v of t.value ?? []) {
        if (v.address) toAddresses.push(v.address);
      }
    }
  }

  const attachments: ParsedAttachment[] = (parsed.attachments ?? []).map((a) => ({
    filename: a.filename ?? null,
    contentType: a.contentType,
    size: a.size,
    content: a.content,
  }));

  return {
    fromAddress: from.address,
    fromName: from.name,
    replyToAddress: replyTo.address,
    toAddresses,
    subject: parsed.subject ?? null,
    date: parsed.date ? parsed.date.toISOString() : null,
    messageId: parsed.messageId ?? null,
    html,
    text: text || null,
    headers: parsed.headers,
    headerLines: parsed.headerLines,
    attachments,
    raw: parsed,
  };
}

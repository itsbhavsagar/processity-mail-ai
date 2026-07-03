import type { GmailMessagePayload, GmailMessagePart } from "@/features/gmail/types/gmail-api";

export interface ExtractedMessageBody {
  html?: string;
  text?: string;
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractFromPart(part: GmailMessagePart): {
  plain?: string;
  html?: string;
} {
  const mimeType = part.mimeType ?? "";
  const data = part.body?.data;

  if (data) {
    const decoded = decodeBase64Url(data);

    if (mimeType === "text/plain") {
      return { plain: decoded };
    }

    if (mimeType === "text/html") {
      return { html: decoded };
    }
  }

  let plain: string | undefined;
  let html: string | undefined;

  for (const child of part.parts ?? []) {
    const extracted = extractFromPart(child);

    plain ??= extracted.plain;
    html ??= extracted.html;
  }

  return { plain, html };
}

export function extractMessageBody(
  payload?: GmailMessagePayload,
): ExtractedMessageBody {
  if (!payload) {
    return {};
  }

  const extracted = extractFromPart(payload);

  return {
    html: extracted.html || undefined,
    text: extracted.plain || undefined,
  };
}

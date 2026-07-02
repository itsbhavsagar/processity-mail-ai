import { extractMessageBody } from "@/features/gmail/mappers/extract-message-body";
import type { GmailMessage } from "@/features/gmail/types/gmail-api";
import type { MailMessage } from "@/features/mail/types/mail-message";

function getHeader(
  headers: Array<{ name: string; value: string }>,
  name: string,
): string {
  return (
    headers.find((header) => header.name.toLowerCase() === name.toLowerCase())
      ?.value ?? ""
  );
}

function parseAddress(value: string): string {
  const match = value.match(/^(.+?)\s*<.+>$/);

  if (match) {
    return match[1].replace(/^"|"$/g, "").trim();
  }

  return value.trim();
}

function parseRecipients(headerValue: string): string[] {
  if (!headerValue) {
    return [];
  }

  return headerValue
    .split(",")
    .map(parseAddress)
    .filter(Boolean);
}

export function normalizeMessage(gmailMessage: GmailMessage): MailMessage {
  const headers = gmailMessage.payload?.headers ?? [];
  const from = getHeader(headers, "From");
  const to = getHeader(headers, "To");
  const cc = getHeader(headers, "Cc");
  const subject = getHeader(headers, "Subject") || "(No subject)";
  const dateValue = getHeader(headers, "Date");
  const sentAt = dateValue ? new Date(dateValue) : new Date();

  return {
    id: gmailMessage.id,
    sender: parseAddress(from) || "Unknown",
    recipients: [...parseRecipients(to), ...parseRecipients(cc)],
    subject,
    body: extractMessageBody(gmailMessage.payload),
    sentAt: sentAt.toISOString(),
  };
}

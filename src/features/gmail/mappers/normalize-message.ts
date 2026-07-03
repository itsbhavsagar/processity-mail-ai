import { extractMessageBody } from "@/features/gmail/mappers/extract-message-body";
import type { GmailMessage } from "@/features/gmail/types/gmail-api";
import { parseMailboxList } from "@/features/mail/lib/parse-mailbox";
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

export function normalizeMessage(gmailMessage: GmailMessage): MailMessage {
  const headers = gmailMessage.payload?.headers ?? [];
  const from = getHeader(headers, "From");
  const to = getHeader(headers, "To");
  const cc = getHeader(headers, "Cc");
  const subject = getHeader(headers, "Subject") || "(No subject)";
  const dateValue = getHeader(headers, "Date");
  const sentAt = dateValue ? new Date(dateValue) : new Date();
  const sender = parseMailboxList(from)[0] ?? { name: "Unknown", email: "" };
  const { html, text } = extractMessageBody(gmailMessage.payload);

  return {
    id: gmailMessage.id,
    sender,
    to: parseMailboxList(to),
    cc: parseMailboxList(cc),
    subject,
    bodyHtml: html,
    bodyText: text,
    sentAt: sentAt.toISOString(),
  };
}

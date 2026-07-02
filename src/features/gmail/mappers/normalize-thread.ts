import type { GmailThreadResponse } from "@/features/gmail/types/gmail-api";
import type { MailThread } from "@/features/mail/types/mail-thread";

function getHeader(
  headers: Array<{ name: string; value: string }>,
  name: string,
): string {
  return (
    headers.find((header) => header.name.toLowerCase() === name.toLowerCase())
      ?.value ?? ""
  );
}

function parseSender(from: string): string {
  const match = from.match(/^(.+?)\s*<.+>$/);

  if (match) {
    return match[1].replace(/^"|"$/g, "").trim();
  }

  return from.trim();
}

export function normalizeThread(gmailThread: GmailThreadResponse): MailThread {
  const messages = gmailThread.messages ?? [];
  const latestMessage = messages.at(-1) ?? messages[0];
  const headers = latestMessage?.payload?.headers ?? [];
  const from = getHeader(headers, "From");
  const subject = getHeader(headers, "Subject") || "(No subject)";
  const dateValue = getHeader(headers, "Date");
  const receivedAt = dateValue ? new Date(dateValue) : new Date();

  return {
    id: gmailThread.id,
    sender: parseSender(from) || "Unknown",
    subject,
    snippet: gmailThread.snippet ?? latestMessage?.snippet ?? "",
    receivedAt: receivedAt.toISOString(),
    isUnread: messages.some((message) => message.labelIds?.includes("UNREAD")),
  };
}

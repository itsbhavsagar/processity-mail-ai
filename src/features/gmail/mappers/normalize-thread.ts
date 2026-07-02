import type { MailThread } from "@/features/gmail/types/mail-thread";

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessage {
  id: string;
  snippet?: string;
  labelIds?: string[];
  payload?: {
    headers?: GmailHeader[];
  };
}

export interface GmailThreadResponse {
  id: string;
  snippet?: string;
  messages?: GmailMessage[];
}

function getHeader(headers: GmailHeader[], name: string): string {
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

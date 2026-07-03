import type { GmailThreadResponse } from "@/features/gmail/types/gmail-api";
import { getMailboxDisplayName, parseMailboxList } from "@/features/mail/lib/parse-mailbox";
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

export function normalizeThread(gmailThread: GmailThreadResponse): MailThread {
  const messages = gmailThread.messages ?? [];
  const latestMessage = messages.at(-1) ?? messages[0];
  const headers = latestMessage?.payload?.headers ?? [];
  const from = getHeader(headers, "From");
  const subject = getHeader(headers, "Subject") || "(No subject)";
  const dateValue = getHeader(headers, "Date");
  const receivedAt = dateValue ? new Date(dateValue) : new Date();

  const senderAddress = parseMailboxList(from)[0];

  return {
    id: gmailThread.id,
    sender: senderAddress ? getMailboxDisplayName(senderAddress) : "Unknown",
    senderEmail: senderAddress?.email || undefined,
    subject,
    snippet: gmailThread.snippet ?? latestMessage?.snippet ?? "",
    receivedAt: receivedAt.toISOString(),
    isUnread: messages.some((message) => message.labelIds?.includes("UNREAD")),
  };
}

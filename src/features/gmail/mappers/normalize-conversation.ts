import { normalizeMessage } from "@/features/gmail/mappers/normalize-message";
import type { GmailThreadResponse } from "@/features/gmail/types/gmail-api";
import type { MailConversation } from "@/features/mail/types/mail-conversation";

function getHeader(
  headers: Array<{ name: string; value: string }>,
  name: string,
): string {
  return (
    headers.find((header) => header.name.toLowerCase() === name.toLowerCase())
      ?.value ?? ""
  );
}

export function normalizeConversation(
  gmailThread: GmailThreadResponse,
): MailConversation {
  const messages = (gmailThread.messages ?? []).map(normalizeMessage);
  const latestMessage = gmailThread.messages?.at(-1);
  const headers = latestMessage?.payload?.headers ?? [];
  const subject =
    getHeader(headers, "Subject") || messages.at(-1)?.subject || "(No subject)";

  return {
    id: gmailThread.id,
    subject,
    messages,
  };
}

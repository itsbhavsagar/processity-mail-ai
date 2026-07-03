import { getMailboxDisplayName } from "@/features/mail/lib/parse-mailbox";
import type { AssistantMailContext } from "@/features/assistant/lib/build-assistant-context";
import type { ReplyDraft } from "@/features/mail/types/compose-draft";
import type { MailAddress } from "@/features/mail/types/mail-address";
import type { MailMessage } from "@/features/mail/types/mail-message";

function formatReplySubject(subject: string): string {
  const normalized = subject.trim();

  if (/^re:/i.test(normalized)) {
    return normalized;
  }

  return `Re: ${normalized}`;
}

function getReplyRecipient(
  message: MailMessage,
  currentUserEmail?: string,
): MailAddress {
  const normalizedUser = currentUserEmail?.trim().toLowerCase();

  if (
    normalizedUser &&
    message.sender.email.trim().toLowerCase() !== normalizedUser
  ) {
    return message.sender;
  }

  return message.to[0] ?? message.sender;
}

export function buildReplyDraftFromMailContext(
  mail: AssistantMailContext,
  threadId: string,
  body: string,
  currentUserEmail?: string,
): ReplyDraft | null {
  if (!mail.conversation || mail.conversationId !== threadId) {
    return null;
  }

  const latestMessage = mail.conversation.messages.at(-1);

  if (!latestMessage) {
    return null;
  }

  const recipient = getReplyRecipient(latestMessage, currentUserEmail);

  return {
    kind: "reply",
    threadId,
    recipient: getMailboxDisplayName(recipient),
    recipientEmail: recipient.email,
    subject: formatReplySubject(mail.conversation.subject),
    body,
  };
}

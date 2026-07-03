import type { MailConversation } from "@/features/mail/types/mail-conversation";

export function buildReplyHeadersFromConversation(
  conversation: MailConversation,
): { inReplyTo: string; references: string } | null {
  const latestMessage = conversation.messages.at(-1);

  if (!latestMessage?.rfcMessageId) {
    return null;
  }

  const references = latestMessage.references?.trim()
    ? `${latestMessage.references} ${latestMessage.rfcMessageId}`.trim()
    : latestMessage.rfcMessageId;

  return {
    inReplyTo: latestMessage.rfcMessageId,
    references,
  };
}

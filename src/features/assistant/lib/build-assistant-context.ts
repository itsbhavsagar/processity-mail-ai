import type { AssistantContext, AssistantSearchResult } from "@/features/assistant/types/assistant-action";
import { toActiveDraftContext } from "@/features/assistant/lib/assistant-message-utils";
import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailThread } from "@/features/mail/types/mail-thread";
import type { AssistantDraft } from "@/features/mail/types/compose-draft";
import { getMailboxDisplayName } from "@/features/mail/lib/parse-mailbox";
import type { MailboxId } from "@/shared/constants";

export type AssistantMailContext = {
  mailbox: MailboxId;
  conversationId?: string;
  conversation: MailConversation | null;
  currentUserEmail?: string;
};

export function toSearchResults(threads: MailThread[]): AssistantSearchResult[] {
  return threads.map((thread) => ({
    threadId: thread.id,
    from: thread.sender,
    subject: thread.subject,
    receivedAt: thread.receivedAt,
  }));
}

export function buildAssistantContext(options: {
  mail: AssistantMailContext;
  hasActiveDraft: boolean;
  activeDraft: AssistantDraft | null;
  searchResults: AssistantSearchResult[] | null;
}): AssistantContext {
  const latestMessage = options.mail.conversation?.messages.at(-1);

  return {
    currentMailbox: options.mail.mailbox,
    currentConversation:
      options.mail.conversation && options.mail.conversationId
        ? {
            threadId: options.mail.conversationId,
            subject: options.mail.conversation.subject,
            sender: latestMessage
              ? getMailboxDisplayName(latestMessage.sender)
              : "Unknown",
          }
        : null,
    hasActiveDraft: options.hasActiveDraft,
    activeDraft: toActiveDraftContext(options.activeDraft),
    searchResults: options.searchResults,
  };
}

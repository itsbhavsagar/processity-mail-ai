import { toActiveDraftContext } from "@/features/assistant/lib/assistant-message-utils";
import type {
  AssistantContext,
  AssistantSearchResult,
} from "@/features/assistant/types/assistant-action";
import { startOfLocalDayEpochSeconds } from "@/features/mail/lib/build-gmail-query";
import { htmlToPlainText } from "@/features/mail/lib/html-to-text";
import {
  formatMailbox,
  getMailboxDisplayName,
} from "@/features/mail/lib/parse-mailbox";
import type { AssistantDraft } from "@/features/mail/types/compose-draft";
import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailMessage } from "@/features/mail/types/mail-message";
import type { MailThread } from "@/features/mail/types/mail-thread";
import type { MailboxId } from "@/shared/constants";

export const MAX_SEARCH_RESULTS = 5;
export const MAX_CONVERSATION_BODY_LENGTH = 1200;

function resolveConversationBody(message?: MailMessage): string {
  const text = message?.bodyText?.trim();
  if (text) {
    return text;
  }

  if (message?.bodyHtml) {
    return htmlToPlainText(message.bodyHtml);
  }

  return "";
}

export type AssistantMailContext = {
  mailbox: MailboxId;
  conversationId?: string;
  conversation: MailConversation | null;
  currentUserEmail?: string;
};

export function toSearchResults(
  threads: MailThread[],
): AssistantSearchResult[] {
  return threads.map((thread) => ({
    threadId: thread.id,
    from: thread.sender,
    subject: thread.subject,
  }));
}

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function buildAssistantContext(options: {
  mail: AssistantMailContext;
  hasActiveDraft: boolean;
  activeDraft: AssistantDraft | null;
  searchResults: AssistantSearchResult[] | null;
}): AssistantContext {
  const latestMessage = options.mail.conversation?.messages.at(-1);

  const context: AssistantContext = {
    todayEpochSeconds: startOfLocalDayEpochSeconds(todayIsoDate()),
    currentMailbox: options.mail.mailbox,
    hasActiveDraft: options.hasActiveDraft,
  };

  if (options.mail.conversation && options.mail.conversationId) {
    context.currentConversation = {
      threadId: options.mail.conversationId,
      subject: options.mail.conversation.subject,
      sender: latestMessage
        ? getMailboxDisplayName(latestMessage.sender)
        : "Unknown",
      to: latestMessage ? latestMessage.to.map(formatMailbox).join(", ") : "",
      cc: latestMessage ? latestMessage.cc.map(formatMailbox).join(", ") : "",
      sentAt: latestMessage?.sentAt ?? "",
      body: resolveConversationBody(latestMessage).slice(
        0,
        MAX_CONVERSATION_BODY_LENGTH,
      ),
    };
  }

  if (options.hasActiveDraft) {
    const activeDraft = toActiveDraftContext(options.activeDraft);
    if (activeDraft) {
      context.activeDraft = activeDraft;
    }
  }

  if (options.searchResults?.length) {
    context.searchResults = options.searchResults.slice(0, MAX_SEARCH_RESULTS);
  }

  return context;
}

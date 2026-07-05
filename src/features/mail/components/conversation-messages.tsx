import type { MailConversation } from "@/features/mail/types/mail-conversation";
import { Separator } from "@/shared/ui";

import { MessageBody } from "./message-body";
import { MessageHeader } from "./message-header";

interface ConversationMessagesProps {
  conversation: MailConversation;
  mode: "default" | "focus";
  currentUserEmail?: string;
}

export function ConversationMessages({
  conversation,
  mode,
  currentUserEmail,
}: ConversationMessagesProps) {
  const contentClassName =
    mode === "focus"
      ? "mx-auto w-full min-w-0 max-w-3xl space-y-10 px-4 py-8 sm:px-8 sm:py-10"
      : "min-w-0 space-y-8 px-4 py-6 sm:px-6";

  return (
    <div className={contentClassName}>
      {conversation.messages.map((message, index) => (
        <article key={message.id} className="min-w-0 max-w-full">
          <MessageHeader
            message={message}
            currentUserEmail={currentUserEmail}
          />

          <div className="mt-4 min-w-0 max-w-full overflow-hidden rounded-lg border border-border/50 bg-muted/20 px-4 py-4 sm:px-5 sm:py-5 dark:border-neutral-200 dark:bg-white">
            <MessageBody
              bodyHtml={message.bodyHtml}
              bodyText={message.bodyText}
            />
          </div>

          {index < conversation.messages.length - 1 ? (
            <Separator className={mode === "focus" ? "mt-10" : "mt-8"} />
          ) : null}
        </article>
      ))}
    </div>
  );
}

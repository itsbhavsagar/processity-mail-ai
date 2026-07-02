import type { MailConversation } from "@/features/mail/types/mail-conversation";
import { Separator } from "@/shared/ui";

function formatSentAt(isoDate: string): string {
  const date = new Date(isoDate);

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface ConversationMessagesProps {
  conversation: MailConversation;
  mode: "default" | "focus";
}

export function ConversationMessages({
  conversation,
  mode,
}: ConversationMessagesProps) {
  const contentClassName =
    mode === "focus"
      ? "mx-auto w-full max-w-3xl space-y-10 px-4 py-8 sm:px-8 sm:py-10"
      : "space-y-8 px-6 py-6";

  return (
    <div className={contentClassName}>
      {conversation.messages.map((message, index) => (
        <article key={message.id}>
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-sm font-semibold text-foreground">
                {message.sender}
              </p>
              <time
                dateTime={message.sentAt}
                className="text-xs tabular-nums text-muted-foreground"
              >
                {formatSentAt(message.sentAt)}
              </time>
            </div>
            {message.recipients.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                To {message.recipients.join(", ")}
              </p>
            ) : null}
          </div>

          <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-foreground/90">
            {message.body || "(No message body)"}
          </p>

          {index < conversation.messages.length - 1 ? (
            <Separator className={mode === "focus" ? "mt-10" : "mt-8"} />
          ) : null}
        </article>
      ))}
    </div>
  );
}

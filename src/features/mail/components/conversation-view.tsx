import type { MailConversation } from "@/features/mail/types/mail-conversation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from "@/shared/ui";

interface ConversationViewProps {
  conversation: MailConversation | null;
  activeThreadId?: string;
  isLoading: boolean;
  hasError: boolean;
}

function formatSentAt(isoDate: string): string {
  const date = new Date(isoDate);

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ConversationLoadingState() {
  return (
    <Card className="h-full min-h-[320px] border-border/70 shadow-sm">
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

function ConversationEmptyState() {
  return (
    <Card className="flex h-full min-h-[320px] items-center justify-center border-border/70 shadow-sm">
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">
          Select a conversation to read.
        </p>
      </CardContent>
    </Card>
  );
}

function ConversationErrorState() {
  return (
    <Card className="flex h-full min-h-[320px] items-center justify-center border-border/70 shadow-sm">
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">
          Failed to load conversation. Try refreshing the page.
        </p>
      </CardContent>
    </Card>
  );
}

export function ConversationView({
  conversation,
  activeThreadId,
  isLoading,
  hasError,
}: ConversationViewProps) {
  if (!activeThreadId) {
    return <ConversationEmptyState />;
  }

  if (isLoading) {
    return <ConversationLoadingState />;
  }

  if (hasError || !conversation) {
    return <ConversationErrorState />;
  }

  return (
    <Card className="h-full min-h-[320px] border-border/70 shadow-sm">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-base">{conversation.subject}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {conversation.messages.length}{" "}
          {conversation.messages.length === 1 ? "message" : "messages"}
        </p>
      </CardHeader>

      <CardContent className="max-h-[calc(100vh-16rem)] space-y-6 overflow-y-auto p-0">
        {conversation.messages.map((message, index) => (
          <article key={message.id} className="px-6 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">{message.sender}</p>
              {message.recipients.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  To: {message.recipients.join(", ")}
                </p>
              ) : null}
              <time
                dateTime={message.sentAt}
                className="text-xs text-muted-foreground"
              >
                {formatSentAt(message.sentAt)}
              </time>
              <p className="text-sm font-medium">{message.subject}</p>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">
              {message.body || "(No message body)"}
            </p>
            {index < conversation.messages.length - 1 ? (
              <Separator className="mt-6" />
            ) : null}
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

import { FiAlertCircle, FiMessageSquare } from "react-icons/fi";

import type { MailConversation } from "@/features/mail/types/mail-conversation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ScrollArea,
  Separator,
  Skeleton,
} from "@/shared/ui";

import { ReconnectGoogleButton } from "./reconnect-google-button";

interface ConversationViewProps {
  conversation: MailConversation | null;
  activeThreadId?: string;
  isLoading: boolean;
  conversationError: "auth" | "unknown" | false;
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
    <Card className="flex h-full min-h-0 flex-col border-border/60 bg-card/80 shadow-sm">
      <CardHeader className="shrink-0 space-y-3 border-b border-border/60 px-6 py-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-8 px-6 py-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full max-w-3xl" />
          <Skeleton className="h-4 w-full max-w-3xl" />
          <Skeleton className="h-4 w-4/5 max-w-3xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-full max-w-3xl" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>
      </CardContent>
    </Card>
  );
}

function ConversationEmptyState() {
  return (
    <Card className="flex h-full min-h-0 flex-col items-center justify-center border-border/60 bg-card/80 shadow-sm">
      <CardContent className="px-6 py-16 text-center">
        <span
          aria-hidden
          className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground"
        >
          <FiMessageSquare className="size-5" />
        </span>
        <p className="text-sm font-medium text-foreground">
          No conversation selected
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Choose a thread from your inbox to read the full conversation.
        </p>
      </CardContent>
    </Card>
  );
}

function ConversationAuthErrorState() {
  return (
    <Card className="flex h-full min-h-0 flex-col items-center justify-center border-border/60 bg-card/80 shadow-sm">
      <CardContent className="px-6 py-16 text-center">
        <span
          aria-hidden
          className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
        >
          <FiAlertCircle className="size-5" />
        </span>
        <p className="text-sm font-medium text-foreground">
          Your Gmail connection expired
        </p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          We couldn&apos;t open this conversation because your Google session
          timed out. Sign in again to continue.
        </p>
        <div className="mt-6">
          <ReconnectGoogleButton />
        </div>
      </CardContent>
    </Card>
  );
}

function ConversationErrorState() {
  return (
    <Card className="flex h-full min-h-0 flex-col items-center justify-center border-border/60 bg-card/80 shadow-sm">
      <CardContent className="px-6 py-16 text-center">
        <span
          aria-hidden
          className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
        >
          <FiAlertCircle className="size-5" />
        </span>
        <p className="text-sm font-medium text-foreground">
          We couldn&apos;t open this conversation
        </p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Something went wrong while loading this thread. Go back to your inbox
          and try opening it again.
        </p>
      </CardContent>
    </Card>
  );
}

export function ConversationView({
  conversation,
  activeThreadId,
  isLoading,
  conversationError,
}: ConversationViewProps) {
  if (!activeThreadId) {
    return <ConversationEmptyState />;
  }

  if (isLoading) {
    return <ConversationLoadingState />;
  }

  if (conversationError === "auth") {
    return <ConversationAuthErrorState />;
  }

  if (conversationError === "unknown" || !conversation) {
    return <ConversationErrorState />;
  }

  return (
    <Card className="flex h-full min-h-0 flex-col border-border/60 bg-card/80 shadow-sm">
      <CardHeader className="shrink-0 border-b border-border/60 px-6 py-4">
        <CardTitle className="text-lg font-semibold leading-snug tracking-tight">
          {conversation.subject}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {conversation.messages.length}{" "}
          {conversation.messages.length === 1 ? "message" : "messages"}
        </p>
      </CardHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-8 px-6 py-6">
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
                <Separator className="mt-8" />
              ) : null}
            </article>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

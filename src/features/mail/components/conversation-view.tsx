"use client";

import { FiAlertCircle, FiArrowLeft, FiMaximize2, FiMessageSquare, FiMinimize2 } from "react-icons/fi";

import type { MailConversation } from "@/features/mail/types/mail-conversation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ScrollArea,
  Skeleton,
} from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

import { ConversationMessages } from "./conversation-messages";
import { ReconnectGoogleButton } from "./reconnect-google-button";

type ConversationViewMode = "default" | "focus";

interface ConversationViewProps {
  conversation: MailConversation | null;
  activeThreadId?: string;
  isLoading: boolean;
  conversationError: "auth" | "unknown" | false;
  currentUserEmail?: string;
  mode?: ConversationViewMode;
  canToggleFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  onExitFocusMode?: () => void;
  onFocusBack?: () => void;
}

function ConversationLoadingState({ mode }: { mode: ConversationViewMode }) {
  return (
    <Card
      className={cn(
        "flex h-full min-h-0 flex-col shadow-sm",
        mode === "focus"
          ? "border-0 bg-transparent shadow-none"
          : "rounded-none border-0 bg-background shadow-none",
      )}
    >
      <CardHeader className="h-[72px] shrink-0 justify-center space-y-3 border-b border-border/60 px-6">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-8 px-6 py-6">
        <div className="mx-auto w-full max-w-3xl space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </CardContent>
    </Card>
  );
}

function ConversationEmptyState({ mode }: { mode: ConversationViewMode }) {
  return (
    <Card
      className={cn(
        "flex h-full min-h-0 flex-col items-center justify-center shadow-sm",
        mode === "focus"
          ? "border-0 bg-transparent shadow-none"
          : "rounded-none border-0 bg-background shadow-none",
      )}
    >
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
          Choose a thread from your mailbox to read the full conversation.
        </p>
      </CardContent>
    </Card>
  );
}

function ConversationAuthErrorState({ mode }: { mode: ConversationViewMode }) {
  return (
    <Card
      className={cn(
        "flex h-full min-h-0 flex-col items-center justify-center shadow-sm",
        mode === "focus"
          ? "border-0 bg-transparent shadow-none"
          : "rounded-none border-0 bg-background shadow-none",
      )}
    >
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

function ConversationErrorState({ mode }: { mode: ConversationViewMode }) {
  return (
    <Card
      className={cn(
        "flex h-full min-h-0 flex-col items-center justify-center shadow-sm",
        mode === "focus"
          ? "border-0 bg-transparent shadow-none"
          : "rounded-none border-0 bg-background shadow-none",
      )}
    >
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
  currentUserEmail,
  mode = "default",
  canToggleFocusMode = false,
  onToggleFocusMode,
  onExitFocusMode,
  onFocusBack,
}: ConversationViewProps) {
  if (!activeThreadId) {
    return <ConversationEmptyState mode={mode} />;
  }

  if (isLoading) {
    return <ConversationLoadingState mode={mode} />;
  }

  if (conversationError === "auth") {
    return <ConversationAuthErrorState mode={mode} />;
  }

  if (conversationError === "unknown" || !conversation) {
    return <ConversationErrorState mode={mode} />;
  }

  const isFocus = mode === "focus";

  return (
    <Card
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden",
        isFocus
          ? "border-0 bg-transparent shadow-none"
          : "rounded-none border-0 bg-background shadow-none",
      )}
    >
      <CardHeader
        className={cn(
          "shrink-0 border-b border-border/60",
          isFocus ? "px-4 py-4 sm:px-8" : "h-[72px] justify-center px-6",
        )}
      >
        {isFocus ? (
          <div className="mb-4 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={onFocusBack}
            >
              <FiArrowLeft className="size-4" aria-hidden />
              Back to inbox
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={onExitFocusMode}
              aria-label="Exit focus mode"
            >
              <FiMinimize2 className="size-4" />
            </Button>
          </div>
        ) : null}

        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle
              className={cn(
                "font-semibold leading-snug tracking-tight",
                isFocus
                  ? "wrap-break-word text-xl sm:text-2xl"
                  : "truncate text-lg",
              )}
            >
              {conversation.subject}
            </CardTitle>
            <p className="mt-2 text-xs text-muted-foreground">
              {conversation.messages.length}{" "}
              {conversation.messages.length === 1 ? "message" : "messages"}
              {!isFocus && canToggleFocusMode ? (
                <span className="hidden sm:inline"> · Press F for focus mode</span>
              ) : null}
            </p>
          </div>

          {!isFocus && canToggleFocusMode ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={onToggleFocusMode}
              aria-label="Enter focus mode"
            >
              <FiMaximize2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <ScrollArea className="h-0 min-h-0 flex-1 overscroll-y-contain">
        <div className="min-w-0 max-w-full overflow-x-hidden pb-6">
          <ConversationMessages
            conversation={conversation}
            mode={mode}
            currentUserEmail={currentUserEmail}
          />
        </div>
      </ScrollArea>
    </Card>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FiArrowLeft } from "react-icons/fi";

import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailThread } from "@/features/mail/types/mail-thread";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

import { ConversationView } from "./conversation-view";
import { InboxThreadList } from "./inbox-thread-list";

interface InboxWorkspaceClientProps {
  threads: MailThread[];
  conversation: MailConversation | null;
  conversationError: "auth" | "unknown" | false;
  conversationId?: string;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onExitFocusMode: () => void;
}

export function InboxWorkspaceClient({
  threads,
  conversation,
  conversationError,
  conversationId,
  isFocusMode,
  onToggleFocusMode,
  onExitFocusMode,
}: InboxWorkspaceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSelectThread = (threadId: string) => {
    startTransition(() => {
      router.push(`/app?thread=${threadId}`);
    });
  };

  const handleBackToInbox = () => {
    startTransition(() => {
      router.push("/app");
    });
  };

  const canToggleFocusMode = Boolean(
    conversationId && conversation && !conversationError && !isPending,
  );

  if (threads.length === 0) {
    return (
      <div className="h-full min-h-0">
        <InboxThreadList threads={threads} />
      </div>
    );
  }

  const handleFocusBack = () => {
    onExitFocusMode();

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      handleBackToInbox();
    }
  };

  if (isFocusMode) {
    return (
      <div className="h-full min-h-0">
        <ConversationView
          conversation={conversation}
          activeThreadId={conversationId}
          isLoading={isPending}
          conversationError={conversationError}
          mode="focus"
          canToggleFocusMode={canToggleFocusMode}
          onToggleFocusMode={onToggleFocusMode}
          onExitFocusMode={onExitFocusMode}
          onFocusBack={handleFocusBack}
        />
      </div>
    );
  }

  const showConversationOnMobile = Boolean(conversationId);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 md:grid md:grid-cols-[360px_minmax(0,1fr)] md:gap-6">
      <div
        className={cn(
          "min-h-0 md:block",
          showConversationOnMobile ? "hidden" : "block",
        )}
      >
        <InboxThreadList
          threads={threads}
          activeThreadId={conversationId}
          onSelectThread={handleSelectThread}
          isPending={isPending}
        />
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-col gap-3 md:block",
          showConversationOnMobile ? "block" : "hidden md:block",
        )}
      >
        {showConversationOnMobile ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit gap-2 md:hidden"
            onClick={handleBackToInbox}
            disabled={isPending}
          >
            <FiArrowLeft className="size-4" aria-hidden />
            Inbox
          </Button>
        ) : null}

        <ConversationView
          conversation={conversation}
          activeThreadId={conversationId}
          isLoading={isPending}
          conversationError={conversationError}
          mode="default"
          canToggleFocusMode={canToggleFocusMode}
          onToggleFocusMode={onToggleFocusMode}
          onExitFocusMode={onExitFocusMode}
          onFocusBack={handleFocusBack}
        />
      </div>
    </div>
  );
}

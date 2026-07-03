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
  currentUserEmail?: string;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onExitFocusMode: () => void;
}

export function InboxWorkspaceClient({
  threads,
  conversation,
  conversationError,
  conversationId,
  currentUserEmail,
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
          currentUserEmail={currentUserEmail}
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
    <div className="flex h-full min-h-0 flex-col gap-4 md:grid md:grid-cols-[minmax(0,32fr)_minmax(0,46fr)] md:gap-6">
      <div
        className={cn(
          "h-full min-h-0",
          showConversationOnMobile ? "hidden md:block" : "block",
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
          "flex h-full min-h-0 flex-col gap-3",
          showConversationOnMobile ? "flex" : "hidden md:flex",
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

        <div className="min-h-0 flex-1">
          <ConversationView
            conversation={conversation}
            activeThreadId={conversationId}
            isLoading={isPending}
            conversationError={conversationError}
            currentUserEmail={currentUserEmail}
            mode="default"
            canToggleFocusMode={canToggleFocusMode}
            onToggleFocusMode={onToggleFocusMode}
            onExitFocusMode={onExitFocusMode}
            onFocusBack={handleFocusBack}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailThread } from "@/features/mail/types/mail-thread";

import { ConversationView } from "./conversation-view";
import { InboxThreadList } from "./inbox-thread-list";

interface InboxWorkspaceClientProps {
  threads: MailThread[];
  conversation: MailConversation | null;
  conversationError: boolean;
  conversationId?: string;
}

export function InboxWorkspaceClient({
  threads,
  conversation,
  conversationError,
  conversationId,
}: InboxWorkspaceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSelectThread = (threadId: string) => {
    startTransition(() => {
      router.push(`/app?thread=${threadId}`);
    });
  };

  if (threads.length === 0) {
    return <InboxThreadList threads={threads} />;
  }

  return (
    <div className="grid h-full min-h-[320px] grid-cols-1 gap-4 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <InboxThreadList
        threads={threads}
        activeThreadId={conversationId}
        onSelectThread={handleSelectThread}
        isPending={isPending}
      />
      <ConversationView
        conversation={conversation}
        activeThreadId={conversationId}
        isLoading={isPending}
        hasError={conversationError}
      />
    </div>
  );
}

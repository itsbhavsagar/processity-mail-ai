"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useAssistant } from "@/features/assistant/components/assistant-provider";
import { markThreadRead } from "@/features/mail/actions/mark-thread-read";
import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailThread } from "@/features/mail/types/mail-thread";
import { emptyComposeDraft } from "@/features/mail/types/compose-draft";
import type { MailboxId } from "@/shared/constants";

import { AppShell } from "@/app/(main)/app/_components/app-shell";

import { ComposeEmailDialog } from "./compose-email-dialog";
import { ComposeButton } from "./compose-button";
import { InboxWorkspaceClient } from "./inbox-workspace-client";

interface MailAppWorkspaceProps {
  threads: MailThread[];
  conversation: MailConversation | null;
  conversationError: "auth" | "unknown" | false;
  conversationId?: string;
  mailbox: MailboxId;
  currentUserEmail?: string;
  header: React.ReactNode;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export function MailAppWorkspace({
  threads,
  conversation,
  conversationError,
  conversationId,
  mailbox,
  currentUserEmail,
  header,
}: MailAppWorkspaceProps) {
  const {
    activeSearchQuery,
    searchThreads,
    isSearchLoading,
    clearSearch,
    composeDraft,
    isComposeOpen,
    openManualCompose,
    setComposeOpen,
    updateComposeDraft,
    syncMailContext,
  } = useAssistant();

  const [readThreadIds, setReadThreadIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const markedReadThreadsRef = useRef(new Set<string>());
  const [isFocusMode, setIsFocusMode] = useState(false);

  const canUseFocusMode = Boolean(
    conversationId && conversation && !conversationError,
  );

  const baseThreads = activeSearchQuery ? searchThreads : threads;

  const displayThreads = useMemo(
    () =>
      baseThreads.map((thread) =>
        readThreadIds.has(thread.id) ? { ...thread, isUnread: false } : thread,
      ),
    [baseThreads, readThreadIds],
  );

  useEffect(() => {
    syncMailContext({ mailbox, conversationId, conversation });
  }, [mailbox, conversationId, conversation, syncMailContext]);

  useEffect(() => {
    if (!conversationId || conversationError || !conversation) {
      return;
    }

    const thread = threads.find((item) => item.id === conversationId);

    if (!thread?.isUnread || markedReadThreadsRef.current.has(conversationId)) {
      return;
    }

    markedReadThreadsRef.current.add(conversationId);

    void markThreadRead(conversationId).then((result) => {
      if (!result.success) {
        markedReadThreadsRef.current.delete(conversationId);
        return;
      }

      setReadThreadIds((current) => new Set(current).add(conversationId));
    });
  }, [conversation, conversationError, conversationId, threads]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!canUseFocusMode || isTypingTarget(event.target)) {
        return;
      }

      if (event.key === "Escape" && isFocusMode) {
        event.preventDefault();
        setIsFocusMode(false);
        return;
      }

      if (
        event.key === "f" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        setIsFocusMode((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUseFocusMode, isFocusMode]);

  return (
    <>
      <ComposeEmailDialog
        open={isComposeOpen}
        draft={composeDraft}
        onDraftChange={updateComposeDraft}
        onOpenChange={setComposeOpen}
        onSent={() => updateComposeDraft(emptyComposeDraft)}
      />

      <AppShell
        isFocusMode={isFocusMode}
        header={header}
        activeMailbox={mailbox}
        sidebarActions={<ComposeButton onClick={openManualCompose} />}
        workspace={
          <InboxWorkspaceClient
            mailbox={mailbox}
            threads={displayThreads}
            conversation={conversation}
            conversationError={conversationError}
            conversationId={conversationId}
            currentUserEmail={currentUserEmail}
            isFocusMode={isFocusMode}
            activeSearchQuery={activeSearchQuery}
            isSearchLoading={isSearchLoading}
            onClearSearch={clearSearch}
            onToggleFocusMode={() => setIsFocusMode((current) => !current)}
            onExitFocusMode={() => setIsFocusMode(false)}
          />
        }
      />
    </>
  );
}

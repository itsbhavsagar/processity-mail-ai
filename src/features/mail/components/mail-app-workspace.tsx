"use client";

import { useEffect, useState } from "react";

import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailThread } from "@/features/mail/types/mail-thread";

import { AppShell } from "@/app/(main)/app/_components/app-shell";

import { InboxWorkspaceClient } from "./inbox-workspace-client";

interface MailAppWorkspaceProps {
  threads: MailThread[];
  conversation: MailConversation | null;
  conversationError: "auth" | "unknown" | false;
  conversationId?: string;
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
}: MailAppWorkspaceProps) {
  const [isFocusMode, setIsFocusMode] = useState(false);

  const canUseFocusMode = Boolean(
    conversationId && conversation && !conversationError,
  );

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
    <AppShell
      isFocusMode={isFocusMode}
      workspace={
        <InboxWorkspaceClient
          threads={threads}
          conversation={conversation}
          conversationError={conversationError}
          conversationId={conversationId}
          isFocusMode={isFocusMode}
          onToggleFocusMode={() => setIsFocusMode((current) => !current)}
          onExitFocusMode={() => setIsFocusMode(false)}
        />
      }
    />
  );
}

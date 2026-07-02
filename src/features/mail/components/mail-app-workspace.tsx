"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AssistantPanel } from "@/features/assistant/components/assistant-panel";
import type { ComposeEmailPayload } from "@/features/assistant/types/assistant-action";
import { sendEmail } from "@/features/mail/actions/send-email";
import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailThread } from "@/features/mail/types/mail-thread";

import { AppShell } from "@/app/(main)/app/_components/app-shell";

import {
  ComposeEmailDialog,
  emptyComposeDraft,
  type ComposeDraftFields,
} from "./compose-email-dialog";
import { ComposeButton } from "./compose-button";
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
  const router = useRouter();
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeDraft, setComposeDraft] =
    useState<ComposeDraftFields>(emptyComposeDraft);
  const [pendingSendConfirmation, setPendingSendConfirmation] = useState(false);
  const [, startSendTransition] = useTransition();

  const canUseFocusMode = Boolean(
    conversationId && conversation && !conversationError,
  );

  const resetComposeDraft = useCallback(() => {
    setComposeDraft(emptyComposeDraft);
  }, []);

  const openCompose = useCallback(() => {
    setIsComposeOpen(true);
  }, []);

  const fillCompose = useCallback((payload: ComposeEmailPayload) => {
    setComposeDraft({
      to: payload.to,
      subject: payload.subject,
      body: payload.body,
    });
    setIsComposeOpen(true);
  }, []);

  const requestSendConfirmation = useCallback(() => {
    setPendingSendConfirmation(true);
  }, []);

  const sendCompose = useCallback(() => {
    const formData = new FormData();
    formData.set("to", composeDraft.to);
    formData.set("subject", composeDraft.subject);
    formData.set("body", composeDraft.body);

    const recipientEmail = composeDraft.to
      .split(",")
      .map((part) => part.trim())
      .find(Boolean);

    startSendTransition(async () => {
      const result = await sendEmail(formData);

      if (result.success) {
        toast.success("Email sent", {
          description: recipientEmail ? `Sent to ${recipientEmail}` : undefined,
        });
        setIsComposeOpen(false);
        setPendingSendConfirmation(false);
        resetComposeDraft();
        router.refresh();
        return;
      }

      if (result.error === "validation") {
        toast.error(result.message ?? "Invalid form input");
        return;
      }

      if (result.error === "auth") {
        toast.error("Your Gmail connection expired.", {
          description: "Please sign in again.",
        });
        return;
      }

      toast.error("Couldn't send email");
    });
  }, [composeDraft, resetComposeDraft, router]);

  const confirmAndSendCompose = useCallback(() => {
    if (!pendingSendConfirmation) {
      return;
    }

    sendCompose();
  }, [pendingSendConfirmation, sendCompose]);

  const handleComposeOpenChange = useCallback(
    (open: boolean) => {
      setIsComposeOpen(open);

      if (!open) {
        setPendingSendConfirmation(false);
        resetComposeDraft();
      }
    },
    [resetComposeDraft],
  );

  const handleComposeSent = useCallback(() => {
    setPendingSendConfirmation(false);
    resetComposeDraft();
  }, [resetComposeDraft]);

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
        onDraftChange={setComposeDraft}
        onOpenChange={handleComposeOpenChange}
        onSent={handleComposeSent}
      />

      <AppShell
        isFocusMode={isFocusMode}
        sidebarActions={<ComposeButton onClick={openCompose} />}
        assistant={
          <AssistantPanel
            actions={{
              openCompose,
              fillCompose,
              requestSendConfirmation,
            }}
            onConfirmedSend={confirmAndSendCompose}
            conversationId={conversationId}
          />
        }
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
    </>
  );
}

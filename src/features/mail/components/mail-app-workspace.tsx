"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AssistantPanel,
  type AssistantChatMessage,
} from "@/features/assistant/components/assistant-panel";
import { executeAssistantActions } from "@/features/assistant/executor/execute-assistant-action";
import type {
  AssistantResponse,
  ComposeEmailPayload,
} from "@/features/assistant/types/assistant-action";
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
  header: React.ReactNode;
}

const DEV_COMPOSE_RESPONSE: AssistantResponse = {
  thought: "I've filled the compose form. Would you like me to send it?",
  requiresConfirmation: true,
  actions: [
    {
      type: "compose_email",
      payload: {
        to: "john@example.com",
        subject: "Meeting Tomorrow",
        body: "Let's meet at 3pm.",
      },
    },
  ],
};

const DEV_CONFIRM_SEND_RESPONSE: AssistantResponse = {
  thought: "Sending now.",
  requiresConfirmation: false,
  actions: [{ type: "send_email" }],
};

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function createChatMessage(
  role: AssistantChatMessage["role"],
  content: string,
): AssistantChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
  };
}

export function MailAppWorkspace({
  threads,
  conversation,
  conversationError,
  conversationId,
  header,
}: MailAppWorkspaceProps) {
  const router = useRouter();
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeDraft, setComposeDraft] =
    useState<ComposeDraftFields>(emptyComposeDraft);
  const [pendingSendConfirmation, setPendingSendConfirmation] = useState(false);
  const [, startSendTransition] = useTransition();

  const [assistantMessages, setAssistantMessages] = useState<
    AssistantChatMessage[]
  >([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);

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

  const processAssistantResponse = useCallback(
    (response: AssistantResponse) => {
      setAssistantMessages((current) => [
        ...current,
        createChatMessage("assistant", response.thought),
      ]);

      executeAssistantActions(response.actions, {
        openCompose,
        fillCompose,
      });

      if (response.requiresConfirmation) {
        requestSendConfirmation();
        return;
      }

      const wantsSend = response.actions.some(
        (action) => action.type === "send_email",
      );

      if (wantsSend) {
        confirmAndSendCompose();
      }
    },
    [confirmAndSendCompose, fillCompose, openCompose, requestSendConfirmation],
  );

  const submitAssistantPrompt = useCallback(() => {
    const trimmed = assistantInput.trim();
    if (!trimmed || assistantLoading) {
      return;
    }

    setAssistantMessages((current) => [
      ...current,
      createChatMessage("user", trimmed),
    ]);
    setAssistantInput("");
    setAssistantLoading(true);

    if (trimmed.toLowerCase() === "yes") {
      processAssistantResponse(DEV_CONFIRM_SEND_RESPONSE);
    } else {
      setAssistantMessages((current) => [
        ...current,
        createChatMessage(
          "assistant",
          "I'm not connected yet. I'll handle requests like that once the assistant is online.",
        ),
      ]);
    }

    setAssistantLoading(false);
  }, [assistantInput, assistantLoading, processAssistantResponse]);

  const handleDevCompose = useCallback(() => {
    setAssistantMessages((current) => [
      ...current,
      createChatMessage(
        "user",
        "Send an email to john@example.com with subject Meeting Tomorrow and body Let's meet at 3pm.",
      ),
    ]);
    processAssistantResponse(DEV_COMPOSE_RESPONSE);
  }, [processAssistantResponse]);

  const handleDevConfirmSend = useCallback(() => {
    setAssistantMessages((current) => [
      ...current,
      createChatMessage("user", "Yes"),
    ]);
    processAssistantResponse(DEV_CONFIRM_SEND_RESPONSE);
  }, [processAssistantResponse]);

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
        header={header}
        sidebarActions={<ComposeButton onClick={openCompose} />}
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

      <AssistantPanel
        messages={assistantMessages}
        input={assistantInput}
        onInputChange={setAssistantInput}
        isLoading={assistantLoading}
        onSubmitPrompt={submitAssistantPrompt}
        onSuggestionSelect={setAssistantInput}
        onDevCompose={
          process.env.NODE_ENV === "development" ? handleDevCompose : undefined
        }
        onDevConfirmSend={
          process.env.NODE_ENV === "development"
            ? handleDevConfirmSend
            : undefined
        }
      />
    </>
  );
}

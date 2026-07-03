"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AssistantPanel,
  type AssistantChatMessage,
  type AssistantComposeDraftMessage,
} from "@/features/assistant/components/assistant-panel";
import {
  COMPOSE_FILL_PREPARE_MS,
  COMPOSE_FILL_STAGGER_MS,
  type AssistantComposeDraftStatus,
} from "@/features/assistant/types/assistant-message";
import { executeAssistantActions } from "@/features/assistant/executor/execute-assistant-action";
import {
  AssistantClientError,
  requestAssistantResponse,
} from "@/features/assistant/services/assistant-client";
import type {
  AssistantContext,
  AssistantResponse,
  ComposeEmailPayload,
  MailboxType,
} from "@/features/assistant/types/assistant-action";
import { getMailboxDisplayName } from "@/features/mail/lib/parse-mailbox";
import { sendEmail } from "@/features/mail/actions/send-email";
import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailThread } from "@/features/mail/types/mail-thread";
import {
  emptyComposeDraft,
  type ComposeDraft,
} from "@/features/mail/types/compose-draft";

import { AppShell } from "@/app/(main)/app/_components/app-shell";

import { ComposeEmailDialog } from "./compose-email-dialog";
import { ComposeButton } from "./compose-button";
import { InboxWorkspaceClient } from "./inbox-workspace-client";

interface MailAppWorkspaceProps {
  threads: MailThread[];
  conversation: MailConversation | null;
  conversationError: "auth" | "unknown" | false;
  conversationId?: string;
  currentUserEmail?: string;
  header: React.ReactNode;
}

const DEV_COMPOSE_RESPONSE: AssistantResponse = {
  thought: "I've prepared the draft.",
  requiresConfirmation: false,
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
  thought: "Sending the email now.",
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

function createTextMessage(
  role: "user" | "assistant",
  content: string,
): AssistantChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    kind: "text",
    content,
  };
}

function toApiMessageContent(message: AssistantChatMessage): string {
  if (message.kind === "text") {
    return message.content;
  }

  if (message.status === "sent") {
    return `${message.content}\n\n[Email already sent to ${message.draft.to}. Subject: ${message.draft.subject}. There is no active draft.]`;
  }

  if (message.status === "superseded") {
    return `${message.content}\n\n[Superseded draft — not active.]`;
  }

  if (message.status === "preparing" || message.status === "filling") {
    return `${message.content}\n\n[Draft is being prepared.]`;
  }

  if (message.status === "sending") {
    return `${message.content}\n\n[Email is currently being sent.]`;
  }

  const draftSummary = [
    "Active draft email:",
    `To: ${message.draft.to}`,
    `Subject: ${message.draft.subject}`,
    `Body: ${message.draft.body}`,
  ].join("\n");

  const summary = message.content
    ? `${message.content}\n\n${draftSummary}`
    : draftSummary;

  return summary.trim() || "Draft email prepared.";
}

function isActiveDraftMessage(
  message: AssistantChatMessage | undefined,
): message is AssistantComposeDraftMessage {
  return (
    message?.kind === "compose_draft" &&
    message.status === "draft"
  );
}

function buildAssistantContext(options: {
  currentMailbox: MailboxType;
  conversationId?: string;
  conversation: MailConversation | null;
  hasActiveDraft: boolean;
  activeDraft: ComposeDraft | null;
}): AssistantContext {
  const latestMessage = options.conversation?.messages.at(-1);

  return {
    currentMailbox: options.currentMailbox,
    currentThreadId: options.conversationId,
    currentConversation: options.conversation
      ? {
          subject: options.conversation.subject,
          sender: latestMessage
            ? getMailboxDisplayName(latestMessage.sender)
            : "Unknown",
        }
      : null,
    hasActiveDraft: options.hasActiveDraft,
    activeDraft: options.activeDraft,
  };
}

function supersedeDraftMessages(
  messages: AssistantChatMessage[],
): AssistantChatMessage[] {
  return messages.map((message) => {
    if (
      message.kind === "compose_draft" &&
      (message.status === "preparing" ||
        message.status === "filling" ||
        message.status === "draft" ||
        message.status === "sending")
    ) {
      return { ...message, status: "superseded" as const };
    }

    return message;
  });
}

export function MailAppWorkspace({
  threads,
  conversation,
  conversationError,
  conversationId,
  currentUserEmail,
  header,
}: MailAppWorkspaceProps) {
  const router = useRouter();
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeDraft, setComposeDraft] =
    useState<ComposeDraft>(emptyComposeDraft);
  const [activeComposeMessageId, setActiveComposeMessageId] = useState<
    string | null
  >(null);
  const activeComposeMessageIdRef = useRef<string | null>(null);
  const composeDraftRef = useRef<ComposeDraft>(emptyComposeDraft);
  const fillAnimationTimersRef = useRef<number[]>([]);
  const assistantMessagesRef = useRef<AssistantChatMessage[]>([]);
  const [, startSendTransition] = useTransition();

  const [assistantMessages, setAssistantMessages] = useState<
    AssistantChatMessage[]
  >([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);

  const canUseFocusMode = Boolean(
    conversationId && conversation && !conversationError,
  );

  useEffect(() => {
    composeDraftRef.current = composeDraft;
  }, [composeDraft]);

  useEffect(() => {
    activeComposeMessageIdRef.current = activeComposeMessageId;
  }, [activeComposeMessageId]);

  useEffect(() => {
    assistantMessagesRef.current = assistantMessages;
  }, [assistantMessages]);

  useEffect(() => {
    return () => {
      fillAnimationTimersRef.current.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

  const clearFillAnimation = useCallback(() => {
    fillAnimationTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    fillAnimationTimersRef.current = [];
  }, []);

  const updateComposeMessage = useCallback(
    (
      messageId: string,
      patch: Partial<AssistantComposeDraftMessage>,
    ) => {
      setAssistantMessages((current) =>
        current.map((message) =>
          message.id === messageId && message.kind === "compose_draft"
            ? { ...message, ...patch }
            : message,
        ),
      );
    },
    [],
  );

  const applyLiveDraft = useCallback(
    (draft: ComposeDraft, status?: AssistantComposeDraftStatus) => {
      composeDraftRef.current = draft;
      setComposeDraft(draft);

      const messageId = activeComposeMessageIdRef.current;
      if (messageId && status) {
        updateComposeMessage(messageId, { draft, status });
      }
    },
    [updateComposeMessage],
  );

  const canSendActiveDraft = useCallback(() => {
    const messageId = activeComposeMessageIdRef.current;

    if (!messageId) {
      return false;
    }

    const message = assistantMessagesRef.current.find(
      (entry) => entry.id === messageId,
    );

    if (!isActiveDraftMessage(message)) {
      return false;
    }

    return composeDraftRef.current.to.trim().length > 0;
  }, []);

  const getActiveDraftContext = useCallback(() => {
    const messageId = activeComposeMessageIdRef.current;

    if (!messageId) {
      return { hasActiveDraft: false, activeDraft: null };
    }

    const message = assistantMessagesRef.current.find(
      (entry) => entry.id === messageId,
    );

    if (!isActiveDraftMessage(message)) {
      return { hasActiveDraft: false, activeDraft: null };
    }

    return {
      hasActiveDraft: true,
      activeDraft: composeDraftRef.current,
    };
  }, []);
  const startFillAnimation = useCallback(
    (messageId: string, target: ComposeDraft) => {
      clearFillAnimation();

      const schedule = (callback: () => void, delay: number) => {
        const timerId = window.setTimeout(callback, delay);
        fillAnimationTimersRef.current.push(timerId);
      };

      schedule(() => {
        applyLiveDraft(
          { ...emptyComposeDraft, to: target.to },
          "filling",
        );
      }, COMPOSE_FILL_PREPARE_MS);

      schedule(() => {
        applyLiveDraft(
          { to: target.to, subject: target.subject, body: "" },
          "filling",
        );
      }, COMPOSE_FILL_PREPARE_MS + COMPOSE_FILL_STAGGER_MS);

      schedule(() => {
        applyLiveDraft(target, "filling");
      }, COMPOSE_FILL_PREPARE_MS + COMPOSE_FILL_STAGGER_MS * 2);

      schedule(() => {
        applyLiveDraft(target, "draft");
      }, COMPOSE_FILL_PREPARE_MS + COMPOSE_FILL_STAGGER_MS * 2 + 80);
    },
    [applyLiveDraft, clearFillAnimation],
  );

  const resetComposeDraft = useCallback(() => {
    composeDraftRef.current = emptyComposeDraft;
    setComposeDraft(emptyComposeDraft);
  }, []);

  const updateComposeDraft = useCallback((draft: ComposeDraft) => {
    composeDraftRef.current = draft;
    setComposeDraft(draft);
  }, []);

  const openManualCompose = useCallback(() => {
    clearFillAnimation();
    setAssistantMessages((current) => supersedeDraftMessages(current));
    activeComposeMessageIdRef.current = null;
    setActiveComposeMessageId(null);
    resetComposeDraft();
    setIsComposeOpen(true);
  }, [clearFillAnimation, resetComposeDraft]);

  const showAssistantComposeDraft = useCallback(
    (
      payload: ComposeEmailPayload,
      thought: string,
      updateExisting = false,
    ) => {
      const targetDraft: ComposeDraft = {
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
      };

      if (updateExisting && activeComposeMessageIdRef.current) {
        const messageId = activeComposeMessageIdRef.current;
        clearFillAnimation();
        applyLiveDraft(targetDraft, "draft");
        updateComposeMessage(messageId, {
          content: thought,
          targetDraft,
        });
        return;
      }

      const messageId = crypto.randomUUID();

      activeComposeMessageIdRef.current = messageId;
      setActiveComposeMessageId(messageId);
      composeDraftRef.current = emptyComposeDraft;
      setComposeDraft(emptyComposeDraft);

      const composeMessage: AssistantComposeDraftMessage = {
        id: messageId,
        role: "assistant",
        kind: "compose_draft",
        content: thought,
        draft: emptyComposeDraft,
        targetDraft,
        status: "preparing",
      };

      setAssistantMessages((current) => [
        ...supersedeDraftMessages(current),
        composeMessage,
      ]);

      startFillAnimation(messageId, targetDraft);
    },
    [
      applyLiveDraft,
      clearFillAnimation,
      startFillAnimation,
      updateComposeMessage,
    ],
  );

  const markActiveDraftSending = useCallback(() => {
    const messageId = activeComposeMessageIdRef.current;

    if (messageId) {
      updateComposeMessage(messageId, { status: "sending" });
    }
  }, [updateComposeMessage]);

  const markActiveDraftSendFailed = useCallback(() => {
    const messageId = activeComposeMessageIdRef.current;

    if (messageId) {
      updateComposeMessage(messageId, { status: "draft" });
    }
  }, [updateComposeMessage]);

  const markActiveDraftSent = useCallback(() => {
    const sentDraft = composeDraftRef.current;
    const messageId = activeComposeMessageIdRef.current;
    const sentAt = new Date().toISOString();

    if (messageId) {
      setAssistantMessages((current) =>
        current.map((message) =>
          message.id === messageId && message.kind === "compose_draft"
            ? {
                ...message,
                status: "sent" as const,
                draft: sentDraft,
                sentAt,
              }
            : message,
        ),
      );
    }

    activeComposeMessageIdRef.current = null;
    setActiveComposeMessageId(null);
    clearFillAnimation();
    resetComposeDraft();
  }, [clearFillAnimation, resetComposeDraft]);

  const sendCompose = useCallback(() => {
    const draft = composeDraftRef.current;
    const formData = new FormData();
    formData.set("to", draft.to);
    formData.set("subject", draft.subject);
    formData.set("body", draft.body);

    const recipientEmail = draft.to
      .split(",")
      .map((part) => part.trim())
      .find(Boolean);

    markActiveDraftSending();

    startSendTransition(async () => {
      const result = await sendEmail(formData);

      if (result.success) {
        toast.success("Email sent", {
          description: recipientEmail ? `Sent to ${recipientEmail}` : undefined,
        });
        setIsComposeOpen(false);
        markActiveDraftSent();
        router.refresh();
        return;
      }

      markActiveDraftSendFailed();

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
  }, [
    markActiveDraftSendFailed,
    markActiveDraftSending,
    markActiveDraftSent,
    router,
  ]);

  const processAssistantResponse = useCallback(
    (response: AssistantResponse) => {
      const hasCompose = response.actions.some(
        (action) => action.type === "compose_email",
      );
      const wantsSend = response.actions.some(
        (action) => action.type === "send_email",
      );
      const activeMessage = assistantMessagesRef.current.find(
        (entry) => entry.id === activeComposeMessageIdRef.current,
      );
      const isDraftRevision = hasCompose && isActiveDraftMessage(activeMessage);

      executeAssistantActions(response.actions, {
        showAssistantComposeDraft: (payload) => {
          showAssistantComposeDraft(payload, response.thought, isDraftRevision);
        },
      });

      if (!hasCompose) {
        let thought = response.thought;

        if (wantsSend && !canSendActiveDraft()) {
          thought =
            "There isn't an active draft to send. Would you like to compose a new email?";
        }

        setAssistantMessages((current) => [
          ...current,
          createTextMessage("assistant", thought),
        ]);
      }

      if (wantsSend && canSendActiveDraft()) {
        sendCompose();
      }
    },
    [canSendActiveDraft, sendCompose, showAssistantComposeDraft],
  );

  const submitAssistantPrompt = useCallback(async () => {
    const trimmed = assistantInput.trim();
    if (!trimmed || assistantLoading) {
      return;
    }

    setAssistantMessages((current) => [
      ...current,
      createTextMessage("user", trimmed),
    ]);
    setAssistantInput("");
    setAssistantLoading(true);

    const { hasActiveDraft, activeDraft } = getActiveDraftContext();

    try {
      const response = await requestAssistantResponse({
        messages: [
          ...assistantMessages.map((message) => ({
            role: message.role,
            content: toApiMessageContent(message),
          })),
          { role: "user", content: trimmed },
        ],
        context: buildAssistantContext({
          currentMailbox: "inbox",
          conversationId,
          conversation,
          hasActiveDraft,
          activeDraft,
        }),
      });

      processAssistantResponse(response);
    } catch (error) {
      const message =
        error instanceof AssistantClientError
          ? error.message
          : "The assistant is unavailable. Try again in a moment.";

      setAssistantMessages((current) => [
        ...current,
        createTextMessage("assistant", message),
      ]);
    } finally {
      setAssistantLoading(false);
    }
  }, [
    assistantInput,
    assistantLoading,
    assistantMessages,
    conversation,
    conversationId,
    processAssistantResponse,
    getActiveDraftContext,
  ]);

  const handleDevCompose = useCallback(() => {
    setAssistantMessages((current) => [
      ...current,
      createTextMessage(
        "user",
        "Send an email to john@example.com with subject Meeting Tomorrow and body Let's meet at 3pm.",
      ),
    ]);
    processAssistantResponse(DEV_COMPOSE_RESPONSE);
  }, [processAssistantResponse]);

  const handleDevConfirmSend = useCallback(() => {
    setAssistantMessages((current) => [
      ...current,
      createTextMessage("user", "Send it"),
    ]);
    processAssistantResponse(DEV_CONFIRM_SEND_RESPONSE);
  }, [processAssistantResponse]);

  const handleComposeOpenChange = useCallback((open: boolean) => {
    setIsComposeOpen(open);

    if (!open) {
      resetComposeDraft();
    }
  }, [resetComposeDraft]);

  const handleManualComposeSent = useCallback(() => {
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
        onDraftChange={updateComposeDraft}
        onOpenChange={handleComposeOpenChange}
        onSent={handleManualComposeSent}
      />

      <AppShell
        isFocusMode={isFocusMode}
        header={header}
        sidebarActions={<ComposeButton onClick={openManualCompose} />}
        workspace={
          <InboxWorkspaceClient
            threads={threads}
            conversation={conversation}
            conversationError={conversationError}
            conversationId={conversationId}
            currentUserEmail={currentUserEmail}
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
        activeComposeMessageId={activeComposeMessageId}
        composeDraft={composeDraft}
        onComposeDraftChange={updateComposeDraft}
        onComposeSend={sendCompose}
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

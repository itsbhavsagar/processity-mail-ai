"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AssistantPanel } from "@/features/assistant/components/assistant-panel";
import { ASSISTANT_COPY } from "@/features/assistant/constants";
import { executeAssistantActions } from "@/features/assistant/executor/execute-assistant-action";
import {
  createTextMessage,
  findActiveDraftMessage,
  resolveActiveDraft,
  supersedeDraftMessages,
  toApiMessageContent,
} from "@/features/assistant/lib/assistant-message-utils";
import { runComposeTypingAnimation, typeAssistantMessage } from "@/features/assistant/lib/compose-typing-animation";
import type {
  AssistantChatMessage,
  AssistantComposeDraftMessage,
  AssistantComposeDraftStatus,
} from "@/features/assistant/types/assistant-message";
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
import {
  draftToFormData,
  getPrimaryRecipientEmail,
} from "@/features/mail/lib/compose-send";
import { markThreadRead } from "@/features/mail/actions/mark-thread-read";
import { sendEmail } from "@/features/mail/actions/send-email";
import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailThread } from "@/features/mail/types/mail-thread";
import {
  emptyComposeDraft,
  type ComposeDraft,
} from "@/features/mail/types/compose-draft";
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

const DEV_COMPOSE_RESPONSE: AssistantResponse = {
  thought: "Drafting a sample email.",
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

export function MailAppWorkspace({
  threads,
  conversation,
  conversationError,
  conversationId,
  mailbox,
  currentUserEmail,
  header,
}: MailAppWorkspaceProps) {
  const router = useRouter();
  const [readThreadIds, setReadThreadIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const markedReadThreadsRef = useRef(new Set<string>());
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
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [typingAssistantText, setTypingAssistantText] = useState<string | null>(
    null,
  );

  const canUseFocusMode = Boolean(
    conversationId && conversation && !conversationError,
  );

  const displayThreads = useMemo(
    () =>
      threads.map((thread) =>
        readThreadIds.has(thread.id) ? { ...thread, isUnread: false } : thread,
      ),
    [readThreadIds, threads],
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

  const createAnimationSchedule = useCallback(() => {
    clearFillAnimation();

    return (callback: () => void, delay: number) => {
      const timerId = window.setTimeout(callback, delay);
      fillAnimationTimersRef.current.push(timerId);
    };
  }, [clearFillAnimation]);

  const typeAssistantText = useCallback(
    (text: string, onComplete: () => void) => {
      const schedule = createAnimationSchedule();
      setTypingAssistantText("");

      typeAssistantMessage(
        text,
        schedule,
        (partial) => setTypingAssistantText(partial),
        () => {
          setAssistantMessages((current) => [
            ...current,
            createTextMessage("assistant", text),
          ]);
          setTypingAssistantText(null);
          onComplete();
        },
      );
    },
    [createAnimationSchedule],
  );

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
    return resolveActiveDraft(
      activeComposeMessageIdRef.current,
      assistantMessagesRef.current,
      composeDraftRef.current,
    ).canSend;
  }, []);

  const getActiveDraftContext = useCallback(() => {
    const { hasActiveDraft, activeDraft } = resolveActiveDraft(
      activeComposeMessageIdRef.current,
      assistantMessagesRef.current,
      composeDraftRef.current,
    );

    return { hasActiveDraft, activeDraft };
  }, []);

  const clearActiveComposeMessage = useCallback(() => {
    activeComposeMessageIdRef.current = null;
    setActiveComposeMessageId(null);
  }, []);
  const startFillAnimation = useCallback(
    (
      messageId: string,
      target: ComposeDraft,
      variant: "create" | "revise" = "create",
    ) => {
      const schedule = createAnimationSchedule();

      runComposeTypingAnimation(
        target,
        schedule,
        (draft, status) => {
          applyLiveDraft(draft, status);
        },
        () => {
          applyLiveDraft(target, "draft");
          updateComposeMessage(messageId, {
            draft: target,
            status: "draft",
            variant,
          });
          typeAssistantText(
            variant === "revise"
              ? ASSISTANT_COPY.draftUpdated
              : ASSISTANT_COPY.draftReady,
            () => setAssistantBusy(false),
          );
        },
      );
    },
    [applyLiveDraft, createAnimationSchedule, typeAssistantText, updateComposeMessage],
  );

  const updateComposeDraft = useCallback((draft: ComposeDraft) => {
    composeDraftRef.current = draft;
    setComposeDraft(draft);
  }, []);

  const openManualCompose = useCallback(() => {
    clearFillAnimation();
    setTypingAssistantText(null);
    setAssistantBusy(false);
    setAssistantMessages((current) => supersedeDraftMessages(current));
    clearActiveComposeMessage();
    updateComposeDraft(emptyComposeDraft);
    setIsComposeOpen(true);
  }, [clearActiveComposeMessage, clearFillAnimation, updateComposeDraft]);

  const showAssistantComposeDraft = useCallback(
    (
      payload: ComposeEmailPayload,
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
        updateComposeDraft(emptyComposeDraft);
        updateComposeMessage(messageId, {
          content: "",
          draft: emptyComposeDraft,
          status: "preparing",
          variant: "revise",
        });
        startFillAnimation(messageId, targetDraft, "revise");
        return;
      }

      const messageId = crypto.randomUUID();

      activeComposeMessageIdRef.current = messageId;
      setActiveComposeMessageId(messageId);
      updateComposeDraft(emptyComposeDraft);

      const composeMessage: AssistantComposeDraftMessage = {
        id: messageId,
        role: "assistant",
        kind: "compose_draft",
        content: "",
        draft: emptyComposeDraft,
        status: "preparing",
        variant: "create",
      };

      setAssistantMessages((current) => [
        ...supersedeDraftMessages(current),
        composeMessage,
      ]);

      startFillAnimation(messageId, targetDraft, "create");
    },
    [
      clearFillAnimation,
      startFillAnimation,
      updateComposeDraft,
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

    clearActiveComposeMessage();
    clearFillAnimation();
    updateComposeDraft(emptyComposeDraft);
  }, [clearActiveComposeMessage, clearFillAnimation, updateComposeDraft]);

  const sendCompose = useCallback(() => {
    const draft = composeDraftRef.current;
    const formData = draftToFormData(draft);
    const recipientEmail = getPrimaryRecipientEmail(draft.to);

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
      const activeMessage = findActiveDraftMessage(
        activeComposeMessageIdRef.current,
        assistantMessagesRef.current,
      );
      const isDraftRevision = hasCompose && Boolean(activeMessage);

      let thought = response.thought;

      if (wantsSend && !canSendActiveDraft()) {
        thought = ASSISTANT_COPY.noActiveDraft;
      }

      typeAssistantText(thought, () => {
        if (hasCompose) {
          executeAssistantActions(response.actions, {
            showAssistantComposeDraft: (payload) => {
              showAssistantComposeDraft(payload, isDraftRevision);
            },
          });
          return;
        }

        if (wantsSend && canSendActiveDraft()) {
          sendCompose();
        }

        setAssistantBusy(false);
      });
    },
    [canSendActiveDraft, sendCompose, showAssistantComposeDraft, typeAssistantText],
  );

  const submitAssistantPrompt = useCallback(async () => {
    const trimmed = assistantInput.trim();
    if (!trimmed || assistantLoading || assistantBusy) {
      return;
    }

    setAssistantMessages((current) => [
      ...current,
      createTextMessage("user", trimmed),
    ]);
    setAssistantInput("");
    clearFillAnimation();
    setTypingAssistantText(null);
    setAssistantBusy(true);
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
          currentMailbox: mailbox,
          conversationId,
          conversation,
          hasActiveDraft,
          activeDraft,
        }),
      });

      setAssistantLoading(false);
      processAssistantResponse(response);
    } catch (error) {
      const message =
        error instanceof AssistantClientError
          ? error.message
          : ASSISTANT_COPY.unavailable;

      setAssistantLoading(false);
      typeAssistantText(message, () => setAssistantBusy(false));
    }
  }, [
    assistantInput,
    assistantBusy,
    assistantLoading,
    assistantMessages,
    clearFillAnimation,
    conversation,
    conversationId,
    mailbox,
    processAssistantResponse,
    getActiveDraftContext,
    typeAssistantText,
  ]);

  const handleDevCompose = useCallback(() => {
    setAssistantBusy(true);
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
    setAssistantBusy(true);
    setAssistantMessages((current) => [
      ...current,
      createTextMessage("user", "Send it"),
    ]);
    processAssistantResponse(DEV_CONFIRM_SEND_RESPONSE);
  }, [processAssistantResponse]);

  const handleComposeOpenChange = useCallback((open: boolean) => {
    setIsComposeOpen(open);

    if (!open) {
      updateComposeDraft(emptyComposeDraft);
    }
  }, [updateComposeDraft]);

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
        isBusy={assistantBusy}
        typingAssistantText={typingAssistantText}
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

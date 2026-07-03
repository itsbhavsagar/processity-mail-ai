"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AssistantPanel } from "@/features/assistant/components/assistant-panel";
import { ASSISTANT_COPY } from "@/features/assistant/constants";
import { executeAssistantActions } from "@/features/assistant/executor/execute-assistant-action";
import { trimAssistantMessagesForApi } from "@/features/assistant/lib/trim-assistant-request";
import {
  buildAssistantCacheKey,
  getCachedAssistantResponse,
  setCachedAssistantResponse,
} from "@/features/assistant/lib/assistant-response-cache";
import {
  matchLocalIntent,
  type LocalIntentResult,
} from "@/features/assistant/lib/local-intent-router";
import {
  buildAssistantContext,
  toSearchResults,
  type AssistantMailContext,
} from "@/features/assistant/lib/build-assistant-context";
import {
  createTextMessage,
  findActiveDraftMessage,
  resolveActiveDraft,
  supersedeDraftMessages,
  supersedeOtherDraftMessages,
  toApiMessageContent,
} from "@/features/assistant/lib/assistant-message-utils";
import {
  runDraftTypingAnimation,
  typeAssistantMessage,
} from "@/features/assistant/lib/compose-typing-animation";
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
  AssistantResponse,
  ComposeEmailPayload,
  ReplyEmailPayload,
  SearchEmailsPayload,
} from "@/features/assistant/types/assistant-action";
import { buildReplyDraftFromMailContext } from "@/features/mail/lib/build-reply-draft";
import { buildMailboxUrl } from "@/features/mail/lib/mailbox-url";
import {
  assistantDraftToFormData,
  getPrimaryRecipientEmail,
  getReplyRecipientEmail,
} from "@/features/mail/lib/compose-send";
import { searchMailThreads } from "@/features/mail/actions/search-mail-threads";
import { sendEmail } from "@/features/mail/actions/send-email";
import { sendReplyEmail } from "@/features/mail/actions/send-reply-email";
import type { MailThread } from "@/features/mail/types/mail-thread";
import {
  emptyComposeDraft,
  emptyReplyDraft,
  isReplyDraft,
  type AssistantDraft,
} from "@/features/mail/types/compose-draft";
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

const defaultMailContext: AssistantMailContext = {
  mailbox: "inbox",
  conversation: null,
};

type AssistantContextValue = {
  activeSearchQuery: string | null;
  searchThreads: MailThread[];
  isSearchLoading: boolean;
  clearSearch: () => void;
  composeDraft: AssistantDraft;
  isComposeOpen: boolean;
  openManualCompose: () => void;
  setComposeOpen: (open: boolean) => void;
  updateComposeDraft: (draft: AssistantDraft) => void;
  syncMailContext: (mail: AssistantMailContext) => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return context;
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mailContextRef = useRef<AssistantMailContext>(defaultMailContext);
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
  const [activeSearchQuery, setActiveSearchQuery] = useState<string | null>(
    null,
  );
  const [searchThreads, setSearchThreads] = useState<MailThread[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeDraft, setComposeDraft] =
    useState<AssistantDraft>(emptyComposeDraft);
  const [activeComposeMessageId, setActiveComposeMessageId] = useState<
    string | null
  >(null);

  const activeComposeMessageIdRef = useRef<string | null>(null);
  const composeDraftRef = useRef<AssistantDraft>(emptyComposeDraft);
  const fillAnimationTimersRef = useRef<number[]>([]);
  const assistantMessagesRef = useRef<AssistantChatMessage[]>([]);

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

  const syncMailContext = useCallback((mail: AssistantMailContext) => {
    mailContextRef.current = mail;
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
    (draft: AssistantDraft, status?: AssistantComposeDraftStatus) => {
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

  const clearSearch = useCallback(() => {
    setActiveSearchQuery(null);
    setSearchThreads([]);
    setIsSearchLoading(false);
  }, []);

  const applySearchEmails = useCallback(async ({ query }: SearchEmailsPayload) => {
    setActiveSearchQuery(query);
    setIsSearchLoading(true);
    setSearchThreads([]);

    const result = await searchMailThreads(query);

    if (result.success) {
      setSearchThreads(result.threads);
      setIsSearchLoading(false);
      return;
    }

    setActiveSearchQuery(null);
    setSearchThreads([]);
    setIsSearchLoading(false);

    if (result.error === "auth") {
      toast.error("Your Gmail connection expired.", {
        description: "Please sign in again.",
      });
      return;
    }

    toast.error(result.message ?? "Couldn't search your mailbox");
  }, []);

  const openEmail = useCallback(
    (threadId: string) => {
      if (!activeSearchQuery) {
        return;
      }

      const isListed = searchThreads.some((thread) => thread.id === threadId);
      if (!isListed) {
        return;
      }

      const { mailbox } = mailContextRef.current;
      router.push(buildMailboxUrl(mailbox, threadId));
    },
    [activeSearchQuery, router, searchThreads],
  );

  const startFillAnimation = useCallback(
    (
      messageId: string,
      target: AssistantDraft,
      variant: "create" | "revise" = "create",
    ) => {
      const schedule = createAnimationSchedule();

      runDraftTypingAnimation(
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
          setAssistantBusy(false);
        },
      );
    },
    [applyLiveDraft, createAnimationSchedule, updateComposeMessage],
  );

  const updateComposeDraft = useCallback((draft: AssistantDraft) => {
    composeDraftRef.current = draft;
    setComposeDraft(draft);

    const messageId = activeComposeMessageIdRef.current;
    if (messageId) {
      updateComposeMessage(messageId, { draft });
    }
  }, [updateComposeMessage]);

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
      const targetDraft: AssistantDraft = {
        kind: "compose",
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
      };

      if (updateExisting && activeComposeMessageIdRef.current) {
        const messageId = activeComposeMessageIdRef.current;
        clearFillAnimation();
        setAssistantMessages((current) =>
          supersedeOtherDraftMessages(current, messageId),
        );
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
        ...supersedeOtherDraftMessages(current, messageId),
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

  const showAssistantReplyDraft = useCallback(
    (
      payload: ReplyEmailPayload,
      updateExisting = false,
    ) => {
      const mail = mailContextRef.current;
      const targetDraft = buildReplyDraftFromMailContext(
        mail,
        payload.threadId,
        payload.body,
        mail.currentUserEmail,
      );

      if (!targetDraft) {
        toast.error("Open the conversation you want to reply to first.");
        setAssistantBusy(false);
        return;
      }

      if (updateExisting && activeComposeMessageIdRef.current) {
        const messageId = activeComposeMessageIdRef.current;
        clearFillAnimation();
        setAssistantMessages((current) =>
          supersedeOtherDraftMessages(current, messageId),
        );
        updateComposeDraft(emptyReplyDraft);
        updateComposeMessage(messageId, {
          content: "",
          draft: emptyReplyDraft,
          status: "preparing",
          variant: "revise",
        });
        startFillAnimation(messageId, targetDraft, "revise");
        return;
      }

      const messageId = crypto.randomUUID();

      activeComposeMessageIdRef.current = messageId;
      setActiveComposeMessageId(messageId);
      updateComposeDraft(emptyReplyDraft);

      const replyMessage: AssistantComposeDraftMessage = {
        id: messageId,
        role: "assistant",
        kind: "compose_draft",
        content: "",
        draft: emptyReplyDraft,
        status: "preparing",
        variant: "create",
      };

      setAssistantMessages((current) => [
        ...supersedeOtherDraftMessages(current, messageId),
        replyMessage,
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
    const draft = composeDraftRef.current;

    if (messageId) {
      updateComposeMessage(messageId, { status: "failed", draft });
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
    const formData = assistantDraftToFormData(draft);
    const recipientEmail = isReplyDraft(draft)
      ? getReplyRecipientEmail(draft)
      : getPrimaryRecipientEmail(draft.to);

    markActiveDraftSending();

    startSendTransition(async () => {
      const result = isReplyDraft(draft)
        ? await sendReplyEmail(formData)
        : await sendEmail(formData);

      if (process.env.NODE_ENV === "development") {
        console.log("[CommandMail AI]", {
          type: "send_email_result",
          kind: draft.kind,
          success: result.success,
          error: result.success ? undefined : result.error,
          message: result.success ? undefined : result.message,
        });
      }

      if (result.success) {
        toast.success(isReplyDraft(draft) ? "Reply sent" : "Email sent", {
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

      toast.error(
        isReplyDraft(draft) ? "Couldn't send reply" : "Couldn't send email",
      );
    });
  }, [
    markActiveDraftSendFailed,
    markActiveDraftSending,
    markActiveDraftSent,
    router,
  ]);

  const processAssistantResponse = useCallback(
    (response: AssistantResponse) => {
      const hasDraftAction = response.actions.some(
        (action) =>
          action.type === "compose_email" || action.type === "reply_email",
      );
      const wantsSend = response.actions.some(
        (action) => action.type === "send_email",
      );
      const activeMessage = findActiveDraftMessage(
        activeComposeMessageIdRef.current,
        assistantMessagesRef.current,
      );
      const isDraftRevision = hasDraftAction && Boolean(activeMessage);

      let thought = response.thought;
      const shouldSendDraft = wantsSend && canSendActiveDraft();

      if (shouldSendDraft) {
        markActiveDraftSending();
        void executeAssistantActions(response.actions, {
          showAssistantComposeDraft: (payload) => {
            showAssistantComposeDraft(payload, isDraftRevision);
          },
          showAssistantReplyDraft: (payload) => {
            showAssistantReplyDraft(payload, isDraftRevision);
          },
          applySearchEmails: applySearchEmails,
          openEmail: (payload) => {
            openEmail(payload.threadId);
          },
          sendEmail: () => {
            sendCompose();
          },
        }).finally(() => {
          setAssistantBusy(false);
        });
        return;
      }

      if (wantsSend && !shouldSendDraft) {
        thought = ASSISTANT_COPY.noActiveDraft;
      }

      typeAssistantText(thought, () => {
        void executeAssistantActions(response.actions, {
          showAssistantComposeDraft: (payload) => {
            showAssistantComposeDraft(payload, isDraftRevision);
          },
          showAssistantReplyDraft: (payload) => {
            showAssistantReplyDraft(payload, isDraftRevision);
          },
          applySearchEmails: applySearchEmails,
          openEmail: (payload) => {
            openEmail(payload.threadId);
          },
          sendEmail: () => {
            if (shouldSendDraft) {
              sendCompose();
            }
          },
        }).finally(() => {
          if (!hasDraftAction) {
            setAssistantBusy(false);
          }
        });
      });
    },
    [
      applySearchEmails,
      canSendActiveDraft,
      markActiveDraftSending,
      openEmail,
      sendCompose,
      showAssistantComposeDraft,
      showAssistantReplyDraft,
      typeAssistantText,
    ],
  );

  const getActiveDraftStatus = useCallback(() => {
    const messageId = activeComposeMessageIdRef.current;
    if (!messageId) {
      return null;
    }

    const message = assistantMessagesRef.current.find(
      (entry) => entry.id === messageId,
    );

    return message?.kind === "compose_draft" ? message.status : null;
  }, []);

  const appendAssistantText = useCallback((text: string) => {
    if (!text.trim()) {
      setAssistantBusy(false);
      return;
    }

    setAssistantMessages((current) => [
      ...current,
      createTextMessage("assistant", text),
    ]);
    setAssistantBusy(false);
  }, []);

  const discardActiveDraft = useCallback(() => {
    clearFillAnimation();
    setAssistantMessages((current) => supersedeDraftMessages(current));
    clearActiveComposeMessage();
    updateComposeDraft(emptyComposeDraft);
  }, [clearActiveComposeMessage, clearFillAnimation, updateComposeDraft]);

  const handleLocalIntent = useCallback(
    (intent: LocalIntentResult) => {
      switch (intent.kind) {
        case "send_draft":
          markActiveDraftSending();
          sendCompose();
          setAssistantBusy(false);
          break;
        case "retry_send":
          sendCompose();
          setAssistantBusy(false);
          break;
        case "open_email":
          openEmail(intent.threadId);
          setAssistantBusy(false);
          break;
        case "discard_draft":
          discardActiveDraft();
          appendAssistantText(ASSISTANT_COPY.localIntent.draftDiscarded);
          break;
        case "assistant_response":
          if (intent.response.actions.length > 0) {
            processAssistantResponse(intent.response);
          } else {
            appendAssistantText(intent.response.thought);
          }
          break;
      }
    },
    [
      appendAssistantText,
      discardActiveDraft,
      markActiveDraftSending,
      openEmail,
      processAssistantResponse,
      sendCompose,
    ],
  );

  const runAssistantPrompt = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || assistantLoading || assistantBusy) {
        return;
      }

      setAssistantMessages((current) => [
        ...current,
        createTextMessage("user", trimmed),
      ]);
      clearFillAnimation();
      setTypingAssistantText(null);
      setAssistantBusy(true);

      const { hasActiveDraft, activeDraft } = getActiveDraftContext();
      const searchResults = activeSearchQuery
        ? toSearchResults(searchThreads)
        : null;
      const mail = mailContextRef.current;
      const priorMessages = assistantMessagesRef.current;
      const { canSend } = resolveActiveDraft(
        activeComposeMessageIdRef.current,
        priorMessages,
        composeDraftRef.current,
      );
      const draftStatus = getActiveDraftStatus();
      const context = buildAssistantContext({
        mail,
        hasActiveDraft,
        activeDraft,
        searchResults,
      });

      const localIntent = matchLocalIntent(trimmed, {
        canSend,
        hasActiveDraft,
        draftStatus,
        searchResults,
      });

      if (localIntent) {
        if (process.env.NODE_ENV === "development") {
          console.log("[CommandMail AI]", {
            type: "local_intent",
            intent: localIntent.kind,
          });
        }
        handleLocalIntent(localIntent);
        return;
      }

      const cacheKey = buildAssistantCacheKey(trimmed, context);
      const cachedResponse = getCachedAssistantResponse(cacheKey);

      if (cachedResponse) {
        if (process.env.NODE_ENV === "development") {
          console.log("[CommandMail AI]", {
            type: "cache_hit",
            cacheKey,
          });
        }
        processAssistantResponse(cachedResponse);
        return;
      }

      setAssistantLoading(true);

      try {
        const response = await requestAssistantResponse({
          messages: trimAssistantMessagesForApi([
            ...priorMessages.map((message) => ({
              role: message.role,
              content: toApiMessageContent(message),
            })),
            { role: "user", content: trimmed },
          ]),
          context,
        });

        setAssistantLoading(false);
        setCachedAssistantResponse(cacheKey, response);
        processAssistantResponse(response);
      } catch (error) {
        const message =
          error instanceof AssistantClientError
            ? error.message
            : ASSISTANT_COPY.unavailable;

        setAssistantLoading(false);
        typeAssistantText(message, () => setAssistantBusy(false));
      }
    },
    [
      assistantBusy,
      assistantLoading,
      activeSearchQuery,
      clearFillAnimation,
      getActiveDraftContext,
      getActiveDraftStatus,
      handleLocalIntent,
      processAssistantResponse,
      searchThreads,
      typeAssistantText,
    ],
  );

  const submitAssistantPrompt = useCallback(async () => {
    const trimmed = assistantInput.trim();
    if (!trimmed) {
      return;
    }

    setAssistantInput("");
    await runAssistantPrompt(trimmed);
  }, [assistantInput, runAssistantPrompt]);

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

  const setComposeOpen = useCallback(
    (open: boolean) => {
      setIsComposeOpen(open);

      if (!open) {
        updateComposeDraft(emptyComposeDraft);
      }
    },
    [updateComposeDraft],
  );

  const contextValue: AssistantContextValue = {
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
  };

  return (
    <AssistantContext.Provider value={contextValue}>
      {children}

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
    </AssistantContext.Provider>
  );
}

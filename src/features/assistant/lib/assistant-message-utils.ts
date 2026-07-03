import {
  isComposeTypingStatus,
  isSupersedableDraftStatus,
  type AssistantChatMessage,
  type AssistantComposeDraftMessage,
} from "@/features/assistant/types/assistant-message";
import {
  isComposeDraft,
  isReplyDraft,
  type AssistantDraft,
} from "@/features/mail/types/compose-draft";

export function createTextMessage(
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

function formatDraftSummary(draft: AssistantDraft): string {
  if (isReplyDraft(draft)) {
    return [
      "Active reply draft:",
      `Replying to: ${draft.recipient}`,
      `Subject: ${draft.subject}`,
      `Body: ${draft.body}`,
    ].join("\n");
  }

  return [
    "Active draft email:",
    `To: ${draft.to}`,
    `Subject: ${draft.subject}`,
    `Body: ${draft.body}`,
  ].join("\n");
}

function formatSentDraftSummary(draft: AssistantDraft): string {
  if (isReplyDraft(draft)) {
    return `[Reply already sent to ${draft.recipient}. Subject: ${draft.subject}. There is no active draft.]`;
  }

  return `[Email already sent to ${draft.to}. Subject: ${draft.subject}. There is no active draft.]`;
}

export function toApiMessageContent(message: AssistantChatMessage): string {
  if (message.kind === "text") {
    return message.content;
  }

  if (message.status === "sent") {
    return `${message.content}\n\n${formatSentDraftSummary(message.draft)}`;
  }

  if (message.status === "superseded") {
    return `${message.content}\n\n[Superseded draft — not active.]`;
  }

  if (
    message.status === "preparing" ||
    isComposeTypingStatus(message.status)
  ) {
    return `${message.content}\n\n[Draft is being prepared.]`;
  }

  if (message.status === "sending") {
    return `${message.content}\n\n[Email is currently being sent.]`;
  }

  if (message.status === "failed") {
    return `${message.content}\n\n[Draft send failed — still editable.]`;
  }

  const draftSummary = formatDraftSummary(message.draft);

  const summary = message.content
    ? `${message.content}\n\n${draftSummary}`
    : draftSummary;

  return summary.trim() || "Draft prepared.";
}

export function isActiveDraftMessage(
  message: AssistantChatMessage | undefined,
): message is AssistantComposeDraftMessage {
  return (
    message?.kind === "compose_draft" &&
    (message.status === "draft" || message.status === "failed")
  );
}

export function isContextActiveDraftMessage(
  message: AssistantChatMessage | undefined,
): message is AssistantComposeDraftMessage {
  return (
    message?.kind === "compose_draft" &&
    (message.status === "draft" ||
      message.status === "sending" ||
      message.status === "failed")
  );
}

export function findActiveDraftMessage(
  messageId: string | null,
  messages: AssistantChatMessage[],
): AssistantComposeDraftMessage | undefined {
  if (!messageId) {
    return undefined;
  }

  const message = messages.find((entry) => entry.id === messageId);
  return isActiveDraftMessage(message) ? message : undefined;
}

export function findContextDraftMessage(
  messageId: string | null,
  messages: AssistantChatMessage[],
): AssistantComposeDraftMessage | undefined {
  if (!messageId) {
    return undefined;
  }

  const message = messages.find((entry) => entry.id === messageId);
  return isContextActiveDraftMessage(message) ? message : undefined;
}

export function supersedeDraftMessages(
  messages: AssistantChatMessage[],
): AssistantChatMessage[] {
  return messages.map((message) => {
    if (
      message.kind === "compose_draft" &&
      isSupersedableDraftStatus(message.status)
    ) {
      return { ...message, status: "superseded" as const };
    }

    return message;
  });
}

export function supersedeOtherDraftMessages(
  messages: AssistantChatMessage[],
  activeMessageId: string,
): AssistantChatMessage[] {
  return messages.map((message) => {
    if (
      message.kind === "compose_draft" &&
      message.id !== activeMessageId &&
      isSupersedableDraftStatus(message.status)
    ) {
      return { ...message, status: "superseded" as const };
    }

    return message;
  });
}

export function canSendDraft(draft: AssistantDraft): boolean {
  if (isComposeDraft(draft)) {
    return draft.to.trim().length > 0 && draft.body.trim().length > 0;
  }

  return (
    draft.threadId.trim().length > 0 &&
    draft.recipientEmail.trim().length > 0 &&
    draft.body.trim().length > 0
  );
}

export function toActiveDraftContext(draft: AssistantDraft | null) {
  if (!draft) {
    return null;
  }

  if (isReplyDraft(draft)) {
    return {
      kind: "reply" as const,
      threadId: draft.threadId,
      recipient: draft.recipient,
      subject: draft.subject,
      body: draft.body,
    };
  }

  return {
    kind: "compose" as const,
    to: draft.to,
    subject: draft.subject,
    body: draft.body,
  };
}

export function resolveActiveDraft(
  messageId: string | null,
  messages: AssistantChatMessage[],
  draft: AssistantDraft,
) {
  const message = findContextDraftMessage(messageId, messages);

  if (!message) {
    return {
      hasActiveDraft: false as const,
      activeDraft: null,
      canSend: false,
    };
  }

  const canSend =
    (message.status === "draft" || message.status === "failed") &&
    canSendDraft(draft);

  return {
    hasActiveDraft: true as const,
    activeDraft: draft,
    canSend,
  };
}

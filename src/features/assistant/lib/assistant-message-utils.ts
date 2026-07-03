import {
  isComposeTypingStatus,
  isSupersedableDraftStatus,
  type AssistantChatMessage,
  type AssistantComposeDraftMessage,
} from "@/features/assistant/types/assistant-message";
import type { ComposeDraft } from "@/features/mail/types/compose-draft";

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

export function toApiMessageContent(message: AssistantChatMessage): string {
  if (message.kind === "text") {
    return message.content;
  }

  if (message.status === "sent") {
    return `${message.content}\n\n[Email already sent to ${message.draft.to}. Subject: ${message.draft.subject}. There is no active draft.]`;
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

export function isActiveDraftMessage(
  message: AssistantChatMessage | undefined,
): message is AssistantComposeDraftMessage {
  return message?.kind === "compose_draft" && message.status === "draft";
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

export function resolveActiveDraft(
  messageId: string | null,
  messages: AssistantChatMessage[],
  draft: ComposeDraft,
) {
  const message = findActiveDraftMessage(messageId, messages);

  if (!message) {
    return {
      hasActiveDraft: false as const,
      activeDraft: null,
      canSend: false,
    };
  }

  return {
    hasActiveDraft: true as const,
    activeDraft: draft,
    canSend: draft.to.trim().length > 0,
  };
}

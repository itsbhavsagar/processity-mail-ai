import type { ComposeDraft } from "@/features/mail/types/compose-draft";

export type AssistantComposeDraftStatus =
  | "preparing"
  | "typing_to"
  | "typing_subject"
  | "typing_body"
  | "draft"
  | "sending"
  | "sent"
  | "superseded";

export type AssistantComposeDraftMessage = {
  id: string;
  role: "assistant";
  kind: "compose_draft";
  content: string;
  draft: ComposeDraft;
  status: AssistantComposeDraftStatus;
  variant?: "create" | "revise";
  sentAt?: string;
};

export type AssistantTextMessage = {
  id: string;
  role: "user" | "assistant";
  kind: "text";
  content: string;
};

export type AssistantChatMessage =
  | AssistantTextMessage
  | AssistantComposeDraftMessage;

export const COMPOSE_TYPING_STATUSES: AssistantComposeDraftStatus[] = [
  "typing_to",
  "typing_subject",
  "typing_body",
];

export function isComposeTypingStatus(
  status: AssistantComposeDraftStatus,
): boolean {
  return COMPOSE_TYPING_STATUSES.includes(status);
}

export function isSupersedableDraftStatus(
  status: AssistantComposeDraftStatus,
): boolean {
  return (
    status === "preparing" ||
    isComposeTypingStatus(status) ||
    status === "draft" ||
    status === "sending"
  );
}

export function activeFieldForComposeStatus(
  status: AssistantComposeDraftStatus,
): keyof ComposeDraft | null {
  if (status === "typing_to") {
    return "to";
  }

  if (status === "typing_subject") {
    return "subject";
  }

  if (status === "typing_body") {
    return "body";
  }

  return null;
}

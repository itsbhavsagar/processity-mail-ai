import type { AssistantDraft } from "@/features/mail/types/compose-draft";
import { isComposeDraft } from "@/features/mail/types/compose-draft";

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
  draft: AssistantDraft;
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
  draft?: AssistantDraft,
): "to" | "subject" | "body" | null {
  if (draft && !isComposeDraft(draft)) {
    return status === "typing_body" ? "body" : null;
  }

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

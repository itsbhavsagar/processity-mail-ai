import type { ComposeDraft } from "@/features/mail/types/compose-draft";

export type AssistantComposeDraftStatus =
  | "preparing"
  | "filling"
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
  targetDraft?: ComposeDraft;
  status: AssistantComposeDraftStatus;
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

export type AssistantMessageKind = AssistantChatMessage["kind"];

export const COMPOSE_FILL_PREPARE_MS = 400;
export const COMPOSE_FILL_STAGGER_MS = 150;

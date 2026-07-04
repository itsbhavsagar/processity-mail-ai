import type { MailThread } from "@/features/mail/types/mail-thread";

export interface AssistantEmailCard {
  type: "email";
  thread: MailThread;
}

export interface AssistantEmailListCard {
  type: "email_list";
  title?: string;
  query?: string;
  threads: MailThread[];
}

export interface AssistantFilterCard {
  type: "filter";
  summary: string;
  query?: string;
}

export interface AssistantConfirmationCard {
  type: "confirmation";
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
}

export type AssistantRichContent =
  | AssistantEmailCard
  | AssistantEmailListCard
  | AssistantFilterCard
  | AssistantConfirmationCard;

import type { MailMessage } from "./mail-message";

export interface MailConversation {
  id: string;
  subject: string;
  messages: MailMessage[];
}

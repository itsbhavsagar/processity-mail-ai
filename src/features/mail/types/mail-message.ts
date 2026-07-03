import type { MailAddress } from "./mail-address";

export interface MailMessage {
  id: string;
  sender: MailAddress;
  to: MailAddress[];
  cc: MailAddress[];
  subject: string;

  rfcMessageId?: string;

  references?: string;

  bodyHtml?: string;

  bodyText?: string;
  sentAt: string;
}

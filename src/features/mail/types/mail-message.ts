import type { MailAddress } from "./mail-address";

export interface MailMessage {
  id: string;
  sender: MailAddress;
  to: MailAddress[];
  cc: MailAddress[];
  subject: string;
  /** Sanitized at render time — raw HTML from Gmail when available. */
  bodyHtml?: string;
  /** Plain-text part when Gmail provides one. */
  bodyText?: string;
  sentAt: string;
}

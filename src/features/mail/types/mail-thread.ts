export interface MailThread {
  id: string;
  sender: string;
  senderEmail?: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  isUnread: boolean;
}

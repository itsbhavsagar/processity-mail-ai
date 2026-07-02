export interface MailThread {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  isUnread: boolean;
}

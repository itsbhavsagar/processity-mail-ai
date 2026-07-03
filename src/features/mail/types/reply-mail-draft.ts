export interface ReplyMailDraft {
  threadId: string;
  inReplyTo: string;
  references: string;
  to: string[];
  subject: string;
  body: string;
}

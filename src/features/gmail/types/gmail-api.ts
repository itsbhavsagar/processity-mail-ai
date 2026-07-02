export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessageBody {
  data?: string;
  size?: number;
}

export interface GmailMessagePart {
  mimeType?: string;
  body?: GmailMessageBody;
  parts?: GmailMessagePart[];
}

export interface GmailMessagePayload {
  mimeType?: string;
  headers?: GmailHeader[];
  body?: GmailMessageBody;
  parts?: GmailMessagePart[];
}

export interface GmailMessage {
  id: string;
  snippet?: string;
  labelIds?: string[];
  payload?: GmailMessagePayload;
}

export interface GmailThreadResponse {
  id: string;
  snippet?: string;
  messages?: GmailMessage[];
}

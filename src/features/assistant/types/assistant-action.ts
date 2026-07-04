import { z } from "zod";

import { MAILBOXES } from "@/shared/constants";

const mailboxIds = MAILBOXES.map((mailbox) => mailbox.id) as [
  (typeof MAILBOXES)[number]["id"],
  ...(typeof MAILBOXES)[number]["id"][],
];

export const mailboxTypeSchema = z.enum(mailboxIds);
export type MailboxType = z.infer<typeof mailboxTypeSchema>;

const composeEmailActionSchema = z.object({
  type: z.literal("compose_email"),
  payload: z.object({
    to: z.string().min(1),
    subject: z.string(),
    body: z.string(),
  }),
});

const sendEmailActionSchema = z.object({
  type: z.literal("send_email"),
});

const searchEmailsActionSchema = z.object({
  type: z.literal("search_emails"),
  payload: z.object({
    query: z.string().min(1),
  }),
});

const openEmailActionSchema = z.object({
  type: z.literal("open_email"),
  payload: z.object({
    threadId: z.string().min(1),
  }),
});

const replyEmailActionSchema = z.object({
  type: z.literal("reply_email"),
  payload: z.object({
    threadId: z.string().min(1),
    body: z.string().min(1),
  }),
});

export const assistantActionSchema = z.discriminatedUnion("type", [
  composeEmailActionSchema,
  sendEmailActionSchema,
  searchEmailsActionSchema,
  openEmailActionSchema,
  replyEmailActionSchema,
]);

export type AssistantAction = z.infer<typeof assistantActionSchema>;

export const assistantResponseSchema = z.object({
  thought: z.string(),
  requiresConfirmation: z.boolean(),
  actions: z.array(assistantActionSchema),
});

export type AssistantResponse = z.infer<typeof assistantResponseSchema>;

export type ComposeEmailPayload = Extract<
  AssistantAction,
  { type: "compose_email" }
>["payload"];

export type SearchEmailsPayload = Extract<
  AssistantAction,
  { type: "search_emails" }
>["payload"];

export type OpenEmailPayload = Extract<
  AssistantAction,
  { type: "open_email" }
>["payload"];

export type ReplyEmailPayload = Extract<
  AssistantAction,
  { type: "reply_email" }
>["payload"];

export const assistantSearchResultSchema = z.object({
  threadId: z.string(),
  from: z.string(),
  subject: z.string(),
});

export type AssistantSearchResult = z.infer<typeof assistantSearchResultSchema>;

export const assistantChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const assistantConversationContextSchema = z.object({
  threadId: z.string(),
  subject: z.string(),
  sender: z.string(),
  to: z.string(),
  cc: z.string(),
  sentAt: z.string(),
  body: z.string(),
});

const composeDraftContextSchema = z.object({
  kind: z.literal("compose"),
  to: z.string(),
  subject: z.string(),
  body: z.string(),
});

const replyDraftContextSchema = z.object({
  kind: z.literal("reply"),
  threadId: z.string(),
  recipient: z.string(),
  subject: z.string(),
  body: z.string(),
});

const activeDraftContextSchema = z.discriminatedUnion("kind", [
  composeDraftContextSchema,
  replyDraftContextSchema,
]);

export const assistantContextSchema = z.object({
  currentMailbox: mailboxTypeSchema.default("inbox"),
  currentConversation: assistantConversationContextSchema.optional(),
  hasActiveDraft: z.boolean(),
  activeDraft: activeDraftContextSchema.optional(),
  searchResults: z.array(assistantSearchResultSchema).optional(),
  todayEpochSeconds: z.number(),
});

export type AssistantContext = z.infer<typeof assistantContextSchema>;

export const assistantRequestSchema = z.object({
  messages: z.array(assistantChatMessageSchema).min(1),
  context: assistantContextSchema,
});

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

export type AssistantApiErrorCode =
  | "unauthorized"
  | "configuration"
  | "invalid_request"
  | "model_error"
  | "validation_error"
  | "rate_limit";

export interface AssistantApiErrorBody {
  error: AssistantApiErrorCode;
  message: string;
  providerDetail?: string;
}

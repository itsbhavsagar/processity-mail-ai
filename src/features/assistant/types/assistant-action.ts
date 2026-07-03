import { z } from "zod";

export const mailboxTypeSchema = z.enum(["inbox", "sent"]);
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

export const assistantActionSchema = z.discriminatedUnion("type", [
  composeEmailActionSchema,
  sendEmailActionSchema,
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

export const assistantChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const assistantConversationContextSchema = z
  .object({
    subject: z.string(),
    sender: z.string(),
  })
  .nullable();

const composeDraftContextSchema = z
  .object({
    to: z.string(),
    subject: z.string(),
    body: z.string(),
  })
  .nullable();

export const assistantContextSchema = z.object({
  currentMailbox: mailboxTypeSchema.default("inbox"),
  currentThreadId: z.string().optional(),
  currentConversation: assistantConversationContextSchema,
  hasActiveDraft: z.boolean(),
  activeDraft: composeDraftContextSchema,
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
  | "validation_error";

export interface AssistantApiErrorBody {
  error: AssistantApiErrorCode;
  message: string;
}

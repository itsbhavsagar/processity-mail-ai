import { z } from "zod";

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

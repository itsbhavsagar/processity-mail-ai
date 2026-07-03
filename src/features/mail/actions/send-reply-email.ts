"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authConfig } from "@/features/auth/server/auth-config";
import {
  GmailApiError,
  getConversation,
  sendReplyMail,
} from "@/features/gmail/services/gmail-service";
import { buildReplyHeadersFromConversation } from "@/features/mail/lib/build-reply-headers";
import type { ReplyMailDraft } from "@/features/mail/types/reply-mail-draft";

const replySchema = z.object({
  threadId: z.string().min(1, "Thread is required"),
  to: z.email("Enter a valid email address"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message is required"),
});

export type SendReplyEmailResult =
  | { success: true }
  | {
      success: false;
      error: "validation" | "auth" | "send_failed";
      message?: string;
    };

export async function sendReplyEmail(
  formData: FormData,
): Promise<SendReplyEmailResult> {
  const parsed = replySchema.safeParse({
    threadId: formData.get("threadId"),
    to: formData.get("to"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "validation",
      message: parsed.error.issues[0]?.message ?? "Invalid form input",
    };
  }

  const session = await getServerSession(authConfig);

  if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
    return {
      success: false,
      error: "auth",
      message: "Your Gmail connection expired. Sign in again to send email.",
    };
  }

  const senderEmail = session.user?.email;

  if (!senderEmail) {
    return {
      success: false,
      error: "auth",
      message: "We couldn't determine your sender address. Sign in again.",
    };
  }

  let conversation;

  try {
    conversation = await getConversation(
      session.accessToken,
      parsed.data.threadId,
    );
  } catch (error) {
    if (error instanceof GmailApiError && error.status === 401) {
      return {
        success: false,
        error: "auth",
        message: "Your Gmail connection expired. Sign in again to send email.",
      };
    }

    return {
      success: false,
      error: "send_failed",
      message: "We couldn't load the conversation to send your reply.",
    };
  }

  const headers = buildReplyHeadersFromConversation(conversation);

  if (!headers) {
    return {
      success: false,
      error: "send_failed",
      message: "We couldn't determine the reply target for this thread.",
    };
  }

  const draft: ReplyMailDraft = {
    threadId: parsed.data.threadId,
    inReplyTo: headers.inReplyTo,
    references: headers.references,
    to: [parsed.data.to],
    subject: parsed.data.subject,
    body: parsed.data.body,
  };

  try {
    await sendReplyMail(session.accessToken, draft, senderEmail);
  } catch (error) {
    if (error instanceof GmailApiError && error.status === 401) {
      return {
        success: false,
        error: "auth",
        message: "Your Gmail connection expired. Sign in again to send email.",
      };
    }

    return {
      success: false,
      error: "send_failed",
      message: "We couldn't send your reply. Try again in a moment.",
    };
  }

  revalidatePath("/app");

  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authConfig } from "@/features/auth/server/auth-config";
import {
  GmailApiError,
  sendMail,
} from "@/features/gmail/services/gmail-service";
import type { MailDraft } from "@/features/mail/types/mail-draft";

const composeSchema = z.object({
  to: z
    .string()
    .min(1, "Recipient is required")
    .transform((value) =>
      value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(z.email("Enter a valid email address"))
        .min(1, "Recipient is required"),
    ),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message is required"),
});

export type SendEmailResult =
  | { success: true }
  | {
      success: false;
      error: "validation" | "auth" | "send_failed";
      message?: string;
    };

export async function sendEmail(formData: FormData): Promise<SendEmailResult> {
  const parsed = composeSchema.safeParse({
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

  const draft: MailDraft = {
    to: parsed.data.to,
    subject: parsed.data.subject,
    body: parsed.data.body,
  };

  try {
    await sendMail(session.accessToken, draft, senderEmail);
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
      message: "We couldn't send your email. Try again in a moment.",
    };
  }

  revalidatePath("/app");

  return { success: true };
}

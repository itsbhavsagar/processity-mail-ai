"use server";

import { getServerSession } from "next-auth";

import { authConfig } from "@/features/auth/server/auth-config";
import {
  GmailApiError,
  markThreadAsRead,
} from "@/features/gmail/services/gmail-service";

export type MarkThreadReadResult =
  | { success: true }
  | { success: false; error: "auth" | "modify_failed" };

export async function markThreadRead(
  threadId: string,
): Promise<MarkThreadReadResult> {
  const session = await getServerSession(authConfig);

  if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
    return { success: false, error: "auth" };
  }

  try {
    await markThreadAsRead(session.accessToken, threadId);
  } catch (error) {
    if (error instanceof GmailApiError && error.status === 401) {
      return { success: false, error: "auth" };
    }

    return { success: false, error: "modify_failed" };
  }

  return { success: true };
}

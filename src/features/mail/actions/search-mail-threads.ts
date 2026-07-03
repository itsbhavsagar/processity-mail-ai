"use server";

import { getServerSession } from "next-auth";

import { authConfig } from "@/features/auth/server/auth-config";
import {
  GmailApiError,
  searchThreads,
} from "@/features/gmail/services/gmail-service";
import type { MailThread } from "@/features/mail/types/mail-thread";

export type SearchMailThreadsResult =
  | { success: true; threads: MailThread[] }
  | {
      success: false;
      error: "auth" | "search_failed";
      message?: string;
    };

export async function searchMailThreads(
  query: string,
): Promise<SearchMailThreadsResult> {
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      success: false,
      error: "search_failed",
      message: "Search query is required.",
    };
  }

  const session = await getServerSession(authConfig);

  if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
    return {
      success: false,
      error: "auth",
      message: "Your Gmail connection expired. Sign in again to search.",
    };
  }

  try {
    const threads = await searchThreads(session.accessToken, trimmed);
    return { success: true, threads };
  } catch (error) {
    if (error instanceof GmailApiError && error.status === 401) {
      return {
        success: false,
        error: "auth",
        message: "Your Gmail connection expired. Sign in again to search.",
      };
    }

    return {
      success: false,
      error: "search_failed",
      message: "We couldn't search your mailbox. Try again in a moment.",
    };
  }
}

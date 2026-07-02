import { normalizeConversation } from "@/features/gmail/mappers/normalize-conversation";
import { normalizeThread } from "@/features/gmail/mappers/normalize-thread";
import type { GmailThreadResponse } from "@/features/gmail/types/gmail-api";
import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailThread } from "@/features/mail/types/mail-thread";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const INBOX_THREAD_LIMIT = 20;

interface GmailThreadListResponse {
  threads?: Array<{ id: string }>;
}

export class GmailApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Gmail API request failed (${status})`);
    this.name = "GmailApiError";
    this.status = status;
  }
}

async function gmailFetch<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${GMAIL_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new GmailApiError(response.status);
  }

  return response.json() as Promise<T>;
}

export async function listInbox(accessToken: string): Promise<MailThread[]> {
  const list = await gmailFetch<GmailThreadListResponse>(
    `/threads?labelIds=INBOX&maxResults=${INBOX_THREAD_LIMIT}`,
    accessToken,
  );

  if (!list.threads?.length) {
    return [];
  }

  const threadResponses = await Promise.allSettled(
    list.threads.map((thread) =>
      gmailFetch<GmailThreadResponse>(
        `/threads/${thread.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        accessToken,
      ),
    ),
  );

  const fulfilledThreads = threadResponses
    .filter(
      (result): result is PromiseFulfilledResult<GmailThreadResponse> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);

  if (fulfilledThreads.length === 0) {
    const firstRejection = threadResponses.find(
      (result) => result.status === "rejected",
    );

    if (firstRejection?.status === "rejected") {
      throw firstRejection.reason;
    }
  }

  return fulfilledThreads.map(normalizeThread);
}

export async function getConversation(
  accessToken: string,
  conversationId: string,
): Promise<MailConversation> {
  const thread = await gmailFetch<GmailThreadResponse>(
    `/threads/${conversationId}?format=full`,
    accessToken,
  );

  return normalizeConversation(thread);
}

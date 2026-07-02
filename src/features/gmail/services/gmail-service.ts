import {
  normalizeThread,
  type GmailThreadResponse,
} from "@/features/gmail/mappers/normalize-thread";
import type { MailThread } from "@/features/gmail/types/mail-thread";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const INBOX_THREAD_LIMIT = 20;

interface GmailThreadListResponse {
  threads?: Array<{ id: string }>;
}

async function gmailFetch<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${GMAIL_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Gmail API request failed (${response.status})`);
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

  const threadResponses = await Promise.all(
    list.threads.map((thread) =>
      gmailFetch<GmailThreadResponse>(
        `/threads/${thread.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        accessToken,
      ),
    ),
  );

  return threadResponses.map(normalizeThread);
}

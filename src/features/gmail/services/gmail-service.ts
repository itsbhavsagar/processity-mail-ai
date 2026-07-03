import { buildMimeMessage } from "@/features/gmail/mappers/build-mime-message";
import { normalizeConversation } from "@/features/gmail/mappers/normalize-conversation";
import { normalizeThread } from "@/features/gmail/mappers/normalize-thread";
import type { GmailThreadResponse } from "@/features/gmail/types/gmail-api";
import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailDraft } from "@/features/mail/types/mail-draft";
import type { MailThread } from "@/features/mail/types/mail-thread";
import {
  getMailboxById,
  type MailboxId,
} from "@/shared/constants";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const THREAD_LIST_LIMIT = 50;

export type FetchThreadsOptions =
  | { mailbox: MailboxId }
  | { query: string };

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

function buildThreadListPath(options: FetchThreadsOptions): string {
  const params = new URLSearchParams({
    maxResults: String(THREAD_LIST_LIMIT),
  });

  if ("query" in options) {
    params.set("q", options.query);
  } else {
    const mailbox = getMailboxById(options.mailbox);

    if ("gmailLabel" in mailbox && mailbox.gmailLabel) {
      params.set("labelIds", mailbox.gmailLabel);
    }

    if ("gmailQuery" in mailbox && mailbox.gmailQuery) {
      params.set("q", mailbox.gmailQuery);
    }
  }

  return `/threads?${params.toString()}`;
}

const THREAD_METADATA_PATH_SUFFIX =
  "?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date";

async function fetchThreadIds(
  accessToken: string,
  options: FetchThreadsOptions,
): Promise<string[]> {
  const list = await gmailFetch<GmailThreadListResponse>(
    buildThreadListPath(options),
    accessToken,
  );

  return list.threads?.map((thread) => thread.id) ?? [];
}

async function fetchThreadMetadata(
  accessToken: string,
  ids: string[],
): Promise<GmailThreadResponse[]> {
  const threadResponses = await Promise.allSettled(
    ids.map((id) =>
      gmailFetch<GmailThreadResponse>(
        `/threads/${id}${THREAD_METADATA_PATH_SUFFIX}`,
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

  return fulfilledThreads;
}

function normalizeThreads(threads: GmailThreadResponse[]): MailThread[] {
  return threads.map(normalizeThread);
}

async function fetchThreads(
  accessToken: string,
  options: FetchThreadsOptions,
): Promise<MailThread[]> {
  const ids = await fetchThreadIds(accessToken, options);

  if (!ids.length) {
    return [];
  }

  const metadata = await fetchThreadMetadata(accessToken, ids);
  return normalizeThreads(metadata);
}

export async function listThreads(
  accessToken: string,
  mailboxId: MailboxId,
): Promise<MailThread[]> {
  return fetchThreads(accessToken, { mailbox: mailboxId });
}

export async function searchThreads(
  accessToken: string,
  query: string,
): Promise<MailThread[]> {
  return fetchThreads(accessToken, { query });
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

export async function markThreadAsRead(
  accessToken: string,
  threadId: string,
): Promise<void> {
  const response = await fetch(
    `${GMAIL_API_BASE}/threads/${threadId}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new GmailApiError(response.status);
  }
}

interface GmailSendMessageResponse {
  id: string;
}

export async function sendMail(
  accessToken: string,
  draft: MailDraft,
  senderEmail: string,
): Promise<{ messageId: string }> {
  const raw = buildMimeMessage(draft, senderEmail);

  const response = await fetch(`${GMAIL_API_BASE}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new GmailApiError(response.status);
  }

  const data = (await response.json()) as GmailSendMessageResponse;

  return { messageId: data.id };
}

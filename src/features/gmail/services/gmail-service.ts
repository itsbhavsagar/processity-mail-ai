import { buildMimeMessage, buildReplyMimeMessage } from "@/features/gmail/mappers/build-mime-message";
import { normalizeConversation } from "@/features/gmail/mappers/normalize-conversation";
import { normalizeThread } from "@/features/gmail/mappers/normalize-thread";
import {
  getMailboxDisplayName,
  parseMailboxList,
} from "@/features/mail/lib/parse-mailbox";
import type { GmailThreadResponse } from "@/features/gmail/types/gmail-api";
import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailDraft } from "@/features/mail/types/mail-draft";
import type { ReplyMailDraft } from "@/features/mail/types/reply-mail-draft";
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

async function gmailFetch<T>(
  path: string,
  accessToken: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const response = await fetch(`${GMAIL_API_BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new GmailApiError(response.status);
  }

  if (response.status === 204) {
    return undefined as T;
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

interface GmailProfileResponse {
  emailAddress: string;
  historyId: string;
}

export async function getProfile(
  accessToken: string,
): Promise<{ emailAddress: string; historyId: string }> {
  const data = await gmailFetch<GmailProfileResponse>("/profile", accessToken);
  return { emailAddress: data.emailAddress, historyId: data.historyId };
}

interface GmailWatchResponse {
  historyId: string;
  expiration: string;
}

export async function watchMailbox(
  accessToken: string,
  topicName: string,
  labelIds: string[] = ["INBOX"],
): Promise<{ historyId: string; expiration: Date }> {
  const data = await gmailFetch<GmailWatchResponse>("/watch", accessToken, {
    method: "POST",
    body: { topicName, labelIds },
  });

  return {
    historyId: data.historyId,
    expiration: new Date(Number(data.expiration)),
  };
}

export async function stopWatch(accessToken: string): Promise<void> {
  await gmailFetch<void>("/stop", accessToken, { method: "POST" });
}

interface GmailHistoryResponse {
  history?: Array<{
    messagesAdded?: Array<{
      message: { id: string; threadId: string; labelIds?: string[] };
    }>;
  }>;
  historyId: string;
}

export interface GmailHistoryResult {
  historyId: string;
  addedMessages: Array<{ id: string; threadId: string }>;
}

export async function listHistory(
  accessToken: string,
  startHistoryId: string,
): Promise<GmailHistoryResult> {
  const params = new URLSearchParams({
    startHistoryId,
    historyTypes: "messageAdded",
    labelId: "INBOX",
  });

  const data = await gmailFetch<GmailHistoryResponse>(
    `/history?${params.toString()}`,
    accessToken,
  );

  const addedMessages = (data.history ?? [])
    .flatMap((item) => item.messagesAdded ?? [])
    .map((entry) => ({
      id: entry.message.id,
      threadId: entry.message.threadId,
    }));

  return { historyId: data.historyId, addedMessages };
}

interface GmailMessageMetadataResponse {
  threadId: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
}

export interface GmailMessageMetadata {
  threadId: string;
  sender: string;
  subject: string;
}

export async function getMessageMetadata(
  accessToken: string,
  messageId: string,
): Promise<GmailMessageMetadata> {
  const data = await gmailFetch<GmailMessageMetadataResponse>(
    `/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
    accessToken,
  );

  const headers = data.payload?.headers ?? [];
  const getHeader = (name: string) =>
    headers.find((header) => header.name.toLowerCase() === name.toLowerCase())
      ?.value ?? "";

  const senderAddress = parseMailboxList(getHeader("From"))[0];

  return {
    threadId: data.threadId,
    sender: senderAddress ? getMailboxDisplayName(senderAddress) : "Unknown",
    subject: getHeader("Subject") || "(No subject)",
  };
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

export async function sendReplyMail(
  accessToken: string,
  draft: ReplyMailDraft,
  senderEmail: string,
): Promise<{ messageId: string }> {
  const raw = buildReplyMimeMessage(draft, senderEmail);

  const response = await fetch(`${GMAIL_API_BASE}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw,
      threadId: draft.threadId,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new GmailApiError(response.status);
  }

  const data = (await response.json()) as GmailSendMessageResponse;

  return { messageId: data.id };
}

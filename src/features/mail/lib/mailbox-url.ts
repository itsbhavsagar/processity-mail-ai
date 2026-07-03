import type { MailboxId } from "@/shared/constants";

export function buildMailboxUrl(mailbox: MailboxId, threadId?: string): string {
  const params = new URLSearchParams();

  if (mailbox !== "inbox") {
    params.set("mailbox", mailbox);
  }

  if (threadId) {
    params.set("thread", threadId);
  }

  const query = params.toString();

  return query ? `/app?${query}` : "/app";
}

import { formatMailbox } from "@/features/mail/lib/parse-mailbox";
import type { AssistantMailContext } from "@/features/assistant/lib/build-assistant-context";
import type { ComposeDraft } from "@/features/mail/types/compose-draft";
import type { MailMessage } from "@/features/mail/types/mail-message";

function formatForwardSubject(subject: string): string {
  const normalized = subject.trim();

  if (/^fwd:/i.test(normalized)) {
    return normalized;
  }

  return `Fwd: ${normalized}`;
}

function formatForwardedDate(sentAt: string): string {
  const date = new Date(sentAt);

  if (!sentAt || Number.isNaN(date.getTime())) {
    return sentAt;
  }

  return date.toLocaleString();
}

function buildForwardedBody(message: MailMessage): string {
  const headerLines = [
    "---------- Forwarded message ----------",
    `From: ${formatMailbox(message.sender)}`,
    `Date: ${formatForwardedDate(message.sentAt)}`,
    `Subject: ${message.subject}`,
    `To: ${message.to.map(formatMailbox).join(", ")}`,
  ];

  const originalBody = message.bodyText?.trim() ?? "";

  return `\n\n${headerLines.join("\n")}\n\n${originalBody}`;
}

export function buildForwardDraftFromMailContext(
  mail: AssistantMailContext,
  threadId: string,
  to: string,
): ComposeDraft | null {
  if (!mail.conversation || mail.conversationId !== threadId) {
    return null;
  }

  const latestMessage = mail.conversation.messages.at(-1);

  if (!latestMessage) {
    return null;
  }

  return {
    kind: "compose",
    to,
    subject: formatForwardSubject(mail.conversation.subject),
    body: buildForwardedBody(latestMessage),
  };
}

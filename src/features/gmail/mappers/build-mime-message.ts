import type { MailDraft } from "@/features/mail/types/mail-draft";
import type { ReplyMailDraft } from "@/features/mail/types/reply-mail-draft";

function encodeSubject(subject: string): string {
  if (/^[\x00-\x7F]*$/.test(subject)) {
    return subject;
  }

  return `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
}

function toBase64Url(mime: string): string {
  return Buffer.from(mime, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function buildMimeMessage(draft: MailDraft, senderEmail: string): string {
  const mime = [
    `From: ${senderEmail}`,
    `To: ${draft.to.join(", ")}`,
    `Subject: ${encodeSubject(draft.subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    draft.body,
  ].join("\r\n");

  return toBase64Url(mime);
}

export function buildReplyMimeMessage(
  draft: ReplyMailDraft,
  senderEmail: string,
): string {
  const mime = [
    `From: ${senderEmail}`,
    `To: ${draft.to.join(", ")}`,
    `Subject: ${encodeSubject(draft.subject)}`,
    `In-Reply-To: ${draft.inReplyTo}`,
    `References: ${draft.references}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    draft.body,
  ].join("\r\n");

  return toBase64Url(mime);
}

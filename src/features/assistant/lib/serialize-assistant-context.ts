import type { AssistantContext } from "@/features/assistant/types/assistant-action";

function q(value: string): string {
  return JSON.stringify(value);
}

function packFields(fields: string[]): string {
  return fields.map(q).join("|");
}

function packLabeled(fields: [string, string][]): string {
  return fields.map(([key, value]) => `${key}=${q(value)}`).join(" ");
}

export function serializeAssistantContextForPrompt(
  context: AssistantContext,
): string {
  const lines: string[] = [`mailbox=${q(context.currentMailbox)}`];

  lines.push(`hasActiveDraft=${context.hasActiveDraft ? 1 : 0}`);

  if (context.currentConversation) {
    const { threadId, sender, subject, to, cc, sentAt, body } =
      context.currentConversation;
    lines.push(
      `conversation=${packLabeled([
        ["threadId", threadId],
        ["sender", sender],
        ["subject", subject],
        ["to", to],
        ["cc", cc],
        ["sentAt", sentAt],
        ["body", body],
      ])}`,
    );
  }

  if (context.activeDraft) {
    const draft = context.activeDraft;
    if (draft.kind === "compose") {
      lines.push(
        `activeDraft=compose|${packFields([draft.to, draft.subject, draft.body])}`,
      );
    } else {
      lines.push(
        `activeDraft=reply|${packFields([
          draft.threadId,
          draft.recipient,
          draft.subject,
          draft.body,
        ])}`,
      );
    }
  }

  if (context.searchResults?.length) {
    const packed = context.searchResults
      .map((result) => packFields([result.threadId, result.from, result.subject]))
      .join(";");
    lines.push(`searchResults=${packed}`);
  }

  return lines.join("\n");
}

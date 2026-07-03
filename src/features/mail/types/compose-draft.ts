export type ComposeDraft = {
  kind: "compose";
  to: string;
  subject: string;
  body: string;
};

export type ReplyDraft = {
  kind: "reply";
  threadId: string;
  recipient: string;
  recipientEmail: string;
  subject: string;
  body: string;
};

export type AssistantDraft = ComposeDraft | ReplyDraft;

export const emptyComposeDraft: ComposeDraft = {
  kind: "compose",
  to: "",
  subject: "",
  body: "",
};

export const emptyReplyDraft: ReplyDraft = {
  kind: "reply",
  threadId: "",
  recipient: "",
  recipientEmail: "",
  subject: "",
  body: "",
};

export function isComposeDraft(draft: AssistantDraft): draft is ComposeDraft {
  return draft.kind === "compose";
}

export function isReplyDraft(draft: AssistantDraft): draft is ReplyDraft {
  return draft.kind === "reply";
}

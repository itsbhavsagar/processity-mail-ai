import type {
  AssistantDraft,
  ComposeDraft,
  ReplyDraft,
} from "@/features/mail/types/compose-draft";

export function composeDraftToFormData(draft: ComposeDraft): FormData {
  const formData = new FormData();
  formData.set("to", draft.to);
  formData.set("subject", draft.subject);
  formData.set("body", draft.body);
  return formData;
}

export function replyDraftToFormData(draft: ReplyDraft): FormData {
  const formData = new FormData();
  formData.set("threadId", draft.threadId);
  formData.set("to", draft.recipientEmail);
  formData.set("subject", draft.subject);
  formData.set("body", draft.body);
  return formData;
}

export function assistantDraftToFormData(draft: AssistantDraft): FormData {
  if (draft.kind === "reply") {
    return replyDraftToFormData(draft);
  }

  return composeDraftToFormData(draft);
}

/** @deprecated Use composeDraftToFormData */
export function draftToFormData(draft: ComposeDraft): FormData {
  return composeDraftToFormData(draft);
}

export function getPrimaryRecipientEmail(to: string): string | undefined {
  return to
    .split(",")
    .map((part) => part.trim())
    .find(Boolean);
}

export function getReplyRecipientEmail(draft: ReplyDraft): string | undefined {
  return draft.recipientEmail.trim() || undefined;
}

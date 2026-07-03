import type { ComposeDraft } from "@/features/mail/types/compose-draft";

export function draftToFormData(draft: ComposeDraft): FormData {
  const formData = new FormData();
  formData.set("to", draft.to);
  formData.set("subject", draft.subject);
  formData.set("body", draft.body);
  return formData;
}

export function getPrimaryRecipientEmail(to: string): string | undefined {
  return to
    .split(",")
    .map((part) => part.trim())
    .find(Boolean);
}

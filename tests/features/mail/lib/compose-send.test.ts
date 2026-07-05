import {
  assistantDraftToFormData,
  composeDraftToFormData,
  getPrimaryRecipientEmail,
  getReplyRecipientEmail,
  replyDraftToFormData,
} from "@/features/mail/lib/compose-send";
import {
  isComposeDraft,
  isReplyDraft,
  type ComposeDraft,
  type ReplyDraft,
} from "@/features/mail/types/compose-draft";

const compose: ComposeDraft = {
  kind: "compose",
  to: "john@example.com",
  subject: "Hi",
  body: "Hello",
};

const reply: ReplyDraft = {
  kind: "reply",
  threadId: "thread-1",
  recipient: "Alice",
  recipientEmail: "alice@acme.com",
  subject: "Re: Hi",
  body: "Thanks",
};

describe("compose/reply draft form-data mapping", () => {
  it("maps a compose draft to to/subject/body", () => {
    const form = composeDraftToFormData(compose);
    expect(form.get("to")).toBe("john@example.com");
    expect(form.get("subject")).toBe("Hi");
    expect(form.get("body")).toBe("Hello");
    expect(form.get("threadId")).toBeNull();
  });

  it("maps a reply draft to threadId + recipient email, and dispatches by kind", () => {
    const form = replyDraftToFormData(reply);
    expect(form.get("threadId")).toBe("thread-1");
    expect(form.get("to")).toBe("alice@acme.com");
    expect(form.get("subject")).toBe("Re: Hi");

    expect(assistantDraftToFormData(reply).get("threadId")).toBe("thread-1");
    expect(assistantDraftToFormData(compose).get("threadId")).toBeNull();
  });
});

describe("recipient helpers and draft type guards", () => {
  it("normalizes primary and reply recipient emails, blank -> undefined", () => {
    expect(getPrimaryRecipientEmail("a@x.com, b@y.com")).toBe("a@x.com");
    expect(getPrimaryRecipientEmail("  ")).toBeUndefined();
    expect(getReplyRecipientEmail(reply)).toBe("alice@acme.com");
    expect(getReplyRecipientEmail({ ...reply, recipientEmail: "   " })).toBeUndefined();
  });

  it("discriminates compose and reply drafts", () => {
    expect(isComposeDraft(compose)).toBe(true);
    expect(isComposeDraft(reply)).toBe(false);
    expect(isReplyDraft(reply)).toBe(true);
  });
});

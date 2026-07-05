import {
  canSendDraft,
  supersedeDraftMessages,
  toActiveDraftContext,
  toApiMessageContent,
} from "@/features/assistant/lib/assistant-message-utils";
import type {
  AssistantChatMessage,
  AssistantComposeDraftMessage,
} from "@/features/assistant/types/assistant-message";
import type {
  ComposeDraft,
  ReplyDraft,
} from "@/features/mail/types/compose-draft";

const composeDraft: ComposeDraft = {
  kind: "compose",
  to: "john@example.com",
  subject: "Hi",
  body: "Hello there",
};

const replyDraft: ReplyDraft = {
  kind: "reply",
  threadId: "thread-1",
  recipient: "Alice",
  recipientEmail: "alice@acme.com",
  subject: "Re: Hi",
  body: "Thanks",
};

function draftMessage(
  overrides: Partial<AssistantComposeDraftMessage> = {},
): AssistantComposeDraftMessage {
  return {
    id: "d1",
    role: "assistant",
    kind: "compose_draft",
    content: "",
    draft: composeDraft,
    status: "draft",
    ...overrides,
  };
}

describe("canSendDraft", () => {
  it("gates compose and reply drafts on their required fields", () => {
    // compose: needs a recipient and a body
    expect(canSendDraft(composeDraft)).toBe(true);
    expect(canSendDraft({ ...composeDraft, to: "  " })).toBe(false);
    expect(canSendDraft({ ...composeDraft, body: "" })).toBe(false);

    // reply: needs threadId, recipientEmail and body
    expect(canSendDraft(replyDraft)).toBe(true);
    expect(canSendDraft({ ...replyDraft, recipientEmail: "" })).toBe(false);
    expect(canSendDraft({ ...replyDraft, threadId: "  " })).toBe(false);
  });
});

describe("toActiveDraftContext", () => {
  it("returns null for no draft and maps compose/reply shapes", () => {
    expect(toActiveDraftContext(null)).toBeNull();

    expect(toActiveDraftContext(composeDraft)).toEqual({
      kind: "compose",
      to: "john@example.com",
      subject: "Hi",
      body: "Hello there",
    });

    // recipientEmail is intentionally dropped from the prompt-facing context.
    expect(toActiveDraftContext(replyDraft)).toEqual({
      kind: "reply",
      threadId: "thread-1",
      recipient: "Alice",
      subject: "Re: Hi",
      body: "Thanks",
    });
  });
});

describe("toApiMessageContent", () => {
  it("serializes text, rich, and draft messages for the model by status", () => {
    const text: AssistantChatMessage = {
      id: "t1",
      role: "user",
      kind: "text",
      content: "show unread",
    };
    const rich: AssistantChatMessage = {
      id: "r1",
      role: "assistant",
      kind: "rich",
      content: { type: "filter", mailbox: "inbox", query: "is:unread", count: 3 },
    };

    expect(toApiMessageContent(text)).toBe("show unread");
    expect(toApiMessageContent(rich)).toBe(
      "[Structured content shown to the user.]",
    );

    // an editable draft is summarized as active...
    expect(toApiMessageContent(draftMessage())).toContain("Active draft email:");
    expect(toApiMessageContent(draftMessage())).toContain("To: john@example.com");

    // ...while a sent one is reported as no longer active
    const sent = toApiMessageContent(
      draftMessage({ status: "sent", content: "Sent it." }),
    );
    expect(sent).toContain("Email already sent to john@example.com");
    expect(sent).toContain("There is no active draft.");
  });
});

describe("supersedeDraftMessages", () => {
  it("supersedes in-progress drafts but leaves sent messages untouched", () => {
    const messages: AssistantChatMessage[] = [
      draftMessage({ id: "a", status: "draft" }),
      draftMessage({ id: "b", status: "sent" }),
      { id: "c", role: "user", kind: "text", content: "hi" },
    ];

    const result = supersedeDraftMessages(messages);

    expect((result[0] as AssistantComposeDraftMessage).status).toBe("superseded");
    expect((result[1] as AssistantComposeDraftMessage).status).toBe("sent");
    expect(result[2].kind).toBe("text");
  });
});

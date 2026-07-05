import { buildReplyDraftFromMailContext } from "@/features/mail/lib/build-reply-draft";
import type { AssistantMailContext } from "@/features/assistant/lib/build-assistant-context";
import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailMessage } from "@/features/mail/types/mail-message";

const me = { name: "Me", email: "me@example.com" };
const alice = { name: "Alice", email: "alice@acme.com" };

function message(overrides: Partial<MailMessage> = {}): MailMessage {
  return {
    id: "m1",
    sender: alice,
    to: [me],
    cc: [],
    subject: "Project sync",
    sentAt: "2026-07-01T10:00:00.000Z",
    bodyText: "Original body",
    ...overrides,
  };
}

function context(
  conversation: MailConversation | null,
  conversationId = conversation?.id,
): AssistantMailContext {
  return {
    mailbox: "inbox",
    conversationId,
    conversation,
    currentUserEmail: me.email,
  };
}

function conversation(messages: MailMessage[], subject = "Project sync") {
  return { id: "thread-1", subject, messages };
}

describe("buildReplyDraftFromMailContext", () => {
  it("replies to the original sender and prefixes the subject with Re:", () => {
    const mail = context(conversation([message()]));

    const draft = buildReplyDraftFromMailContext(
      mail,
      "thread-1",
      "Sounds good",
      me.email,
    );

    expect(draft).toEqual({
      kind: "reply",
      threadId: "thread-1",
      recipient: "Alice",
      recipientEmail: "alice@acme.com",
      subject: "Re: Project sync",
      body: "Sounds good",
    });
  });

  it("does not double-prefix a subject that already starts with Re: (any case)", () => {
    const mail = context(conversation([message()], "re: Project sync"));

    const draft = buildReplyDraftFromMailContext(mail, "thread-1", "ok", me.email);

    expect(draft?.subject).toBe("re: Project sync");
  });

  it("falls back to the first recipient when the current user sent the latest message", () => {
    // Latest message is from me -> reply target should be the person I wrote to.
    const mail = context(conversation([message({ sender: me, to: [alice] })]));

    const draft = buildReplyDraftFromMailContext(mail, "thread-1", "hi", me.email);

    expect(draft?.recipientEmail).toBe("alice@acme.com");
  });

  it("returns null when the thread is not the open conversation or none is open", () => {
    const mail = context(conversation([message()]));

    expect(
      buildReplyDraftFromMailContext(mail, "other-thread", "x", me.email),
    ).toBeNull();
    expect(
      buildReplyDraftFromMailContext(context(null), "thread-1", "x", me.email),
    ).toBeNull();
  });
});

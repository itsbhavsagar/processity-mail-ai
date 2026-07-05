import { buildForwardDraftFromMailContext } from "@/features/mail/lib/build-forward-draft";
import type { AssistantMailContext } from "@/features/assistant/lib/build-assistant-context";
import type { MailMessage } from "@/features/mail/types/mail-message";

const claude = { name: "Claude", email: "claude@anthropic.com" };
const me = { name: "Me", email: "me@example.com" };

function message(overrides: Partial<MailMessage> = {}): MailMessage {
  return {
    id: "m1",
    sender: claude,
    to: [me],
    cc: [],
    subject: "Weekly digest",
    sentAt: "2026-07-02T09:00:00.000Z",
    bodyText: "Latest reply in the thread.",
    ...overrides,
  };
}

function context(messages: MailMessage[], subject = "Weekly digest"): AssistantMailContext {
  return {
    mailbox: "inbox",
    conversationId: "thread-1",
    conversation: { id: "thread-1", subject, messages },
    currentUserEmail: me.email,
  };
}

describe("buildForwardDraftFromMailContext", () => {
  it("produces a compose draft with a Fwd: subject, recipient, and quoted original", () => {
    const draft = buildForwardDraftFromMailContext(
      context([message()]),
      "thread-1",
      "john@example.com",
    );

    expect(draft?.kind).toBe("compose");
    expect(draft?.to).toBe("john@example.com");
    expect(draft?.subject).toBe("Fwd: Weekly digest");
    expect(draft?.body).toContain("---------- Forwarded message ----------");
    expect(draft?.body).toContain("From: Claude <claude@anthropic.com>");
    expect(draft?.body).toContain("Subject: Weekly digest");
    expect(draft?.body).toContain("Latest reply in the thread.");
  });

  it("does not double-prefix an existing Fwd: subject and quotes the latest message", () => {
    const older = message({ id: "m0", bodyText: "older message" });
    const latest = message({ id: "m1", bodyText: "newest message" });

    const draft = buildForwardDraftFromMailContext(
      context([older, latest], "Fwd: Weekly digest"),
      "thread-1",
      "john@example.com",
    );

    expect(draft?.subject).toBe("Fwd: Weekly digest");
    expect(draft?.body).toContain("newest message");
    expect(draft?.body).not.toContain("older message");
  });

  it("returns null when the thread does not match or no conversation is open", () => {
    expect(
      buildForwardDraftFromMailContext(context([message()]), "nope", "j@x.com"),
    ).toBeNull();
    expect(
      buildForwardDraftFromMailContext(
        { mailbox: "inbox", conversation: null },
        "thread-1",
        "j@x.com",
      ),
    ).toBeNull();
  });
});

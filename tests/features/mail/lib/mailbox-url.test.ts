import { buildMailboxUrl } from "@/features/mail/lib/mailbox-url";

describe("buildMailboxUrl", () => {
  it("omits the mailbox param for the default inbox", () => {
    expect(buildMailboxUrl("inbox")).toBe("/app");
    expect(buildMailboxUrl("inbox", "thread-9")).toBe("/app?thread=thread-9");
  });

  it("includes the mailbox param for non-inbox mailboxes", () => {
    expect(buildMailboxUrl("sent")).toBe("/app?mailbox=sent");
    expect(buildMailboxUrl("archive", "t1")).toBe(
      "/app?mailbox=archive&thread=t1",
    );
  });
});

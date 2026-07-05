import { formatRecipientSummary } from "@/features/mail/lib/format-recipients";

const me = { name: "Me", email: "me@example.com" };
const alice = { name: "Alice", email: "alice@acme.com" };
const bob = { name: "Bob", email: "bob@acme.com" };

describe("formatRecipientSummary", () => {
  it("returns an empty string when there are no recipients", () => {
    expect(formatRecipientSummary([], [])).toBe("");
  });

  it("collapses the current user to 'me' and joins To/Cc groups", () => {
    expect(formatRecipientSummary([me, alice], [], me.email)).toBe("To me, Alice");
    expect(formatRecipientSummary([alice], [bob], me.email)).toBe(
      "To Alice · Cc Bob",
    );
    expect(formatRecipientSummary([], [bob])).toBe("Cc Bob");
  });
});

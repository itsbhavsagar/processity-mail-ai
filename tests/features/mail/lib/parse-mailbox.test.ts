import {
  formatMailbox,
  getMailboxDisplayName,
  parseMailboxList,
} from "@/features/mail/lib/parse-mailbox";

describe("parseMailboxList", () => {
  it("returns an empty array for a blank header", () => {
    expect(parseMailboxList("")).toEqual([]);
    expect(parseMailboxList("   ")).toEqual([]);
  });

  it('parses "Name <email>" and a bare email', () => {
    expect(parseMailboxList("John Doe <john@x.com>")).toEqual([
      { name: "John Doe", email: "john@x.com" },
    ]);
    expect(parseMailboxList("jane@y.com")).toEqual([
      { name: "jane", email: "jane@y.com" },
    ]);
  });

  it("does not split on commas inside a quoted display name", () => {
    const result = parseMailboxList('"Doe, John" <john@x.com>, jane@y.com');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "Doe, John", email: "john@x.com" });
    expect(result[1].email).toBe("jane@y.com");
  });
});

describe("mailbox formatting", () => {
  it("formats/labels an address with name, email-only, and empty fallbacks", () => {
    expect(formatMailbox({ name: "Alice", email: "a@x.com" })).toBe(
      "Alice <a@x.com>",
    );
    expect(formatMailbox({ name: "", email: "a@x.com" })).toBe("a@x.com");
    expect(formatMailbox({ name: "", email: "" })).toBe("Unknown");

    expect(getMailboxDisplayName({ name: "Bob", email: "b@x.com" })).toBe("Bob");
    expect(getMailboxDisplayName({ name: "", email: "b@x.com" })).toBe("b@x.com");
    expect(getMailboxDisplayName({ name: "", email: "" })).toBe("Unknown");
  });
});

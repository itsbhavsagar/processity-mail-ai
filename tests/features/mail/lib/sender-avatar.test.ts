import { getSenderInitials } from "@/features/mail/lib/sender-avatar";

describe("getSenderInitials", () => {
  it("uses the first letters of a two-word name", () => {
    expect(getSenderInitials({ name: "Alice Wong" })).toBe("AW");
  });

  it("uses one letter for single/3+ word names, then email local part, then '?'", () => {
    expect(getSenderInitials({ name: "Cher" })).toBe("C");
    expect(getSenderInitials({ name: "Mary Jane Watson" })).toBe("M");
    expect(getSenderInitials({ email: "sarah@example.com" })).toBe("S");
    expect(getSenderInitials({})).toBe("?");
  });
});

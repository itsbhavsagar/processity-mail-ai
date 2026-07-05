import {
  buildGmailQuery,
  countActiveFilters,
  describeMailFilters,
  emptyMailFilters,
  SECONDS_PER_DAY,
  startOfLocalDayEpochSeconds,
  type MailFilters,
} from "@/features/mail/lib/build-gmail-query";

function filters(overrides: Partial<MailFilters> = {}): MailFilters {
  return { ...emptyMailFilters, ...overrides };
}

describe("startOfLocalDayEpochSeconds", () => {
  it("returns local midnight as whole seconds", () => {
    const expected = Math.floor(new Date(2026, 6, 6).getTime() / 1000);
    expect(startOfLocalDayEpochSeconds("2026-07-06")).toBe(expected);
    expect(startOfLocalDayEpochSeconds("2026-07-06") % 1).toBe(0);
  });
});

describe("buildGmailQuery", () => {
  it("returns empty for no input and trims a bare keyword", () => {
    expect(buildGmailQuery("", emptyMailFilters)).toBe("");
    expect(buildGmailQuery("  invoice  ", emptyMailFilters)).toBe("invoice");
  });

  it("maps sender and read status, omitting status for 'all'", () => {
    expect(buildGmailQuery("", filters({ sender: " sarah " }))).toBe("from:sarah");
    expect(buildGmailQuery("", filters({ readStatus: "unread" }))).toBe("is:unread");
    expect(buildGmailQuery("", filters({ readStatus: "read" }))).toBe("is:read");
    expect(buildGmailQuery("", filters({ readStatus: "all" }))).toBe("");
  });

  it("adds after: for dateFrom and an inclusive (end-of-day) before: for dateTo", () => {
    const from = startOfLocalDayEpochSeconds("2026-07-01");
    const to = startOfLocalDayEpochSeconds("2026-07-05");

    expect(buildGmailQuery("", filters({ dateFrom: "2026-07-01" }))).toBe(
      `after:${from}`,
    );
    expect(buildGmailQuery("", filters({ dateTo: "2026-07-05" }))).toBe(
      `before:${to + SECONDS_PER_DAY}`,
    );
  });

  it("combines every part in a stable order", () => {
    const from = startOfLocalDayEpochSeconds("2026-07-01");
    const to = startOfLocalDayEpochSeconds("2026-07-05");

    expect(
      buildGmailQuery(
        "report",
        filters({
          sender: "boss@acme.com",
          readStatus: "unread",
          dateFrom: "2026-07-01",
          dateTo: "2026-07-05",
        }),
      ),
    ).toBe(
      `report from:boss@acme.com is:unread after:${from} before:${to + SECONDS_PER_DAY}`,
    );
  });
});

describe("describeMailFilters / countActiveFilters", () => {
  it("builds a human-readable label and counts active filters", () => {
    expect(describeMailFilters("", emptyMailFilters)).toBe("");
    expect(
      describeMailFilters("budget", filters({ sender: "sarah", readStatus: "unread" })),
    ).toBe('"budget" · from sarah · unread');
    expect(
      describeMailFilters("", filters({ dateFrom: "2026-07-01", dateTo: "2026-07-05" })),
    ).toMatch(/\d{1,2} \w{3} – \d{1,2} \w{3}/);

    expect(countActiveFilters(emptyMailFilters)).toBe(0);
    expect(
      countActiveFilters(
        filters({ sender: "a@b.com", readStatus: "read", dateFrom: "x", dateTo: "y" }),
      ),
    ).toBe(4);
  });
});

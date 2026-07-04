export type MailReadStatus = "all" | "unread" | "read";

export interface MailFilters {
  sender: string;
  readStatus: MailReadStatus;
  dateFrom: string;
  dateTo: string;
}

export const emptyMailFilters: MailFilters = {
  sender: "",
  readStatus: "all",
  dateFrom: "",
  dateTo: "",
};

// Gmail's after:/before: with a YYYY/MM/DD date have undocumented, ambiguous
// timezone behavior (they don't appear to use the browser's or account's local
// time), which can leak an extra day's worth of messages across the boundary.
// Passing Unix epoch seconds instead is unambiguous — Gmail supports this on
// both operators — so we compute the boundary as "start of day" in the
// browser's local timezone and convert to epoch seconds.
function startOfLocalDayEpochSeconds(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Math.floor(new Date(year, month - 1, day).getTime() / 1000);
}

const SECONDS_PER_DAY = 24 * 60 * 60;

export function buildGmailQuery(keyword: string, filters: MailFilters): string {
  const parts: string[] = [];

  if (keyword.trim()) {
    parts.push(keyword.trim());
  }

  if (filters.sender.trim()) {
    parts.push(`from:${filters.sender.trim()}`);
  }

  if (filters.readStatus === "unread") {
    parts.push("is:unread");
  } else if (filters.readStatus === "read") {
    parts.push("is:read");
  }

  if (filters.dateFrom) {
    parts.push(`after:${startOfLocalDayEpochSeconds(filters.dateFrom)}`);
  }

  if (filters.dateTo) {
    // +1 day so the end date itself is included (before: is exclusive).
    parts.push(
      `before:${startOfLocalDayEpochSeconds(filters.dateTo) + SECONDS_PER_DAY}`,
    );
  }

  return parts.join(" ");
}

function formatDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function describeMailFilters(
  keyword: string,
  filters: MailFilters,
): string {
  const parts: string[] = [];

  if (keyword.trim()) {
    parts.push(`"${keyword.trim()}"`);
  }

  if (filters.sender.trim()) {
    parts.push(`from ${filters.sender.trim()}`);
  }

  if (filters.readStatus === "unread") {
    parts.push("unread");
  } else if (filters.readStatus === "read") {
    parts.push("read");
  }

  if (filters.dateFrom && filters.dateTo) {
    parts.push(
      `${formatDateLabel(filters.dateFrom)} – ${formatDateLabel(filters.dateTo)}`,
    );
  } else if (filters.dateFrom) {
    parts.push(`since ${formatDateLabel(filters.dateFrom)}`);
  } else if (filters.dateTo) {
    parts.push(`before ${formatDateLabel(filters.dateTo)}`);
  }

  return parts.join(" · ");
}

export function countActiveFilters(filters: MailFilters): number {
  let count = 0;

  if (filters.sender.trim()) count++;
  if (filters.readStatus !== "all") count++;
  if (filters.dateFrom) count++;
  if (filters.dateTo) count++;

  return count;
}

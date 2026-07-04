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

export function startOfLocalDayEpochSeconds(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Math.floor(new Date(year, month - 1, day).getTime() / 1000);
}

export const SECONDS_PER_DAY = 24 * 60 * 60;

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

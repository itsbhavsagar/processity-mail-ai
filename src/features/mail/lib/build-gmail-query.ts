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

function toGmailDate(isoDate: string): string {
  return isoDate.replaceAll("-", "/");
}

// Gmail's before: is exclusive of the given date, but the "Date to" picker
// should mean "include this day" — so we search before the following day.
function toGmailDateInclusiveEnd(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 1);

  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");

  return `${nextYear}/${nextMonth}/${nextDay}`;
}

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
    parts.push(`after:${toGmailDate(filters.dateFrom)}`);
  }

  if (filters.dateTo) {
    parts.push(`before:${toGmailDateInclusiveEnd(filters.dateTo)}`);
  }

  return parts.join(" ");
}

export function countActiveFilters(filters: MailFilters): number {
  let count = 0;

  if (filters.sender.trim()) count++;
  if (filters.readStatus !== "all") count++;
  if (filters.dateFrom) count++;
  if (filters.dateTo) count++;

  return count;
}

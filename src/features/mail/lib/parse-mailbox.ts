import type { MailAddress } from "@/features/mail/types/mail-address";

function parseMailbox(value: string): MailAddress {
  const trimmed = value.trim();
  const angleMatch = trimmed.match(/^(.+?)\s*<([^>]+)>$/);

  if (angleMatch) {
    return {
      name: angleMatch[1].replace(/^"|"$/g, "").trim(),
      email: angleMatch[2].trim(),
    };
  }

  if (trimmed.includes("@")) {
    const [localPart] = trimmed.split("@");

    return {
      name: localPart,
      email: trimmed,
    };
  }

  return {
    name: trimmed,
    email: "",
  };
}

export function parseMailboxList(headerValue: string): MailAddress[] {
  if (!headerValue.trim()) {
    return [];
  }

  const parts: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of headerValue) {
    if (char === '"') {
      inQuotes = !inQuotes;
    }

    if (char === "," && !inQuotes) {
      if (current.trim()) {
        parts.push(current);
      }

      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current);
  }

  return parts.map(parseMailbox).filter((address) => address.name || address.email);
}

export function formatMailbox(address: MailAddress): string {
  if (address.name && address.email) {
    return `${address.name} <${address.email}>`;
  }

  return address.email || address.name || "Unknown";
}

export function getMailboxDisplayName(address: MailAddress): string {
  return address.name || address.email || "Unknown";
}

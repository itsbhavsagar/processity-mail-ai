import type { MailAddress } from "@/features/mail/types/mail-address";

export function getSenderAvatarUrl(email: string): string | null {
  const domain = email.split("@")[1]?.trim().toLowerCase();

  if (!domain) {
    return null;
  }

  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export function getSenderInitials(address: MailAddress): string {
  const source =
    address.name.trim() ||
    address.email.split("@")[0]?.trim() ||
    "?";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

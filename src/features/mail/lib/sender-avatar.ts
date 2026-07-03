export function getSenderInitials(options: {
  name?: string;
  email?: string;
}): string {
  const source =
    options.name?.trim() ||
    options.email?.split("@")[0]?.trim() ||
    "?";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return (parts[0]?.[0] ?? "?").toUpperCase();
}

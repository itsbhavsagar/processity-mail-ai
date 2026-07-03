import { getMailboxDisplayName } from "@/features/mail/lib/parse-mailbox";
import type { MailAddress } from "@/features/mail/types/mail-address";

function formatRecipientLabel(
  address: MailAddress,
  currentUserEmail?: string,
): string {
  const userEmail = currentUserEmail?.trim().toLowerCase();

  if (userEmail && address.email.trim().toLowerCase() === userEmail) {
    return "me";
  }

  return getMailboxDisplayName(address);
}

export function formatRecipientSummary(
  to: MailAddress[],
  cc: MailAddress[],
  currentUserEmail?: string,
): string {
  const toLabels = to.map((address) =>
    formatRecipientLabel(address, currentUserEmail),
  );
  const ccLabels = cc.map((address) =>
    formatRecipientLabel(address, currentUserEmail),
  );

  if (toLabels.length === 0 && ccLabels.length === 0) {
    return "";
  }

  const toSummary =
    toLabels.length > 0 ? `To ${toLabels.join(", ")}` : "";

  if (ccLabels.length === 0) {
    return toSummary;
  }

  const ccSummary = `Cc ${ccLabels.join(", ")}`;

  return toSummary ? `${toSummary} · ${ccSummary}` : ccSummary;
}

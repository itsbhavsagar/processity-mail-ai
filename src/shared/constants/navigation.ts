import {
  FiArchive,
  FiEdit3,
  FiInbox,
  FiSend,
  FiTrash2,
} from "react-icons/fi";

export const MAILBOXES = [
  {
    id: "inbox",
    label: "Inbox",
    icon: FiInbox,
    gmailLabel: "INBOX",
  },
  {
    id: "sent",
    label: "Sent",
    icon: FiSend,
    gmailLabel: "SENT",
  },
  {
    id: "drafts",
    label: "Drafts",
    icon: FiEdit3,
    gmailLabel: "DRAFT",
  },
  {
    id: "archive",
    label: "Archive",
    icon: FiArchive,
    gmailQuery: "-in:inbox -in:trash -in:spam -in:drafts -in:sent",
  },
  {
    id: "trash",
    label: "Trash",
    icon: FiTrash2,
    gmailLabel: "TRASH",
  },
] as const;

export type MailboxId = (typeof MAILBOXES)[number]["id"];

export type MailboxConfig = (typeof MAILBOXES)[number];

export function parseMailboxId(value?: string | null): MailboxId {
  if (value && MAILBOXES.some((mailbox) => mailbox.id === value)) {
    return value as MailboxId;
  }

  return "inbox";
}

export function getMailboxById(id: MailboxId): MailboxConfig {
  return MAILBOXES.find((mailbox) => mailbox.id === id) ?? MAILBOXES[0];
}

import {
  FiArchive,
  FiEdit3,
  FiInbox,
  FiSend,
  FiTrash2,
} from "react-icons/fi";
import type { IconType } from "react-icons";

export type MailNavigationItem = {
  label: "Inbox" | "Sent" | "Drafts" | "Archive" | "Trash";
  icon: IconType;
};

export const MAIL_NAVIGATION_ITEMS: MailNavigationItem[] = [
  { label: "Inbox", icon: FiInbox },
  { label: "Sent", icon: FiSend },
  { label: "Drafts", icon: FiEdit3 },
  { label: "Archive", icon: FiArchive },
  { label: "Trash", icon: FiTrash2 },
];

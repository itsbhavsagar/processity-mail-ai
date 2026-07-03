"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

import { formatRecipientSummary } from "@/features/mail/lib/format-recipients";
import {
  formatMailbox,
  getMailboxDisplayName,
} from "@/features/mail/lib/parse-mailbox";
import type { MailMessage } from "@/features/mail/types/mail-message";
import { cn } from "@/shared/lib/utils";

import { SenderAvatar } from "./sender-avatar";

const MESSAGE_DATE_LOCALE = "en-GB";

function formatHeaderTimestamp(isoDate: string): string {
  const date = new Date(isoDate);

  return date.toLocaleString(MESSAGE_DATE_LOCALE, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatExpandedTimestamp(isoDate: string): string {
  const date = new Date(isoDate);

  return date.toLocaleString(MESSAGE_DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface MessageHeaderProps {
  message: MailMessage;
  currentUserEmail?: string;
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 wrap-break-word text-foreground ">
        {value}
      </span>
    </div>
  );
}

export function MessageHeader({
  message,
  currentUserEmail,
}: MessageHeaderProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const recipientSummary = formatRecipientSummary(
    message.to,
    message.cc,
    currentUserEmail,
  );
  const senderName = getMailboxDisplayName(message.sender);
  const senderEmail = message.sender.email;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <header className="relative z-10 min-w-0">
      <div className="flex gap-3 sm:gap-4">
        <SenderAvatar
          name={senderName}
          email={senderEmail}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-sm font-semibold text-foreground">
                {senderName}
              </p>
              {senderEmail ? (
                <p className="truncate text-xs text-muted-foreground">
                  {senderEmail}
                </p>
              ) : null}
            </div>

            <time
              dateTime={message.sentAt}
              className="shrink-0 pt-0.5 text-xs whitespace-nowrap text-muted-foreground tabular-nums"
            >
              {formatHeaderTimestamp(message.sentAt)}
            </time>
          </div>

          {recipientSummary ? (
            <div ref={popoverRef} className="relative">
              <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="mt-1.5 flex min-w-0 items-center gap-1 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
                aria-expanded={open}
                aria-haspopup="dialog"
              >
                <span className="min-w-0 truncate">{recipientSummary}</span>
                <FiChevronDown
                  className={cn(
                    "size-3.5 shrink-0 transition-transform",
                    open && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>

              {open ? (
                <div
                  role="dialog"
                  aria-label="Message details"
                  className="absolute top-full left-0 z-50 mt-1.5 w-[min(100%,32rem)] space-y-2 rounded-lg border border-border bg-card px-3 py-3 shadow-lg"
                >
                  <MetadataRow
                    label="From"
                    value={formatMailbox(message.sender)}
                  />
                  {message.to.length > 0 ? (
                    <MetadataRow
                      label="To"
                      value={message.to.map(formatMailbox).join(", ")}
                    />
                  ) : null}
                  {message.cc.length > 0 ? (
                    <MetadataRow
                      label="Cc"
                      value={message.cc.map(formatMailbox).join(", ")}
                    />
                  ) : null}
                  <MetadataRow
                    label="Date"
                    value={formatExpandedTimestamp(message.sentAt)}
                  />
                  <MetadataRow label="Subject" value={message.subject} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

"use client";

import { SenderAvatar } from "@/features/mail/components/sender-avatar";
import type { MailThread } from "@/features/mail/types/mail-thread";
import { cn } from "@/shared/lib/utils";

const DATE_LOCALE = "en-GB";

function formatReceived(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(DATE_LOCALE, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString(DATE_LOCALE, {
    month: "short",
    day: "numeric",
  });
}

interface AssistantEmailRowProps {
  thread: MailThread;
  onOpen?: (threadId: string) => void;
}

/**
 * Shared presentation for a single MailThread, reused by AssistantEmailCard
 * and AssistantEmailList so the row markup lives in one place. When `onOpen`
 * is provided the row becomes a clickable button that opens the thread.
 */
export function AssistantEmailRow({ thread, onOpen }: AssistantEmailRowProps) {
  const body = (
    <div className="flex items-start gap-3">
      <SenderAvatar name={thread.sender} email={thread.senderEmail} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              thread.isUnread ? "font-semibold" : "font-medium text-foreground/90",
            )}
          >
            {thread.sender}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatReceived(thread.receivedAt)}
          </span>
        </div>
        <p
          className={cn(
            "truncate text-sm",
            thread.isUnread ? "text-foreground" : "text-foreground/80",
          )}
        >
          {thread.subject || "(No subject)"}
        </p>
        {thread.snippet ? (
          <p className="truncate text-xs text-muted-foreground">
            {thread.snippet}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (!onOpen) {
    return <div className="px-2 py-2">{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(thread.id)}
      aria-label={`Open email from ${thread.sender}: ${thread.subject || "(No subject)"}`}
      className="block w-full cursor-pointer px-2 py-2 text-left transition-colors hover:bg-muted/50"
    >
      {body}
    </button>
  );
}

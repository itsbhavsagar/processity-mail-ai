"use client";

import type { MailThread } from "@/features/mail/types/mail-thread";
import { cn } from "@/shared/lib/utils";

interface InboxThreadListProps {
  threads: MailThread[];
  activeThreadId?: string;
  onSelectThread?: (threadId: string) => void;
  isPending?: boolean;
}

function formatReceivedDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function InboxThreadList({
  threads,
  activeThreadId,
  onSelectThread,
  isPending = false,
}: InboxThreadListProps) {
  if (threads.length === 0) {
    return (
      <section className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Your inbox is empty.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <header className="border-b border-border px-4 py-3">
        <h1 className="text-sm font-semibold">Inbox</h1>
      </header>

      <ul className="divide-y divide-border">
        {threads.map((thread) => {
          const isActive = thread.id === activeThreadId;

          return (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => onSelectThread?.(thread.id)}
                disabled={isPending}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                  isActive ? "bg-muted" : "hover:bg-muted/50",
                  isPending && "cursor-wait opacity-70",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-2 size-2 shrink-0 rounded-full",
                    thread.isUnread ? "bg-primary" : "bg-transparent",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p
                      className={cn(
                        "truncate text-sm",
                        thread.isUnread && "font-semibold",
                      )}
                    >
                      {thread.sender}
                    </p>
                    <time
                      dateTime={thread.receivedAt}
                      className="shrink-0 text-xs text-muted-foreground"
                    >
                      {formatReceivedDate(thread.receivedAt)}
                    </time>
                  </div>
                  <p
                    className={cn(
                      "truncate text-sm",
                      thread.isUnread ? "font-medium" : "text-foreground",
                    )}
                  >
                    {thread.subject}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {thread.snippet}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

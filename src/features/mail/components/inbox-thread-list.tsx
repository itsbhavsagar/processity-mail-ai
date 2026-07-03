"use client";

import { FiInbox } from "react-icons/fi";

import type { MailThread } from "@/features/mail/types/mail-thread";
import { Card, CardContent, ScrollArea } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

interface InboxThreadListProps {
  threads: MailThread[];
  activeThreadId?: string;
  onSelectThread?: (threadId: string) => void;
  isPending?: boolean;
}

const THREAD_DATE_LOCALE = "en-GB";

function formatReceivedDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString(THREAD_DATE_LOCALE, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString(THREAD_DATE_LOCALE, {
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
      <Card className="flex h-full min-h-0 flex-col items-center justify-center border-border/60 bg-card/80 shadow-sm">
        <CardContent className="px-6 py-12 text-center">
          <span
            aria-hidden
            className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground"
          >
            <FiInbox className="size-5" />
          </span>
          <p className="text-sm font-medium text-foreground">Inbox is empty</p>
          <p className="mt-2 text-sm text-muted-foreground">
            New conversations will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-border/60 bg-card/80 shadow-sm">
      <header className="shrink-0 border-b border-border/60 px-4 py-4">
        <h1 className="text-sm font-semibold tracking-tight">Inbox</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {threads.length} conversations
        </p>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <ul className="divide-y divide-border/50">
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
                    "flex w-full cursor-pointer gap-3 border-l-2 px-4 py-4 text-left transition-colors duration-150",
                    isActive
                      ? "border-l-primary bg-muted/60"
                      : "border-l-transparent hover:bg-muted/40",
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
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p
                        className={cn(
                          "truncate text-sm",
                          thread.isUnread
                            ? "font-semibold text-foreground"
                            : "font-medium text-foreground/90",
                        )}
                      >
                        {thread.sender}
                      </p>
                      <time
                        dateTime={thread.receivedAt}
                        className="shrink-0 text-xs tabular-nums text-muted-foreground"
                      >
                        {formatReceivedDate(thread.receivedAt)}
                      </time>
                    </div>
                    <p
                      className={cn(
                        "truncate text-sm",
                        thread.isUnread
                          ? "font-medium text-foreground"
                          : "text-foreground/80",
                      )}
                    >
                      {thread.subject}
                    </p>
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {thread.snippet}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </section>
  );
}

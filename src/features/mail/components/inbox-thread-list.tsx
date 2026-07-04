"use client";

import { FiInbox, FiSearch, FiX } from "react-icons/fi";

import type { MailThread } from "@/features/mail/types/mail-thread";
import { Button, Card, CardContent, ScrollArea, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

import { SenderAvatar } from "./sender-avatar";

interface InboxThreadListProps {
  mailboxLabel: string;
  threads: MailThread[];
  activeThreadId?: string;
  onSelectThread?: (threadId: string) => void;
  isPending?: boolean;
  searchQuery?: string | null;
  searchDisplayLabel?: string | null;
  isSearchLoading?: boolean;
  onClearSearch?: () => void;
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
  mailboxLabel,
  threads,
  activeThreadId,
  onSelectThread,
  isPending = false,
  searchQuery = null,
  searchDisplayLabel = null,
  isSearchLoading = false,
  onClearSearch,
}: InboxThreadListProps) {
  const isSearchActive = Boolean(searchQuery);
  const listTitle = isSearchActive ? "Search results" : mailboxLabel;
  const searchDisplayText = searchDisplayLabel || searchQuery;

  if (isSearchLoading) {
    return (
      <section className="flex h-full min-h-0 flex-col bg-background">
        <header className="flex h-[72px] shrink-0 flex-col justify-center border-b border-border/60 px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-tight">
                {listTitle}
              </h1>
              {searchDisplayText ? (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {searchDisplayText}
                </p>
              ) : null}
            </div>
            {isSearchActive && onClearSearch ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 gap-1.5 px-2 text-xs"
                onClick={onClearSearch}
              >
                <FiX className="size-3.5" aria-hidden />
                Clear
              </Button>
            ) : null}
          </div>
        </header>
        <div className="space-y-3 px-4 py-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (threads.length === 0) {
    return (
      <Card className="flex h-full min-h-0 flex-col items-center justify-center rounded-none border-0 bg-background shadow-none">
        <CardContent className="px-6 py-12 text-center">
          <span
            aria-hidden
            className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground"
          >
            {isSearchActive ? (
              <FiSearch className="size-5" />
            ) : (
              <FiInbox className="size-5" />
            )}
          </span>
          <p className="text-sm font-medium text-foreground">
            {isSearchActive
              ? "No matching conversations"
              : `${mailboxLabel} is empty`}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSearchActive
              ? `Nothing matched ${searchDisplayText}. Try different keywords or operators.`
              : "New conversations will appear here."}
          </p>
          {isSearchActive && onClearSearch ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onClearSearch}
            >
              Clear search
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex h-[72px] shrink-0 flex-col justify-center border-b border-border/60 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight">{listTitle}</h1>
            {isSearchActive && searchDisplayText ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {searchDisplayText}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                {threads.length} conversations
              </p>
            )}
          </div>
          {isSearchActive && onClearSearch ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 gap-1.5 px-2 text-xs"
              onClick={onClearSearch}
            >
              <FiX className="size-3.5" aria-hidden />
              Clear
            </Button>
          ) : null}
        </div>
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
                    thread.isUnread && !isActive && "bg-muted/30",
                    isPending && "cursor-wait opacity-70",
                  )}
                >
                  <SenderAvatar
                    name={thread.sender}
                    email={thread.senderEmail}
                    size="sm"
                    className={cn(
                      thread.isUnread && "ring-1 ring-primary/25",
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

"use client";

import { FiFilter } from "react-icons/fi";

import { AssistantCard } from "@/features/assistant/components/assistant-card";
import type { AssistantFilterCard as AssistantFilterCardContent } from "@/features/assistant/types/assistant-rich-content";
import { getMailboxById } from "@/shared/constants";
import { Badge } from "@/shared/ui";

// function formatQuery(query: string) {
//   return query;
// }

function formatQuery(query: string) {
  return query
    .replace(/after:\d+/g, "Today")
    .replace(/newer_than:(\d+)d/g, "Last $1 days")
    .replace(/newer_than:1m/g, "Last month")
    .replace(/newer_than:1y/g, "Last year")
    .replace(/older_than:(\d+)d/g, "Older than $1 days")
    .replace(/is:unread/g, "Unread")
    .replace(/is:read/g, "Read")
    .replace(/has:attachment/g, "Attachments")
    .replace(/filename:pdf/g, "PDF")
    .replace(/label:sent/g, "Sent")
    .replace(/label:drafts/g, "Drafts")
    .replace(/label:trash/g, "Trash")
    .replace(/from:(\S+)/g, "From $1")
    .replace(/to:(\S+)/g, "To $1")
    .replace(/cc:(\S+)/g, "CC $1")
    .replace(/subject:(.+)/g, "Subject: $1");
}

export function AssistantFilterCard({
  content,
}: {
  content: AssistantFilterCardContent;
}) {
  const mailboxLabel = getMailboxById(content.mailbox).label;
  // const query = content.query.trim();
  const query = formatQuery(content.query.trim());

  return (
    <AssistantCard
      icon={<FiFilter className="size-4 text-primary" aria-hidden />}
      title="Filters applied"
      badge={
        <Badge variant="secondary" className="font-normal">
          {content.count} {content.count === 1 ? "result" : "results"}
        </Badge>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-normal">
          {mailboxLabel}
        </Badge>
        {query ? (
          <span className="rounded bg-muted px-2 py-1 text-xs text-foreground/80">
            {query}
          </span>
        ) : null}
      </div>
    </AssistantCard>
  );
}

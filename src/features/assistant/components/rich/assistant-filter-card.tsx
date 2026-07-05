"use client";

import { FiFilter } from "react-icons/fi";

import { AssistantCard } from "@/features/assistant/components/assistant-card";
import type { AssistantFilterCard as AssistantFilterCardContent } from "@/features/assistant/types/assistant-rich-content";
import { getMailboxById } from "@/shared/constants";
import { Badge } from "@/shared/ui";

export function AssistantFilterCard({
  content,
}: {
  content: AssistantFilterCardContent;
}) {
  const mailboxLabel = getMailboxById(content.mailbox).label;
  const query = content.query.trim();

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
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground/80">
            {query}
          </code>
        ) : null}
      </div>
    </AssistantCard>
  );
}

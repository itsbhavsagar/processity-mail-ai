"use client";

import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";

import { AssistantCard } from "@/features/assistant/components/assistant-card";
import { AssistantEmailRow } from "@/features/assistant/components/rich/assistant-email-row";
import type { AssistantEmailListCard } from "@/features/assistant/types/assistant-rich-content";
import { buildMailboxUrl } from "@/features/mail/lib/mailbox-url";
import { Badge } from "@/shared/ui";

export function AssistantEmailList({
  content,
}: {
  content: AssistantEmailListCard;
}) {
  const router = useRouter();
  const count = content.threads.length;

  const openThread = (threadId: string) => {
    router.push(buildMailboxUrl(content.mailbox, threadId));
  };

  return (
    <AssistantCard
      icon={<FiSearch className="size-4 text-primary" aria-hidden />}
      title={content.title ?? "Search results"}
      badge={
        <Badge variant="secondary" className="font-normal">
          {count}
        </Badge>
      }
      contentClassName="p-0"
    >
      {count === 0 ? (
        <div className="px-3 py-6 text-center">
          <FiSearch
            className="mx-auto mb-2 size-5 text-muted-foreground"
            aria-hidden
          />
          <p className="text-sm font-medium text-foreground">
            No emails matched your search
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try a different keyword or a broader date range.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/50">
          {content.threads.map((thread) => (
            <li key={thread.id}>
              <AssistantEmailRow thread={thread} onOpen={openThread} />
            </li>
          ))}
        </ul>
      )}
    </AssistantCard>
  );
}

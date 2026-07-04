"use client";

import { useRouter } from "next/navigation";

import { AssistantCard } from "@/features/assistant/components/assistant-card";
import { AssistantEmailRow } from "@/features/assistant/components/rich/assistant-email-row";
import type { AssistantEmailCard as AssistantEmailCardContent } from "@/features/assistant/types/assistant-rich-content";
import { buildMailboxUrl } from "@/features/mail/lib/mailbox-url";

export function AssistantEmailCard({
  content,
}: {
  content: AssistantEmailCardContent;
}) {
  const router = useRouter();

  return (
    <AssistantCard contentClassName="px-1 py-1">
      <AssistantEmailRow
        thread={content.thread}
        onOpen={(threadId) =>
          router.push(buildMailboxUrl(content.mailbox, threadId))
        }
      />
    </AssistantCard>
  );
}

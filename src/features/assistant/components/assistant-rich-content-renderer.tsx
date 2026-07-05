"use client";

import { AssistantEmailCard } from "@/features/assistant/components/rich/assistant-email-card";
import { AssistantEmailList } from "@/features/assistant/components/rich/assistant-email-list";
import { AssistantFilterCard } from "@/features/assistant/components/rich/assistant-filter-card";
import type { AssistantRichContent } from "@/features/assistant/types/assistant-rich-content";

interface AssistantRichContentRendererProps {
  content: AssistantRichContent;
}

/**
 * Single dispatch point for structured assistant content. Each content type
 * gets its own case + card component (filter and confirmation land in later
 * commits, alongside future non-card content such as charts or tables).
 */
export function AssistantRichContentRenderer({
  content,
}: AssistantRichContentRendererProps) {
  switch (content.type) {
    case "email":
      return <AssistantEmailCard content={content} />;
    case "email_list":
      return <AssistantEmailList content={content} />;
    case "filter":
      return <AssistantFilterCard content={content} />;
    default:
      return null;
  }
}

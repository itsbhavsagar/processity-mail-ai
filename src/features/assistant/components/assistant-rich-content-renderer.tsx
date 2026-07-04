"use client";

import type { AssistantRichContent } from "@/features/assistant/types/assistant-rich-content";

interface AssistantRichContentRendererProps {
  content: AssistantRichContent;
}

/**
 * Single dispatch point for structured assistant content. Each content type
 * gets its own case + card component in follow-up commits (email, filter,
 * confirmation, and later non-card content such as charts or tables).
 */
export function AssistantRichContentRenderer({
  content,
}: AssistantRichContentRendererProps) {
  switch (content.type) {
    // case renderers added incrementally in later commits
    default:
      return null;
  }
}

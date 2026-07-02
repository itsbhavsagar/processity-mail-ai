"use client";

import { FiArrowRight } from "react-icons/fi";

import { ScrollArea } from "@/shared/ui";

const capabilities = [
  "Summarize emails",
  "Draft replies",
  "Search conversations",
  "Compose emails",
];

export function AssistantPanel() {
  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-border/60 bg-card/50 px-4 py-6">
      <div className="shrink-0 pb-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          AI Assistant
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your assistant will appear here once enabled.
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <ul className="space-y-2 pr-3" aria-label="Assistant capabilities">
          {capabilities.map((capability) => (
            <li
              key={capability}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-3 text-sm text-foreground/90"
            >
              <FiArrowRight
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span>{capability}</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </aside>
  );
}

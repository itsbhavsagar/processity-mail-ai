"use client";

import { FiArrowRight } from "react-icons/fi";

const capabilities = [
  "Summarize emails",
  "Draft replies",
  "Search conversations",
  "Compose emails",
];

export function AssistantPanel() {
  return (
    <aside className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          AI Assistant
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your assistant will appear here once enabled.
        </p>
      </div>

      <ul className="space-y-2" aria-label="Assistant capabilities">
        {capabilities.map((capability) => (
          <li
            key={capability}
            className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground/90"
          >
            <FiArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
            <span>{capability}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

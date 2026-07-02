"use client";

import { Button } from "@/shared/ui";

export function WorkspaceEmptyState() {
  return (
    <section className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
      <h1 className="text-3xl font-semibold tracking-tight">Welcome to CommandMail</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
        Connect your Gmail account in the next step to load your inbox and begin
        managing your workspace.
      </p>
      <Button className="mt-8" size="lg">
        Connect Gmail
      </Button>
    </section>
  );
}

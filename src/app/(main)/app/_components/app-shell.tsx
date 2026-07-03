"use client";

import { AppSidebar } from "./app-sidebar";
import type { MailboxId } from "@/shared/constants";
import { cn } from "@/shared/lib/utils";

interface AppShellProps {
  workspace: React.ReactNode;
  sidebarActions?: React.ReactNode;
  header?: React.ReactNode;
  activeMailbox: MailboxId;
  isFocusMode?: boolean;
}

export function AppShell({
  workspace,
  sidebarActions,
  header,
  activeMailbox,
  isFocusMode = false,
}: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {!isFocusMode ? header : null}

      <div
        className={cn(
          "grid min-h-0 flex-1",
          isFocusMode
            ? "grid-cols-1"
            : "grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]",
        )}
      >
        {!isFocusMode ? (
          <div className="hidden min-h-0 md:block">
            <AppSidebar activeMailbox={activeMailbox} actions={sidebarActions} />
          </div>
        ) : null}

        <main
          className={cn(
            "min-h-0 overflow-hidden",
            isFocusMode ? "px-4 py-4 sm:px-8 sm:py-6" : "px-4 py-4 sm:px-6 sm:py-6",
          )}
        >
          {workspace}
        </main>
      </div>
    </div>
  );
}

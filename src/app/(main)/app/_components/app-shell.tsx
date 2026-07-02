"use client";

import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { AssistantPanel } from "./assistant-panel";
import { cn } from "@/shared/lib/utils";

interface AppShellProps {
  workspace: React.ReactNode;
  sidebarActions?: React.ReactNode;
  isFocusMode?: boolean;
}

export function AppShell({
  workspace,
  sidebarActions,
  isFocusMode = false,
}: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {!isFocusMode ? <AppHeader /> : null}

      <div
        className={cn(
          "grid min-h-0 flex-1",
          isFocusMode
            ? "grid-cols-1"
            : "grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_340px]",
        )}
      >
        {!isFocusMode ? (
          <div className="hidden min-h-0 md:block">
            <AppSidebar actions={sidebarActions} />
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

        {!isFocusMode ? (
          <div className="hidden min-h-0 xl:block">
            <AssistantPanel />
          </div>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

import { AppSidebar } from "./app-sidebar";
import { SIDEBAR_COLLAPSED_COOKIE, type MailboxId } from "@/shared/constants";
import { cn } from "@/shared/lib/utils";

interface AppShellProps {
  workspace: React.ReactNode;
  sidebarActions?: (isCollapsed: boolean) => React.ReactNode;
  header?: React.ReactNode;
  activeMailbox: MailboxId;
  isFocusMode?: boolean;
  initialSidebarCollapsed?: boolean;
}

export function AppShell({
  workspace,
  sidebarActions,
  header,
  activeMailbox,
  isFocusMode = false,
  initialSidebarCollapsed = false,
}: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    initialSidebarCollapsed,
  );

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed((current) => {
      const next = !current;
      document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${next}; path=/; max-age=31536000`;
      return next;
    });
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {!isFocusMode ? header : null}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {!isFocusMode ? (
          <div className="hidden min-h-0 md:block">
            <AppSidebar
              activeMailbox={activeMailbox}
              actions={sidebarActions?.(isSidebarCollapsed)}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapsed={toggleSidebarCollapsed}
            />
          </div>
        ) : null}

        <main
          className={cn(
            "min-h-0 min-w-0 flex-1 overflow-hidden",
            isFocusMode ? "px-4 py-4 sm:px-8 sm:py-6" : "px-4 py-4 sm:px-6 sm:py-6",
          )}
        >
          {workspace}
        </main>
      </div>
    </div>
  );
}

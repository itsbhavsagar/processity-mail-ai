"use client";

import { MAIL_NAVIGATION_ITEMS } from "@/shared/constants";
import { Button, ScrollArea } from "@/shared/ui";

const activeItem = "Inbox";

interface AppSidebarProps {
  actions?: React.ReactNode;
}

export function AppSidebar({ actions }: AppSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-border/60 bg-muted/20">
      <div className="shrink-0 space-y-3 px-3 pt-4">
        <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Mailbox
        </p>
        {actions}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav aria-label="Mailbox folders" className="space-y-1 px-3 pb-4 pt-2">
          {MAIL_NAVIGATION_ITEMS.map((item) => (
            <Button
              key={item.label}
              variant={item.label === activeItem ? "secondary" : "ghost"}
              className="h-9 w-full justify-start gap-3"
              aria-current={item.label === activeItem ? "page" : undefined}
            >
              <item.icon className="size-4" aria-hidden />
              <span>{item.label}</span>
            </Button>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}

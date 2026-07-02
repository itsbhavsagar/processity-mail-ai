"use client";

import { MAIL_NAVIGATION_ITEMS } from "@/shared/constants";
import { Button } from "@/shared/ui";

const activeItem = "Inbox";

export function AppSidebar() {
  return (
    <aside className="hidden border-r border-border bg-muted/30 p-3 md:block">
      <nav aria-label="Mailbox folders" className="space-y-1">
        {MAIL_NAVIGATION_ITEMS.map((item) => (
          <Button
            key={item.label}
            variant={item.label === activeItem ? "secondary" : "ghost"}
            className="w-full justify-start gap-3"
            aria-current={item.label === activeItem ? "page" : undefined}
          >
            <item.icon className="size-4" aria-hidden />
            <span>{item.label}</span>
          </Button>
        ))}
      </nav>
    </aside>
  );
}

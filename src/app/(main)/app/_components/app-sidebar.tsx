"use client";

import { useRouter } from "next/navigation";

import { MAILBOXES, type MailboxId } from "@/shared/constants";
import { Button, ScrollArea } from "@/shared/ui";

interface AppSidebarProps {
  activeMailbox: MailboxId;
  actions?: React.ReactNode;
}

export function AppSidebar({ activeMailbox, actions }: AppSidebarProps) {
  const router = useRouter();

  const handleSelectMailbox = (mailboxId: MailboxId) => {
    if (mailboxId === activeMailbox) {
      return;
    }

    router.push(`/app?mailbox=${mailboxId}`);
  };

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
          {MAILBOXES.map((mailbox) => (
            <Button
              key={mailbox.id}
              type="button"
              variant={mailbox.id === activeMailbox ? "secondary" : "ghost"}
              className="h-9 w-full justify-start gap-3"
              aria-current={mailbox.id === activeMailbox ? "page" : undefined}
              onClick={() => handleSelectMailbox(mailbox.id)}
            >
              <mailbox.icon className="size-4" aria-hidden />
              <span>{mailbox.label}</span>
            </Button>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi";

import { MAILBOXES, type MailboxId } from "@/shared/constants";
import {
  Button,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

interface AppSidebarProps {
  activeMailbox: MailboxId;
  actions?: React.ReactNode;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export function AppSidebar({
  activeMailbox,
  actions,
  isCollapsed,
  onToggleCollapsed,
}: AppSidebarProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleSelectMailbox = (mailboxId: MailboxId) => {
    if (mailboxId === activeMailbox) {
      return;
    }

    startTransition(() => {
      router.push(`/app?mailbox=${mailboxId}`);
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "flex h-full min-h-0 shrink-0 flex-col border-r border-border/60 bg-muted/20 transition-[width] duration-200 ease-out",
          isCollapsed ? "w-16" : "w-[220px]",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-4">
          {!isCollapsed ? (
            <p className="truncate px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Mailbox
            </p>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground"
            onClick={onToggleCollapsed}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.span
              key={isCollapsed ? "expand" : "collapse"}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex"
            >
              {isCollapsed ? (
                <FiChevronsRight className="size-4" aria-hidden />
              ) : (
                <FiChevronsLeft className="size-4" aria-hidden />
              )}
            </motion.span>
          </Button>
        </div>

        {actions ? (
          <div className="shrink-0 px-3 pt-3">{actions}</div>
        ) : null}

        <ScrollArea className="min-h-0 flex-1">
          <nav aria-label="Mailbox folders" className="space-y-1 px-3 pb-4 pt-2">
            {MAILBOXES.map((mailbox) => {
              const isActive = mailbox.id === activeMailbox;

              const button = (
                <Button
                  key={mailbox.id}
                  type="button"
                  variant="ghost"
                  className={cn(
                    "relative h-9 w-full gap-3 overflow-hidden hover:bg-transparent",
                    isCollapsed ? "justify-center px-0" : "justify-start",
                  )}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={isCollapsed ? mailbox.label : undefined}
                  onClick={() => handleSelectMailbox(mailbox.id)}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="sidebar-active-mailbox"
                      className="absolute inset-0 rounded-md bg-secondary"
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    />
                  ) : null}
                  <mailbox.icon className="relative z-10 size-4 shrink-0" aria-hidden />
                  <AnimatePresence initial={false}>
                    {!isCollapsed ? (
                      <motion.span
                        className="relative z-10 truncate whitespace-nowrap"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                      >
                        {mailbox.label}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </Button>
              );

              if (!isCollapsed) {
                return button;
              }

              return (
                <Tooltip key={mailbox.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">{mailbox.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
}

"use client";

import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

interface AssistantCardProps {
  icon?: ReactNode;
  title?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Generic Shadcn Card shell shared by every assistant rich-content card.
 * Individual card types (email, filter, confirmation, ...) compose this and
 * only supply their own content, so the chrome lives in one place.
 */
export function AssistantCard({
  icon,
  title,
  badge,
  children,
  className,
  contentClassName,
}: AssistantCardProps) {
  const hasHeader = Boolean(icon || title || badge);

  return (
    <Card
      className={cn(
        "mt-2 gap-0 py-0 shadow-none animate-in fade-in duration-300",
        className,
      )}
    >
      {hasHeader ? (
        <CardHeader className="border-b border-border/60 px-3 py-2.5">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            {icon}
            {title}
            {badge ? <span className="ml-auto">{badge}</span> : null}
          </CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className={cn("px-3 py-3 text-sm", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

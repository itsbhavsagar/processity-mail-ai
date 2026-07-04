"use client";

import { FiEdit } from "react-icons/fi";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

interface ComposeButtonProps {
  onClick: () => void;
  disabled?: boolean;
  collapsed?: boolean;
}

export function ComposeButton({
  onClick,
  disabled = false,
  collapsed = false,
}: ComposeButtonProps) {
  const composeButtonClassName =
    "rounded-full border border-primary/20 bg-primary/10 text-primary shadow-sm hover:bg-primary/15";

  if (!collapsed) {
    return (
      <Button
        type="button"
        variant="ghost"
        className={cn("w-full justify-start gap-2", composeButtonClassName)}
        onClick={onClick}
        disabled={disabled}
      >
        <FiEdit className="size-4" aria-hidden />
        Compose
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("mx-auto flex", composeButtonClassName)}
          onClick={onClick}
          disabled={disabled}
          aria-label="Compose"
        >
          <FiEdit className="size-4" aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">Compose</TooltipContent>
    </Tooltip>
  );
}

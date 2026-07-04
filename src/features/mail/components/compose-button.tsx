"use client";

import { FiEdit } from "react-icons/fi";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui";

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
  if (!collapsed) {
    return (
      <Button
        type="button"
        className="w-full justify-start gap-2"
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
          size="icon"
          className="mx-auto flex"
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

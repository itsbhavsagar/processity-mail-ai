"use client";

import { FiEdit } from "react-icons/fi";

import { Button } from "@/shared/ui";

interface ComposeButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function ComposeButton({ onClick, disabled = false }: ComposeButtonProps) {
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

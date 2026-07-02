"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/shared/ui";

interface ReconnectGoogleButtonProps {
  label?: string;
}

export function ReconnectGoogleButton({
  label = "Sign in again",
}: ReconnectGoogleButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      {label}
    </Button>
  );
}

"use client";

import { getSenderInitials } from "@/features/mail/lib/sender-avatar";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui";

const SIZE_CLASS = {
  sm: "size-9",
  md: "size-10",
} as const;

interface SenderAvatarProps {
  name: string;
  email?: string;
  /** Reserved for future Gmail profile photos. */
  imageUrl?: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}

export function SenderAvatar({
  name,
  email,
  imageUrl,
  size = "md",
  className,
}: SenderAvatarProps) {
  const initials = getSenderInitials({ name, email });

  return (
    <Avatar
      className={cn(
        "shrink-0 overflow-hidden rounded-full bg-primary/10",
        SIZE_CLASS[size],
        className,
      )}
    >
      {imageUrl ? (
        <AvatarImage src={imageUrl} alt="" className="object-cover" />
      ) : null}
      <AvatarFallback
        className={cn(
          "rounded-full bg-primary/10 font-medium text-primary",
          size === "sm" ? "text-xs" : "text-sm",
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

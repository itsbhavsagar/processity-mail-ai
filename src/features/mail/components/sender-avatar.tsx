"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui";

import {
  getSenderAvatarUrl,
  getSenderInitials,
} from "@/features/mail/lib/sender-avatar";
import type { MailAddress } from "@/features/mail/types/mail-address";

interface SenderAvatarProps {
  sender: MailAddress;
  size?: "default" | "lg";
}

export function SenderAvatar({ sender, size = "lg" }: SenderAvatarProps) {
  const avatarUrl = sender.email ? getSenderAvatarUrl(sender.email) : null;
  const initials = getSenderInitials(sender);

  return (
    <Avatar size={size} className="bg-muted">
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt="" className="object-cover" />
      ) : null}
      <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

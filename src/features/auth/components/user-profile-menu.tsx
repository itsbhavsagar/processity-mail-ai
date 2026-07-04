"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { FiChevronDown, FiLogOut } from "react-icons/fi";

import { cn } from "@/shared/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui";

export interface UserProfileMenuUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface UserProfileMenuProps {
  user: UserProfileMenuUser;
}

function getInitials(user: UserProfileMenuUser): string {
  const source = user.name?.trim() || user.email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function UserProfileMenu({ user }: UserProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const displayName = user.name?.trim() || user.email?.trim() || "Account";
  const email = user.email?.trim() ?? "";

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/login" });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="ml-auto h-auto gap-2 px-2 py-1.5 hover:bg-muted/60"
          aria-expanded={open}
        >
          <Avatar className="size-8">
            {user.image ? (
              <AvatarImage
                src={user.image}
                alt={displayName}
                referrerPolicy="no-referrer"
              />
            ) : null}
            <AvatarFallback>{getInitials(user)}</AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 flex-col items-start text-left md:flex">
            <span className="max-w-40 truncate text-sm font-medium leading-none">
              {displayName}
            </span>
            {email ? (
              <span className="max-w-40 truncate text-xs text-muted-foreground">
                {email}
              </span>
            ) : null}
          </span>
          <FiChevronDown
            className={cn(
              "hidden size-4 shrink-0 text-muted-foreground transition-transform duration-200 md:block",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal md:hidden">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {email ? (
              <p className="text-xs leading-none text-muted-foreground">
                {email}
              </p>
            ) : null}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="md:hidden" />

        <DropdownMenuItem onSelect={handleSignOut} className="gap-2">
          <FiLogOut className="size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

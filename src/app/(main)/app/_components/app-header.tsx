"use client";

import { FiMail, FiSearch } from "react-icons/fi";

import { siteConfig } from "@/config/site";
import { Input } from "@/shared/ui";

export function AppHeader() {
  return (
    <header className="border-b border-border bg-background/80 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex size-6 items-center justify-center rounded-md bg-primary/15 text-primary"
          >
            <FiMail className="size-3.5" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            {siteConfig.name}
          </span>
        </div>

        <div className="relative mx-auto hidden w-full max-w-xl md:block">
          <FiSearch
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Search workspace"
            placeholder="Search emails..."
            className="bg-background pl-9"
          />
        </div>

        <button
          aria-label="User profile"
          className="ml-auto inline-flex size-9 items-center justify-center rounded-full border border-border bg-muted text-sm font-medium text-muted-foreground"
        >
          U
        </button>
      </div>
    </header>
  );
}

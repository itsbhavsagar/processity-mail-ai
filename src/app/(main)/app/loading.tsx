import { cookies } from "next/headers";

import { SIDEBAR_COLLAPSED_COOKIE } from "@/shared/constants";
import { Skeleton } from "@/shared/ui";

import { AppShell } from "./_components/app-shell";

export default async function Loading() {
  const cookieStore = await cookies();
  const initialSidebarCollapsed =
    cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value === "true";

  return (
    <AppShell
      activeMailbox="inbox"
      initialSidebarCollapsed={initialSidebarCollapsed}
      workspace={
        <div className="flex h-full min-h-0 md:grid md:grid-cols-[300px_minmax(0,1fr)]">
          <div className="h-full min-h-0 space-y-3 overflow-hidden px-4 py-4 md:border-r md:border-border/60">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block" />
        </div>
      }
    />
  );
}

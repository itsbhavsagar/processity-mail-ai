import { cookies } from "next/headers";
import { getServerSession } from "next-auth";

import { authConfig } from "@/features/auth/server/auth-config";
import { SIDEBAR_COLLAPSED_COOKIE } from "@/shared/constants";
import { Card, CardContent, Skeleton } from "@/shared/ui";

import { AppHeader } from "./_components/app-header";
import { AppShell } from "./_components/app-shell";

export default async function Loading() {
  const session = await getServerSession(authConfig);
  const cookieStore = await cookies();
  const initialSidebarCollapsed =
    cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value === "true";

  return (
    <AppShell
      activeMailbox="inbox"
      header={<AppHeader user={session?.user} />}
      initialSidebarCollapsed={initialSidebarCollapsed}
      workspace={
        <Card className="flex h-full min-h-0 flex-col border-border/60 bg-card/80 shadow-sm">
          <CardContent className="space-y-3 px-4 py-4">
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
          </CardContent>
        </Card>
      }
    />
  );
}

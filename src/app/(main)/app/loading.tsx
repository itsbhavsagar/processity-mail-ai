import { Card, CardContent, Skeleton } from "@/shared/ui";

import { AppShell } from "./_components/app-shell";

export default function Loading() {
  return (
    <AppShell
      activeMailbox="inbox"
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

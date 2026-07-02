import { getServerSession } from "next-auth";

import { authConfig } from "@/features/auth/server/auth-config";
import { listInbox } from "@/features/gmail/services/gmail-service";

import { InboxThreadList } from "./inbox-thread-list";

export async function InboxWorkspace() {
  const session = await getServerSession(authConfig);

  if (!session?.accessToken) {
    return (
      <section className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">
          Sign in again to load your inbox.
        </p>
      </section>
    );
  }

  let threads;

  try {
    threads = await listInbox(session.accessToken);
  } catch {
    return (
      <section className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">
          Failed to load inbox. Try refreshing the page.
        </p>
      </section>
    );
  }

  return <InboxThreadList threads={threads} />;
}

import { getServerSession } from "next-auth";

import { authConfig } from "@/features/auth/server/auth-config";
import {
  getConversation,
  listInbox,
} from "@/features/gmail/services/gmail-service";
import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailThread } from "@/features/mail/types/mail-thread";

import { InboxWorkspaceClient } from "./inbox-workspace-client";

interface InboxWorkspaceProps {
  conversationId?: string;
}

export async function InboxWorkspace({ conversationId }: InboxWorkspaceProps) {
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

  let threads: MailThread[];

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

  let conversation: MailConversation | null = null;
  let conversationError = false;

  if (conversationId) {
    try {
      conversation = await getConversation(
        session.accessToken,
        conversationId,
      );
    } catch {
      conversationError = true;
    }
  }

  return (
    <InboxWorkspaceClient
      threads={threads}
      conversation={conversation}
      conversationError={conversationError}
      conversationId={conversationId}
    />
  );
}

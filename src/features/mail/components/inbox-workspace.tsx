import { getServerSession } from "next-auth";

import { authConfig } from "@/features/auth/server/auth-config";
import {
  GmailApiError,
  getConversation,
  listInbox,
} from "@/features/gmail/services/gmail-service";
import type { MailConversation } from "@/features/mail/types/mail-conversation";
import type { MailThread } from "@/features/mail/types/mail-thread";
import { Card, CardContent } from "@/shared/ui";

import { MailAppWorkspace } from "@/features/mail/components/mail-app-workspace";
import { ReconnectGoogleButton } from "./reconnect-google-button";
import { AppHeader } from "@/app/(main)/app/_components/app-header";

interface InboxWorkspaceProps {
  conversationId?: string;
}

function WorkspaceStatusCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex h-full min-h-0 items-center justify-center border-border/60 bg-card/80 shadow-sm">
      <CardContent className="px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {action ? <div className="mt-6">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

function GoogleSessionExpiredState() {
  return (
    <div className="flex h-dvh flex-col">
      <AppHeader />
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <WorkspaceStatusCard
          title="Your Gmail connection expired"
          description="Google access tokens last about an hour. Sign in again and we'll reconnect your inbox."
          action={<ReconnectGoogleButton />}
        />
      </div>
    </div>
  );
}

export async function InboxWorkspace({ conversationId }: InboxWorkspaceProps) {
  const session = await getServerSession(authConfig);

  if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
    return <GoogleSessionExpiredState />;
  }

  let threads: MailThread[];

  try {
    threads = await listInbox(session.accessToken);
  } catch (error) {
    if (error instanceof GmailApiError && error.status === 401) {
      return <GoogleSessionExpiredState />;
    }

    return (
      <WorkspaceStatusCard
        title="We couldn't load your inbox"
        description="Something went wrong while talking to Gmail. Refresh the page, or try again in a moment."
      />
    );
  }

  let conversation: MailConversation | null = null;
  let conversationError: "auth" | "unknown" | false = false;

  if (conversationId) {
    try {
      conversation = await getConversation(
        session.accessToken,
        conversationId,
      );
    } catch (error) {
      if (error instanceof GmailApiError && error.status === 401) {
        conversationError = "auth";
      } else {
        conversationError = "unknown";
      }
    }
  }

  return (
    <MailAppWorkspace
      key={conversationId ?? "inbox"}
      header={<AppHeader />}
      threads={threads}
      conversation={conversation}
      conversationError={conversationError}
      conversationId={conversationId}
    />
  );
}

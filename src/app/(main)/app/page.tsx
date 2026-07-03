import { InboxWorkspace } from "@/features/mail/components/inbox-workspace";
import { parseMailboxId } from "@/shared/constants";

interface AppPageProps {
  searchParams: Promise<{
    thread?: string;
    mailbox?: string;
  }>;
}

export default async function AppPage({ searchParams }: AppPageProps) {
  const { thread: conversationId, mailbox } = await searchParams;

  return (
    <InboxWorkspace
      mailbox={parseMailboxId(mailbox)}
      conversationId={conversationId}
    />
  );
}

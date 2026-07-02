import { InboxWorkspace } from "@/features/mail/components/inbox-workspace";

import { AppShell } from "./_components/app-shell";

interface AppPageProps {
  searchParams: Promise<{
    thread?: string;
  }>;
}

export default async function AppPage({ searchParams }: AppPageProps) {
  const { thread: conversationId } = await searchParams;

  return (
    <AppShell workspace={<InboxWorkspace conversationId={conversationId} />} />
  );
}

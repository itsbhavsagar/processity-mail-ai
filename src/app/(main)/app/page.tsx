import { InboxWorkspace } from "@/features/mail/components/inbox-workspace";

interface AppPageProps {
  searchParams: Promise<{
    thread?: string;
  }>;
}

export default async function AppPage({ searchParams }: AppPageProps) {
  const { thread: conversationId } = await searchParams;

  return <InboxWorkspace conversationId={conversationId} />;
}

import { getServerSession } from "next-auth";

import { AppHeader } from "@/app/(main)/app/_components/app-header";
import { AssistantProvider } from "@/features/assistant/components/assistant-provider";
import { authConfig } from "@/features/auth/server/auth-config";
import { MailSearchFilters } from "@/features/mail/components/mail-search-filters";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authConfig);

  return (
    <AssistantProvider
      header={
        <AppHeader user={session?.user} search={<MailSearchFilters />} />
      }
    >
      {children}
    </AssistantProvider>
  );
}

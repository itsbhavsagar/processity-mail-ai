import { InboxWorkspace } from "@/features/mail/components/inbox-workspace";

import { AppShell } from "./_components/app-shell";

export default function AppPage() {
  return <AppShell workspace={<InboxWorkspace />} />;
}

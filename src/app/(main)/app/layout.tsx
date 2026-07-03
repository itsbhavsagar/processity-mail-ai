import { AssistantProvider } from "@/features/assistant/components/assistant-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AssistantProvider>{children}</AssistantProvider>;
}

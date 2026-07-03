import type { AssistantTextMessage } from "@/features/assistant/types/assistant-message";
import { cn } from "@/shared/lib/utils";

interface AssistantTextMessageProps {
  message: AssistantTextMessage;
}

export function AssistantTextMessageView({ message }: AssistantTextMessageProps) {
  return (
    <div
      className={cn(
        "max-w-[92%] text-sm leading-relaxed",
        message.role === "user"
          ? "ml-auto rounded-2xl bg-primary px-3 py-2 text-primary-foreground"
          : "text-foreground/90",
      )}
    >
      {message.content}
    </div>
  );
}

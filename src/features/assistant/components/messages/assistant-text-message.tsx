import type { AssistantTextMessage } from "@/features/assistant/types/assistant-message";
import { cn } from "@/shared/lib/utils";

interface AssistantTextMessageProps {
  message: AssistantTextMessage;
}

export function AssistantTextMessageView({ message }: AssistantTextMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "inline-block w-fit max-w-[75%] text-sm leading-relaxed wrap-break-word",
          isUser
            ? "rounded-2xl bg-primary px-3 py-2 text-primary-foreground"
            : "rounded-2xl bg-muted/50 px-3 py-2 text-foreground/90",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

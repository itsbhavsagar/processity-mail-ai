import { motion } from "framer-motion";

import type { AssistantTextMessage } from "@/features/assistant/types/assistant-message";
import { cn } from "@/shared/lib/utils";

interface AssistantTextMessageProps {
  message: AssistantTextMessage;
}

export function AssistantTextMessageView({ message }: AssistantTextMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "inline-block w-fit max-w-[75%] text-sm leading-relaxed wrap-break-word",
          isUser
            ? "rounded-2xl bg-primary px-3 py-2 text-primary-foreground"
            : "rounded-2xl bg-muted/50 px-3 py-2 text-foreground/90",
        )}
      >
        {message.content}
      </motion.div>
    </div>
  );
}

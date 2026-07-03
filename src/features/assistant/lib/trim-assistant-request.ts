import type { AssistantRequest } from "@/features/assistant/types/assistant-action";

export const MAX_ASSISTANT_HISTORY = 8;

export function trimAssistantMessagesForApi(
  messages: AssistantRequest["messages"],
): AssistantRequest["messages"] {
  if (messages.length <= MAX_ASSISTANT_HISTORY) {
    return messages;
  }

  return messages.slice(-MAX_ASSISTANT_HISTORY);
}

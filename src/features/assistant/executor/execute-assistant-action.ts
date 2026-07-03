import type {
  AssistantAction,
  ComposeEmailPayload,
} from "@/features/assistant/types/assistant-action";

export interface AssistantMutationHandlers {
  showAssistantComposeDraft: (payload: ComposeEmailPayload) => void;
}

export function executeAssistantActions(
  actions: AssistantAction[],
  handlers: AssistantMutationHandlers,
): void {
  for (const action of actions) {
    if (action.type === "compose_email") {
      handlers.showAssistantComposeDraft(action.payload);
    }
  }
}

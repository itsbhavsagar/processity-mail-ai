import type {
  AssistantAction,
  ComposeEmailPayload,
  OpenEmailPayload,
  SearchEmailsPayload,
} from "@/features/assistant/types/assistant-action";

export interface AssistantMutationHandlers {
  showAssistantComposeDraft: (payload: ComposeEmailPayload) => void;
  applySearchEmails: (
    payload: SearchEmailsPayload,
  ) => void | Promise<void>;
  openEmail: (payload: OpenEmailPayload) => void;
  sendEmail: () => void;
}

export async function executeAssistantActions(
  actions: AssistantAction[],
  handlers: AssistantMutationHandlers,
): Promise<void> {
  for (const action of actions) {
    switch (action.type) {
      case "compose_email":
        handlers.showAssistantComposeDraft(action.payload);
        break;
      case "search_emails":
        await handlers.applySearchEmails(action.payload);
        break;
      case "open_email":
        handlers.openEmail(action.payload);
        break;
      case "send_email":
        handlers.sendEmail();
        break;
    }
  }
}

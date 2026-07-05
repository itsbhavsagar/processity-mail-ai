import type {
  AssistantAction,
  ComposeEmailPayload,
  ForwardEmailPayload,
  NavigateMailboxPayload,
  OpenEmailPayload,
  ReplyEmailPayload,
  SearchEmailsPayload,
} from "@/features/assistant/types/assistant-action";

export interface AssistantMutationHandlers {
  showAssistantComposeDraft: (payload: ComposeEmailPayload) => void;
  showAssistantReplyDraft: (payload: ReplyEmailPayload) => void;
  showAssistantForwardDraft: (payload: ForwardEmailPayload) => void;
  applySearchEmails: (
    payload: SearchEmailsPayload,
  ) => void | Promise<void>;
  openEmail: (payload: OpenEmailPayload) => void;
  navigateMailbox: (payload: NavigateMailboxPayload) => void;
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
      case "reply_email":
        handlers.showAssistantReplyDraft(action.payload);
        break;
      case "forward_email":
        handlers.showAssistantForwardDraft(action.payload);
        break;
      case "search_emails":
        await handlers.applySearchEmails(action.payload);
        break;
      case "open_email":
        handlers.openEmail(action.payload);
        break;
      case "navigate_mailbox":
        handlers.navigateMailbox(action.payload);
        break;
      case "send_email":
        handlers.sendEmail();
        break;
    }
  }
}

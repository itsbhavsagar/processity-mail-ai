"use client";

import { AssistantComposeDraftMessageView } from "@/features/assistant/components/messages/assistant-compose-draft-message";
import { AssistantTextMessageView } from "@/features/assistant/components/messages/assistant-text-message";
import type { AssistantChatMessage } from "@/features/assistant/types/assistant-message";
import type { ComposeDraft } from "@/features/mail/types/compose-draft";

interface AssistantMessageRendererProps {
  message: AssistantChatMessage;
  activeComposeMessageId?: string | null;
  composeDraft: ComposeDraft;
  onComposeDraftChange: (draft: ComposeDraft) => void;
  onComposeSend: () => void;
}

export function AssistantMessageRenderer({
  message,
  activeComposeMessageId,
  composeDraft,
  onComposeDraftChange,
  onComposeSend,
}: AssistantMessageRendererProps) {
  switch (message.kind) {
    case "text":
      return <AssistantTextMessageView message={message} />;
    case "compose_draft": {
      const isLive =
        message.id === activeComposeMessageId &&
        message.status !== "sent" &&
        message.status !== "superseded";

      return (
        <AssistantComposeDraftMessageView
          message={message}
          isLive={isLive}
          composeDraft={composeDraft}
          onComposeDraftChange={onComposeDraftChange}
          onComposeSend={onComposeSend}
        />
      );
    }
    default:
      return null;
  }
}

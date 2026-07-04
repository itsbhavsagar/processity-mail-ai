"use client";

import { AssistantComposeDraftMessageView } from "@/features/assistant/components/messages/assistant-compose-draft-message";
import { AssistantRichContentRenderer } from "@/features/assistant/components/assistant-rich-content-renderer";
import { AssistantTextMessageView } from "@/features/assistant/components/messages/assistant-text-message";
import type { AssistantChatMessage } from "@/features/assistant/types/assistant-message";
import type { AssistantDraft } from "@/features/mail/types/compose-draft";

interface AssistantMessageRendererProps {
  message: AssistantChatMessage;
  activeComposeMessageId?: string | null;
  composeDraft: AssistantDraft;
  onComposeDraftChange: (draft: AssistantDraft) => void;
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
      if (message.status === "superseded") {
        return null;
      }

      const isLive =
        message.id === activeComposeMessageId && message.status !== "sent";

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
    case "rich":
      return <AssistantRichContentRenderer content={message.content} />;
    default:
      return null;
  }
}

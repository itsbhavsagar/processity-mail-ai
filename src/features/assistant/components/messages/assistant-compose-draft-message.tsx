"use client";

import { AssistantComposeCard } from "@/features/assistant/components/assistant-compose-card";
import { canSendDraft } from "@/features/assistant/lib/assistant-message-utils";
import type { AssistantComposeDraftMessage } from "@/features/assistant/types/assistant-message";
import type { AssistantDraft } from "@/features/mail/types/compose-draft";

interface AssistantComposeDraftMessageProps {
  message: AssistantComposeDraftMessage;
  isLive: boolean;
  composeDraft: AssistantDraft;
  onComposeDraftChange: (draft: AssistantDraft) => void;
  onComposeSend: () => void;
}

export function AssistantComposeDraftMessageView({
  message,
  isLive,
  composeDraft,
  onComposeDraftChange,
  onComposeSend,
}: AssistantComposeDraftMessageProps) {
  const displayedDraft = isLive ? composeDraft : message.draft;
  const canSend =
    isLive &&
    (message.status === "draft" || message.status === "failed") &&
    canSendDraft(composeDraft);
  const canEdit =
    isLive && (message.status === "draft" || message.status === "failed");

  return (
    <div className="w-full max-w-full">
      <AssistantComposeCard
        fieldIdPrefix={`assistant-compose-${message.id}`}
        draft={displayedDraft}
        status={message.status}
        variant={message.variant}
        sentAt={message.sentAt}
        onDraftChange={canEdit ? onComposeDraftChange : undefined}
        onSend={canSend ? onComposeSend : undefined}
        onRetry={
          message.status === "failed" && isLive ? onComposeSend : undefined
        }
      />
    </div>
  );
}

"use client";

import { AssistantComposeCard } from "@/features/assistant/components/assistant-compose-card";
import { ASSISTANT_COPY } from "@/features/assistant/constants";
import {
  isComposeTypingStatus,
  type AssistantComposeDraftMessage,
} from "@/features/assistant/types/assistant-message";
import type { ComposeDraft } from "@/features/mail/types/compose-draft";
import { cn } from "@/shared/lib/utils";

interface AssistantComposeDraftMessageProps {
  message: AssistantComposeDraftMessage;
  isLive: boolean;
  composeDraft: ComposeDraft;
  onComposeDraftChange: (draft: ComposeDraft) => void;
  onComposeSend: () => void;
}

export function AssistantComposeDraftMessageView({
  message,
  isLive,
  composeDraft,
  onComposeDraftChange,
  onComposeSend,
}: AssistantComposeDraftMessageProps) {
  const isSuperseded = message.status === "superseded";
  const displayedDraft = isLive ? composeDraft : message.draft;
  const canSend =
    isLive && message.status === "draft" && Boolean(composeDraft.to.trim());
  const hideThought =
    message.status === "preparing" || isComposeTypingStatus(message.status);

  return (
    <div
      className={cn(
        "max-w-full text-sm leading-relaxed text-foreground/90",
        isSuperseded && "opacity-60",
      )}
    >
      {isSuperseded ? (
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {ASSISTANT_COPY.composeCard.supersededLabel}
        </p>
      ) : null}
      {message.content && !hideThought ? (
        <p className="mb-1">{message.content}</p>
      ) : null}
      <AssistantComposeCard
        fieldIdPrefix={`assistant-compose-${message.id}`}
        draft={displayedDraft}
        status={message.status}
        variant={message.variant}
        sentAt={message.sentAt}
        onDraftChange={isLive ? onComposeDraftChange : undefined}
        onSend={canSend ? onComposeSend : undefined}
      />
    </div>
  );
}

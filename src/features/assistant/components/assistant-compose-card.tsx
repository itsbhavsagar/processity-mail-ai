"use client";

import { ComposeDraftForm } from "@/features/mail/components/compose-draft-form";
import {
  activeFieldForComposeStatus,
  isComposeTypingStatus,
  type AssistantComposeDraftStatus,
} from "@/features/assistant/types/assistant-message";
import { ASSISTANT_COPY } from "@/features/assistant/constants";
import type { ComposeDraft } from "@/features/mail/types/compose-draft";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { FiCheckCircle, FiLoader } from "react-icons/fi";

const SENT_TIME_LOCALE = "en-GB";

function formatSentAt(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString(SENT_TIME_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
  });
}

interface AssistantComposeCardProps {
  draft: ComposeDraft;
  fieldIdPrefix: string;
  status: AssistantComposeDraftStatus;
  variant?: "create" | "revise";
  sentAt?: string;
  onDraftChange?: (draft: ComposeDraft) => void;
  onSend?: () => void;
}

export function AssistantComposeCard({
  draft,
  fieldIdPrefix,
  status,
  variant = "create",
  sentAt,
  onDraftChange,
  onSend,
}: AssistantComposeCardProps) {
  if (status === "sent") {
    return (
      <Card className="mt-2 gap-0 border-emerald-500/20 bg-emerald-500/5 py-0 shadow-none">
        <CardHeader className="border-b border-border/60 px-3 py-2.5">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <FiCheckCircle className="size-4 shrink-0" aria-hidden />
            {ASSISTANT_COPY.composeCard.sentTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-3 py-3 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">To</p>
            <p className="mt-0.5 wrap-break-word">{draft.to}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Subject</p>
            <p className="mt-0.5 wrap-break-word">{draft.subject || "—"}</p>
          </div>
          {sentAt ? (
            <p className="pt-1 text-xs text-muted-foreground">
              Sent {formatSentAt(sentAt)}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (status === "preparing") {
    return (
      <Card className="mt-2 gap-0 py-0 shadow-none">
        <CardContent className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
          <FiLoader className="size-4 shrink-0 animate-spin" aria-hidden />
          {variant === "revise"
            ? ASSISTANT_COPY.composeCard.preparingRevise
            : ASSISTANT_COPY.composeCard.preparing}
        </CardContent>
      </Card>
    );
  }

  const isEditable = status === "draft";
  const isSending = status === "sending";
  const isTyping = isComposeTypingStatus(status);

  return (
    <Card
      className={cn(
        "mt-2 gap-0 py-0 shadow-none transition-opacity duration-300",
        isTyping && "opacity-95",
      )}
    >
      <CardHeader className="border-b border-border/60 px-3 py-2.5">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {isSending ? (
            <>
              <FiLoader className="size-4 shrink-0 animate-spin" aria-hidden />
              {ASSISTANT_COPY.composeCard.sending}
            </>
          ) : isTyping ? (
            <>
              <FiLoader className="size-4 shrink-0 animate-spin" aria-hidden />
              {variant === "revise"
                ? ASSISTANT_COPY.composeCard.writingRevise
                : ASSISTANT_COPY.composeCard.writing}
            </>
          ) : status === "superseded" ? (
            ASSISTANT_COPY.composeCard.supersededTitle
          ) : (
            ASSISTANT_COPY.composeCard.draftTitle
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3 py-3">
        <ComposeDraftForm
          draft={draft}
          onDraftChange={isEditable ? onDraftChange : undefined}
          disabled={!isEditable || isSending}
          readOnly={!isEditable}
          activeField={activeFieldForComposeStatus(status)}
          fieldIdPrefix={fieldIdPrefix}
        />
        {onSend && isEditable ? (
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
              onClick={onSend}
              disabled={!draft.to.trim()}
            >
              {ASSISTANT_COPY.composeCard.sendButton}
            </button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

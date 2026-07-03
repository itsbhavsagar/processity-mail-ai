"use client";

import { ComposeDraftForm } from "@/features/mail/components/compose-draft-form";
import {
  activeFieldForComposeStatus,
  isComposeTypingStatus,
  type AssistantComposeDraftStatus,
} from "@/features/assistant/types/assistant-message";
import { ASSISTANT_COPY } from "@/features/assistant/constants";
import {
  isReplyDraft,
  type AssistantDraft,
} from "@/features/mail/types/compose-draft";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { FiCheckCircle, FiLoader } from "react-icons/fi";
import { Label, Textarea } from "@/shared/ui";

const SENT_TIME_LOCALE = "en-GB";

function formatSentAt(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString(SENT_TIME_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
  });
}

interface AssistantComposeCardProps {
  draft: AssistantDraft;
  fieldIdPrefix: string;
  status: AssistantComposeDraftStatus;
  variant?: "create" | "revise";
  sentAt?: string;
  onDraftChange?: (draft: AssistantDraft) => void;
  onSend?: () => void;
}

function ReplyDraftBody({
  draft,
  fieldIdPrefix,
  disabled,
  readOnly,
  activeField,
  onDraftChange,
}: {
  draft: Extract<AssistantDraft, { kind: "reply" }>;
  fieldIdPrefix: string;
  disabled: boolean;
  readOnly: boolean;
  activeField: ReturnType<typeof activeFieldForComposeStatus>;
  onDraftChange?: (draft: AssistantDraft) => void;
}) {
  const bodyClassName = cn(
    "min-h-24 resize-none text-sm",
    readOnly && activeField === "body" && "ring-1 ring-primary/25",
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Replying to</p>
        <p className="text-sm wrap-break-word">{draft.recipient}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Subject</p>
        <p className="text-sm wrap-break-word">{draft.subject || "—"}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${fieldIdPrefix}-body`} className="text-xs">
          Message
        </Label>
        <Textarea
          id={`${fieldIdPrefix}-body`}
          placeholder="Write your reply..."
          value={draft.body}
          onChange={(event) =>
            onDraftChange?.({ ...draft, body: event.target.value })
          }
          disabled={disabled}
          readOnly={readOnly}
          className={bodyClassName}
        />
      </div>
    </div>
  );
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
  const isReply = isReplyDraft(draft);

  if (status === "sent") {
    return (
      <Card className="mt-2 gap-0 border-emerald-500/20 bg-emerald-500/5 py-0 shadow-none">
        <CardHeader className="border-b border-border/60 px-3 py-2.5">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <FiCheckCircle className="size-4 shrink-0" aria-hidden />
            {isReply
              ? ASSISTANT_COPY.composeCard.replySentTitle
              : ASSISTANT_COPY.composeCard.sentTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-3 py-3 text-sm">
          {isReply ? (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Replying to
                </p>
                <p className="mt-0.5 wrap-break-word">{draft.recipient}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Subject
                </p>
                <p className="mt-0.5 wrap-break-word">{draft.subject || "—"}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground">To</p>
                <p className="mt-0.5 wrap-break-word">{draft.to}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Subject
                </p>
                <p className="mt-0.5 wrap-break-word">{draft.subject || "—"}</p>
              </div>
            </>
          )}
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
          {isReply
            ? variant === "revise"
              ? ASSISTANT_COPY.composeCard.replyPreparingRevise
              : ASSISTANT_COPY.composeCard.replyPreparing
            : variant === "revise"
              ? ASSISTANT_COPY.composeCard.preparingRevise
              : ASSISTANT_COPY.composeCard.preparing}
        </CardContent>
      </Card>
    );
  }

  const isEditable = status === "draft";
  const isSending = status === "sending";
  const isTyping = isComposeTypingStatus(status);
  const activeField = activeFieldForComposeStatus(status, draft);
  const canSend = isReply
    ? draft.body.trim().length > 0
    : draft.to.trim().length > 0;

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
              {isReply
                ? variant === "revise"
                  ? ASSISTANT_COPY.composeCard.replyWritingRevise
                  : ASSISTANT_COPY.composeCard.replyWriting
                : variant === "revise"
                  ? ASSISTANT_COPY.composeCard.writingRevise
                  : ASSISTANT_COPY.composeCard.writing}
            </>
          ) : status === "superseded" ? (
            ASSISTANT_COPY.composeCard.supersededTitle
          ) : isReply ? (
            ASSISTANT_COPY.composeCard.replyTitle
          ) : (
            ASSISTANT_COPY.composeCard.draftTitle
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3 py-3">
        {isReply ? (
          <ReplyDraftBody
            draft={draft}
            fieldIdPrefix={fieldIdPrefix}
            disabled={!isEditable || isSending}
            readOnly={!isEditable}
            activeField={activeField}
            onDraftChange={onDraftChange}
          />
        ) : (
          <ComposeDraftForm
            draft={draft}
            onDraftChange={
              isEditable && onDraftChange
                ? (nextDraft) => onDraftChange(nextDraft)
                : undefined
            }
            disabled={!isEditable || isSending}
            readOnly={!isEditable}
            activeField={activeField}
            fieldIdPrefix={fieldIdPrefix}
          />
        )}
        {onSend && isEditable ? (
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
              onClick={onSend}
              disabled={!canSend}
            >
              {ASSISTANT_COPY.composeCard.sendButton}
            </button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

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
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Separator,
  Textarea,
} from "@/shared/ui";
import { canSendDraft } from "@/features/assistant/lib/assistant-message-utils";
import { cn } from "@/shared/lib/utils";
import { FiCheckCircle, FiLoader, FiXCircle } from "react-icons/fi";

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
  onRetry?: () => void;
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

function DraftActionBar({
  onSend,
  canSend,
}: {
  onSend: () => void;
  canSend: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <Separator />
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" size="sm" onClick={onSend} disabled={!canSend}>
          {ASSISTANT_COPY.composeCard.sendButton}
        </Button>
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
  onRetry,
}: AssistantComposeCardProps) {
  const isReply = isReplyDraft(draft);

  if (status === "sent") {
    return (
      <Card
        className={cn(
          "mt-2 gap-0 border-emerald-500/30 bg-emerald-500/5 py-0 shadow-none",
          "animate-in fade-in duration-300",
        )}
      >
        <CardHeader className="border-b border-emerald-500/20 px-3 py-2.5">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <FiCheckCircle className="size-4 shrink-0" aria-hidden />
            {isReply
              ? ASSISTANT_COPY.composeCard.replySentTitle
              : ASSISTANT_COPY.composeCard.sentTitle}
            <Badge
              variant="outline"
              className="ml-auto border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
            >
              Sent
            </Badge>
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

  if (status === "failed") {
    return (
      <Card
        className={cn(
          "mt-2 gap-0 border-destructive/30 bg-destructive/5 py-0 shadow-none",
          "animate-in fade-in duration-300",
        )}
      >
        <CardHeader className="border-b border-destructive/20 px-3 py-2.5">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
            <FiXCircle className="size-4 shrink-0" aria-hidden />
            {ASSISTANT_COPY.composeCard.failedTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-3 py-3">
          <p
            role="alert"
            className="text-sm text-muted-foreground"
          >
            {ASSISTANT_COPY.composeCard.failedDescription}
          </p>
          {isReply ? (
            <ReplyDraftBody
              draft={draft}
              fieldIdPrefix={fieldIdPrefix}
              disabled={false}
              readOnly={false}
              activeField={null}
              onDraftChange={onDraftChange}
            />
          ) : (
            <ComposeDraftForm
              draft={draft}
              onDraftChange={onDraftChange}
              disabled={false}
              readOnly={false}
              activeField={null}
              fieldIdPrefix={fieldIdPrefix}
            />
          )}
          <div className="flex justify-end gap-2">
            {onRetry ? (
              <Button type="button" size="sm" onClick={onRetry}>
                {ASSISTANT_COPY.composeCard.retryButton}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "preparing") {
    return (
      <Card className="mt-2 gap-0 py-0 shadow-none animate-in fade-in duration-300">
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
  const canSend = canSendDraft(draft);

  return (
    <Card
      className={cn(
        "mt-2 gap-0 py-0 shadow-none transition-all duration-300 animate-in fade-in",
        isTyping && "opacity-95",
        isSending && "border-primary/20 bg-primary/5",
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
            <>
              {ASSISTANT_COPY.composeCard.replyTitle}
              <Badge variant="secondary" className="ml-auto font-normal">
                {ASSISTANT_COPY.composeCard.draftReady}
              </Badge>
            </>
          ) : (
            <>
              {ASSISTANT_COPY.composeCard.draftTitle}
              <Badge variant="secondary" className="ml-auto font-normal">
                {ASSISTANT_COPY.composeCard.draftReady}
              </Badge>
            </>
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
        {isEditable && onSend ? (
          <DraftActionBar onSend={onSend} canSend={canSend} />
        ) : null}
      </CardContent>
    </Card>
  );
}

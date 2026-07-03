"use client";

import type { ComposeDraft } from "@/features/mail/types/compose-draft";
import { Input, Label, Textarea } from "@/shared/ui";

interface ComposeDraftFormProps {
  draft: ComposeDraft;
  onDraftChange?: (draft: ComposeDraft) => void;
  disabled?: boolean;
  readOnly?: boolean;
  fieldIdPrefix: string;
}

export function ComposeDraftForm({
  draft,
  onDraftChange,
  disabled = false,
  readOnly = false,
  fieldIdPrefix,
}: ComposeDraftFormProps) {
  if (readOnly) {
    return (
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-medium text-muted-foreground">To</p>
          <p className="mt-0.5 wrap-break-word">{draft.to || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Subject</p>
          <p className="mt-0.5 wrap-break-word">{draft.subject || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Message</p>
          <p className="mt-0.5 whitespace-pre-wrap wrap-break-word">
            {draft.body || "—"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={`${fieldIdPrefix}-to`} className="text-xs">
          To
        </Label>
        <Input
          id={`${fieldIdPrefix}-to`}
          type="text"
          placeholder="name@example.com"
          autoComplete="email"
          value={draft.to}
          onChange={(event) =>
            onDraftChange?.({ ...draft, to: event.target.value })
          }
          disabled={disabled}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${fieldIdPrefix}-subject`} className="text-xs">
          Subject
        </Label>
        <Input
          id={`${fieldIdPrefix}-subject`}
          type="text"
          placeholder="Subject"
          value={draft.subject}
          onChange={(event) =>
            onDraftChange?.({ ...draft, subject: event.target.value })
          }
          disabled={disabled}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${fieldIdPrefix}-body`} className="text-xs">
          Message
        </Label>
        <Textarea
          id={`${fieldIdPrefix}-body`}
          placeholder="Write your message..."
          value={draft.body}
          onChange={(event) =>
            onDraftChange?.({ ...draft, body: event.target.value })
          }
          disabled={disabled}
          className="min-h-24 resize-none text-sm"
        />
      </div>
    </div>
  );
}

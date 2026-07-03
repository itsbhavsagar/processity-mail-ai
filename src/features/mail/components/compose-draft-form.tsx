"use client";

import type { ComposeDraft } from "@/features/mail/types/compose-draft";
import { Input, Label, Textarea } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

interface ComposeDraftFormProps {
  draft: ComposeDraft;
  onDraftChange?: (draft: ComposeDraft) => void;
  disabled?: boolean;
  readOnly?: boolean;
  activeField?: "to" | "subject" | "body" | null;
  fieldIdPrefix: string;
}

export function ComposeDraftForm({
  draft,
  onDraftChange,
  disabled = false,
  readOnly = false,
  activeField = null,
  fieldIdPrefix,
}: ComposeDraftFormProps) {
  const fieldInputClassName = (field: "to" | "subject" | "body") =>
    cn(
      "h-8 text-sm",
      readOnly && activeField === field && "ring-1 ring-primary/25",
    );

  const bodyClassName = cn(
    "min-h-24 resize-none text-sm",
    readOnly && activeField === "body" && "ring-1 ring-primary/25",
  );

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
          readOnly={readOnly}
          className={fieldInputClassName("to")}
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
          readOnly={readOnly}
          className={fieldInputClassName("subject")}
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
          readOnly={readOnly}
          className={bodyClassName}
        />
      </div>
    </div>
  );
}

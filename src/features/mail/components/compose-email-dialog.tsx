"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { sendEmail } from "@/features/mail/actions/send-email";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@/shared/ui";

export interface ComposeDraftFields {
  to: string;
  subject: string;
  body: string;
}

export const emptyComposeDraft: ComposeDraftFields = {
  to: "",
  subject: "",
  body: "",
};

interface ComposeEmailDialogProps {
  open: boolean;
  draft: ComposeDraftFields;
  onDraftChange: (draft: ComposeDraftFields) => void;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
}

export function ComposeEmailDialog({
  open,
  draft,
  onDraftChange,
  onOpenChange,
  onSent,
}: ComposeEmailDialogProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isPending) {
      return;
    }

    if (!nextOpen) {
      setErrorMessage(null);
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("to", draft.to);
    formData.set("subject", draft.subject);
    formData.set("body", draft.body);

    const recipientEmail = draft.to
      .split(",")
      .map((part) => part.trim())
      .find(Boolean);

    startTransition(async () => {
      const result = await sendEmail(formData);

      if (result.success) {
        toast.success("Email sent", {
          description: recipientEmail ? `Sent to ${recipientEmail}` : undefined,
        });
        onOpenChange(false);
        onSent?.();
        router.refresh();
        return;
      }

      if (result.error === "validation") {
        setErrorMessage(result.message ?? "Invalid form input");
        return;
      }

      if (result.error === "auth") {
        toast.error("Your Gmail connection expired.", {
          description: "Please sign in again.",
        });
        return;
      }

      toast.error("Couldn't send email");
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>
            Compose a plain-text email to send through Gmail.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="compose-to">To</Label>
            <Input
              id="compose-to"
              name="to"
              type="text"
              placeholder="name@example.com"
              autoComplete="email"
              value={draft.to}
              onChange={(event) =>
                onDraftChange({ ...draft, to: event.target.value })
              }
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compose-subject">Subject</Label>
            <Input
              id="compose-subject"
              name="subject"
              type="text"
              placeholder="Subject"
              value={draft.subject}
              onChange={(event) =>
                onDraftChange({ ...draft, subject: event.target.value })
              }
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compose-body">Message</Label>
            <Textarea
              id="compose-body"
              name="body"
              placeholder="Write your message..."
              className="min-h-40"
              value={draft.body}
              onChange={(event) =>
                onDraftChange({ ...draft, body: event.target.value })
              }
              disabled={isPending}
              required
            />
          </div>

          {errorMessage ? (
            <p
              role="alert"
              className="text-sm text-destructive"
              aria-live="polite"
            >
              {errorMessage}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ComposeDraftForm } from "@/features/mail/components/compose-draft-form";
import { sendEmail } from "@/features/mail/actions/send-email";
import {
  draftToFormData,
  getPrimaryRecipientEmail,
} from "@/features/mail/lib/compose-send";
import type { ComposeDraft } from "@/features/mail/types/compose-draft";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";

interface ComposeEmailDialogProps {
  open: boolean;
  draft: ComposeDraft;
  onDraftChange: (draft: ComposeDraft) => void;
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

    const formData = draftToFormData(draft);
    const recipientEmail = getPrimaryRecipientEmail(draft.to);

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
          <ComposeDraftForm
            draft={draft}
            onDraftChange={onDraftChange}
            disabled={isPending}
            fieldIdPrefix="manual-compose"
          />

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

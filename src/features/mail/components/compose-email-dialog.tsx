"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

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

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComposeEmailDialog({
  open,
  onOpenChange,
}: ComposeEmailDialogProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isPending) {
      return;
    }

    if (!nextOpen) {
      setErrorMessage(null);
      formRef.current?.reset();
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await sendEmail(formData);

      if (result.success) {
        formRef.current?.reset();
        onOpenChange(false);
        router.refresh();
        return;
      }

      setErrorMessage(
        result.message ?? "Something went wrong while sending your email.",
      );
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

        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="compose-to">To</Label>
            <Input
              id="compose-to"
              name="to"
              type="text"
              placeholder="name@example.com"
              autoComplete="email"
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

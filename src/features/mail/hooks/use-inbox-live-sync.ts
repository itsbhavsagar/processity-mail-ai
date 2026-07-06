"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { buildMailboxUrl } from "@/features/mail/lib/mailbox-url";
import type { MailboxId } from "@/shared/constants";

interface InboxChangedPayload {
  type: "inbox-changed";
  threadId?: string;
  sender?: string;
  subject?: string;
}

interface UseInboxLiveSyncOptions {
  mailbox: MailboxId;
  activeThreadId?: string;
}

export function useInboxLiveSync({
  mailbox,
  activeThreadId,
}: UseInboxLiveSyncOptions): void {
  const router = useRouter();

  // Keep the latest values in refs so the single EventSource handler always
  // reads current state without having to reconnect on every navigation.
  const mailboxRef = useRef(mailbox);
  const activeThreadIdRef = useRef(activeThreadId);

  useEffect(() => {
    mailboxRef.current = mailbox;
  }, [mailbox]);

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  useEffect(() => {
    const source = new EventSource("/api/gmail/stream");

    source.onopen = () =>
      console.log("[realtime] client: SSE connection open"); // TEMP DIAGNOSTIC
    source.onerror = (event) =>
      console.warn("[realtime] client: SSE error/disconnect", event); // TEMP DIAGNOSTIC

    const handleInboxChanged = (event: MessageEvent<string>) => {
      console.log("[realtime] client: inbox-changed event received", event.data); // TEMP DIAGNOSTIC

      let payload: InboxChangedPayload;
      try {
        payload = JSON.parse(event.data) as InboxChangedPayload;
      } catch {
        return;
      }

      const { threadId, sender, subject } = payload;

      // Reuse the existing Server Component data flow.
      router.refresh();

      // Native notification only when the tab is hidden and permission was
      // already granted; never request permission here.
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted" &&
        document.hidden
      ) {
        const notification = new Notification(sender || "New email", {
          body: subject,
        });
        // notification.onclick = () => window.focus();

        notification.onclick = () => {
          window.focus();

          if (threadId && activeThreadIdRef.current !== threadId) {
            router.push(buildMailboxUrl(mailboxRef.current, threadId));
          }
        };
      }

      toast(sender || "New email", {
        description: subject ? `${subject} · Just now` : "Just now",
        action: threadId
          ? {
              label: "Open",
              onClick: () => {
                if (activeThreadIdRef.current === threadId) {
                  return;
                }
                router.push(buildMailboxUrl(mailboxRef.current, threadId));
              },
            }
          : undefined,
      });
    };

    source.addEventListener(
      "inbox-changed",
      handleInboxChanged as EventListener,
    );

    return () => {
      source.removeEventListener(
        "inbox-changed",
        handleInboxChanged as EventListener,
      );
      source.close();
    };
  }, [router]);
}

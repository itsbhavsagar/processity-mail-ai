"use client";

import { useRef, useState } from "react";

import { executeAssistantActions } from "@/features/assistant/executor/execute-assistant-action";
import type {
  AssistantResponse,
  ComposeEmailPayload,
} from "@/features/assistant/types/assistant-action";
import { Button, ScrollArea, Textarea } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export interface MailAssistantActions {
  openCompose: () => void;
  fillCompose: (payload: ComposeEmailPayload) => void;
  requestSendConfirmation: () => void;
}

interface AssistantPanelProps {
  actions: MailAssistantActions;
  onConfirmedSend: () => void;
  conversationId?: string;
}

const DEV_COMPOSE_RESPONSE: AssistantResponse = {
  thought:
    "I've filled the compose form. Would you like me to send it?",
  requiresConfirmation: true,
  actions: [
    {
      type: "compose_email",
      payload: {
        to: "john@example.com",
        subject: "Meeting Tomorrow",
        body: "Let's meet at 3pm.",
      },
    },
  ],
};

const DEV_CONFIRM_SEND_RESPONSE: AssistantResponse = {
  thought: "Sending now.",
  requiresConfirmation: false,
  actions: [{ type: "send_email" }],
};

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
  };
}

export function AssistantPanel({
  actions,
  onConfirmedSend,
}: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const appendMessage = (message: ChatMessage) => {
    setMessages((current) => [...current, message]);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  const processAssistantResponse = (response: AssistantResponse) => {
    appendMessage(createMessage("assistant", response.thought));

    executeAssistantActions(response.actions, {
      openCompose: actions.openCompose,
      fillCompose: actions.fillCompose,
    });

    if (response.requiresConfirmation) {
      actions.requestSendConfirmation();
      return;
    }

    const wantsSend = response.actions.some(
      (action) => action.type === "send_email",
    );

    if (wantsSend) {
      onConfirmedSend();
    }
  };

  const handleDevCompose = () => {
    appendMessage(
      createMessage(
        "user",
        "Send an email to john@example.com with subject Meeting Tomorrow and body Let's meet at 3pm.",
      ),
    );
    processAssistantResponse(DEV_COMPOSE_RESPONSE);
  };

  const handleDevConfirmSend = () => {
    appendMessage(createMessage("user", "Yes"));
    processAssistantResponse(DEV_CONFIRM_SEND_RESPONSE);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    appendMessage(createMessage("user", trimmed));
    setInput("");
    setIsLoading(true);

    // Phase 2+: POST /api/assistant. Phase 1 uses dev shortcuts only.
    if (trimmed.toLowerCase() === "yes") {
      processAssistantResponse(DEV_CONFIRM_SEND_RESPONSE);
    } else {
      appendMessage(
        createMessage(
          "assistant",
          "Assistant API is not connected yet. Use the dev buttons below to test compose actions.",
        ),
      );
    }

    setIsLoading(false);
  };

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-border/60 bg-card/50">
      <div className="shrink-0 border-b border-border/60 px-4 py-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          AI Assistant
        </h2>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4 py-4">
        <div className="space-y-3 pr-3">
          {messages.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ask the assistant to compose email, or use the dev buttons to test
              UI actions.
            </p>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-lg px-3 py-2 text-sm leading-relaxed",
                message.role === "user"
                  ? "ml-6 bg-primary text-primary-foreground"
                  : "mr-6 border border-border/50 bg-muted/20 text-foreground/90",
              )}
            >
              {message.content}
            </div>
          ))}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Assistant is thinking…</p>
          ) : null}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 space-y-3 border-t border-border/60 px-4 py-4"
      >
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask the assistant…"
          className="min-h-20 resize-none"
          disabled={isLoading}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          Send
        </Button>

        {process.env.NODE_ENV === "development" ? (
          <div className="space-y-2 border-t border-border/60 pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Dev actions
            </p>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleDevCompose}
            >
              Test compose_email
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleDevConfirmSend}
            >
              Test send_email (after confirm)
            </Button>
          </div>
        ) : null}
      </form>
    </aside>
  );
}

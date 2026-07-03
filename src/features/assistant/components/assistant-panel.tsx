"use client";

import { useEffect, useRef, useState } from "react";
import {
  FiArrowRight,
  FiChevronDown,
  FiMessageCircle,
  FiMic,
  FiX,
} from "react-icons/fi";

import { ASSISTANT_COPY } from "@/features/assistant/constants";
import { AssistantMessageRenderer } from "@/features/assistant/components/assistant-message-renderer";
import { AssistantTextMessageView } from "@/features/assistant/components/messages/assistant-text-message";
import { AssistantTypingIndicator } from "@/features/assistant/components/assistant-typing-indicator";
import type { AssistantChatMessage } from "@/features/assistant/types/assistant-message";
import type { ComposeDraft } from "@/features/mail/types/compose-draft";
import { Button, ScrollArea, Textarea } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

const SUGGESTION_PROMPTS = [
  "Draft an email",
  "Show unread emails",
  "Find today's emails",
  "Summarize this conversation",
] as const;

interface AssistantPanelProps {
  messages: AssistantChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  isLoading: boolean;
  isBusy: boolean;
  typingAssistantText?: string | null;
  onSubmitPrompt: () => void;
  onSuggestionSelect: (prompt: string) => void;
  activeComposeMessageId?: string | null;
  composeDraft: ComposeDraft;
  onComposeDraftChange: (draft: ComposeDraft) => void;
  onComposeSend: () => void;
  onDevCompose?: () => void;
  onDevConfirmSend?: () => void;
}

export function AssistantPanel({
  messages,
  input,
  onInputChange,
  isLoading,
  isBusy,
  typingAssistantText = null,
  onSubmitPrompt,
  onSuggestionSelect,
  activeComposeMessageId,
  composeDraft,
  onComposeDraftChange,
  onComposeSend,
  onDevCompose,
  onDevConfirmSend,
}: AssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const focusInput = () => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  useEffect(() => {
    if (!isOpen || isLoading || isBusy) {
      return;
    }

    focusInput();
  }, [isOpen, isLoading, isBusy, messages.length]);

  useEffect(() => {
    if (messages.length === 0 && !typingAssistantText) {
      return;
    }

    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages, isLoading, isBusy, composeDraft, typingAssistantText]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.stopPropagation();
      setIsOpen(false);
      fabRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen]);

  const handleInputKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmitPrompt();
    }
  };

  const toggleOpen = () => {
    setIsOpen((current) => !current);
  };

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50">
      <div
        id="commandmail-ai-panel"
        role="region"
        aria-label="CommandMail AI assistant"
        aria-hidden={!isOpen}
        className={cn(
          "absolute right-0 bottom-full mb-3 flex w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-xl transition-all duration-200",
          "h-[min(600px,calc(100dvh-6rem))]",
          isOpen
            ? "pointer-events-auto visible translate-y-0 opacity-100"
            : "pointer-events-none invisible translate-y-2 opacity-0",
        )}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="min-w-0">
            <h2
              id="commandmail-ai-title"
              className="flex items-center gap-2 truncate text-sm font-semibold tracking-tight"
            >
              <FiMessageCircle
                className="size-4 shrink-0 text-primary"
                aria-hidden
              />
              <span className="truncate">{ASSISTANT_COPY.panel.title}</span>
            </h2>
            {isLoading ? (
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {ASSISTANT_COPY.panel.typing}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground"
            onClick={() => setIsOpen(false)}
            aria-label={ASSISTANT_COPY.panel.closeLabel}
          >
            <FiX className="size-4" aria-hidden />
          </Button>
        </header>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-3 px-4 py-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">
                  {ASSISTANT_COPY.panel.emptyHeading}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTION_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-foreground/90 transition-colors hover:bg-muted/60"
                      onClick={() => {
                        onSuggestionSelect(prompt);
                        focusInput();
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message) => (
              <AssistantMessageRenderer
                key={message.id}
                message={message}
                activeComposeMessageId={activeComposeMessageId}
                composeDraft={composeDraft}
                onComposeDraftChange={onComposeDraftChange}
                onComposeSend={onComposeSend}
              />
            ))}

            {typingAssistantText !== null ? (
              <AssistantTextMessageView
                message={{
                  id: "assistant-typing",
                  role: "assistant",
                  kind: "text",
                  content: typingAssistantText,
                }}
              />
            ) : null}

            {isLoading ? (
              <AssistantTypingIndicator className="text-sm text-foreground/90" />
            ) : null}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <footer className="shrink-0 border-t border-border/60 p-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSubmitPrompt();
            }}
            className="space-y-2"
          >
            <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground"
                disabled
                aria-label={ASSISTANT_COPY.panel.voiceLabel}
              >
                <FiMic className="size-4" aria-hidden />
              </Button>
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={ASSISTANT_COPY.panel.inputPlaceholder}
                rows={1}
                className="max-h-28 min-h-8 flex-1 resize-none border-0 bg-transparent px-0 py-1.5 shadow-none focus-visible:ring-0"
                disabled={isLoading || isBusy}
                aria-label={ASSISTANT_COPY.panel.inputPlaceholder}
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                disabled={isLoading || isBusy || !input.trim()}
                aria-label={ASSISTANT_COPY.panel.sendLabel}
                onMouseDown={(event) => event.preventDefault()}
              >
                <FiArrowRight className="size-4" aria-hidden />
              </Button>
            </div>

            {process.env.NODE_ENV === "development" &&
            onDevCompose &&
            onDevConfirmSend ? (
              <div>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setIsDebugOpen((open) => !open)}
                  aria-expanded={isDebugOpen}
                >
                  <FiChevronDown
                    className={cn(
                      "size-3.5 transition-transform",
                      isDebugOpen ? "rotate-180" : "",
                    )}
                    aria-hidden
                  />
                  Debug
                </button>
                {isDebugOpen ? (
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 flex-1 text-xs"
                      onClick={onDevCompose}
                    >
                      compose_email
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 text-xs"
                      onClick={onDevConfirmSend}
                    >
                      send_email
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </form>
        </footer>
      </div>

      <Button
        ref={fabRef}
        type="button"
        onClick={toggleOpen}
        aria-label={ASSISTANT_COPY.panel.openLabel}
        aria-expanded={isOpen}
        aria-controls="commandmail-ai-panel"
        className={cn(
          "pointer-events-auto h-11 gap-2 rounded-full px-4 shadow-lg",
          isOpen && "ring-2 ring-primary/20",
        )}
      >
        <FiMessageCircle className="size-4 shrink-0" aria-hidden />
        <span className="hidden text-sm font-medium sm:inline">
          {ASSISTANT_COPY.panel.title}
        </span>
      </Button>
    </div>
  );
}

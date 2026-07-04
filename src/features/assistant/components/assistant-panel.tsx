"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  FiArrowRight,
  FiClock,
  FiEdit3,
  FiMail,
  FiMessageCircle,
  FiMic,
} from "react-icons/fi";

import { AssistantMessageRenderer } from "@/features/assistant/components/assistant-message-renderer";
import { AssistantTypingIndicator } from "@/features/assistant/components/assistant-typing-indicator";
import { AssistantTextMessageView } from "@/features/assistant/components/messages/assistant-text-message";
import { ASSISTANT_COPY } from "@/features/assistant/constants";
import type { AssistantChatMessage } from "@/features/assistant/types/assistant-message";
import { ComposeDraftForm } from "@/features/mail/components/compose-draft-form";
import {
  emptyComposeDraft,
  type AssistantDraft,
  type ComposeDraft,
} from "@/features/mail/types/compose-draft";
import { cn } from "@/shared/lib/utils";
import { Button, ScrollArea, Textarea } from "@/shared/ui";

const SUGGESTIONS = [
  {
    title: "Draft an email",
    value: "Help me draft an email.",
    icon: FiEdit3,
    startsCompose: true,
  },
  { title: "Show unread emails", value: "Show unread emails.", icon: FiMail },
  {
    title: "Find today's emails",
    value: "Show today's emails.",
    icon: FiClock,
  },
] as const;

function buildComposeStarterInstruction(draft: ComposeDraft): string {
  const parts: string[] = [];

  if (draft.to.trim()) {
    parts.push(`to ${draft.to.trim()}`);
  }
  if (draft.subject.trim()) {
    parts.push(`with subject "${draft.subject.trim()}"`);
  }
  if (draft.body.trim()) {
    parts.push(`and body "${draft.body.trim()}"`);
  }

  return parts.length > 0
    ? `Send an email ${parts.join(" ")}.`
    : "Help me draft an email.";
}

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
  composeDraft: AssistantDraft;
  onComposeDraftChange: (draft: AssistantDraft) => void;
  onComposeSend: () => void;
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
}: AssistantPanelProps) {
  const [isComposeStarterOpen, setIsComposeStarterOpen] = useState(false);
  const [composeStarterDraft, setComposeStarterDraft] =
    useState<ComposeDraft>(emptyComposeDraft);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const focusInput = () => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleSuggestionClick = (suggestion: (typeof SUGGESTIONS)[number]) => {
    if ("startsCompose" in suggestion && suggestion.startsCompose) {
      setIsComposeStarterOpen(true);
      return;
    }

    onSuggestionSelect(suggestion.value);
    focusInput();
  };

  const handleComposeStarterSubmit = () => {
    onSuggestionSelect(buildComposeStarterInstruction(composeStarterDraft));
    setIsComposeStarterOpen(false);
    setComposeStarterDraft(emptyComposeDraft);
  };

  const handleComposeStarterCancel = () => {
    setIsComposeStarterOpen(false);
    setComposeStarterDraft(emptyComposeDraft);
  };

  useEffect(() => {
    if (isLoading || isBusy) {
      return;
    }

    focusInput();
  }, [isLoading, isBusy, messages.length]);

  useEffect(() => {
    if (messages.length === 0 && !typingAssistantText) {
      return;
    }

    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages, isLoading, isBusy, composeDraft, typingAssistantText]);

  const handleInputKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmitPrompt();
    }
  };

  return (
    <div
      id="commandmail-ai-panel"
      role="region"
      aria-label="CommandMail AI assistant"
      className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background"
    >
      <header className="flex h-18 shrink-0 items-center justify-between border-b border-border/60 px-4">
        <div className="min-w-0">
          <h2
            id="commandmail-ai-title"
            className="flex items-center gap-2 truncate text-sm font-semibold tracking-tight"
          >
            <span className="relative flex size-4 shrink-0 items-center justify-center">
              <FiMessageCircle className="size-4 text-primary" aria-hidden />
              <span
                className={cn(
                  "absolute -right-0.5 -top-0.5 size-1.5 rounded-full border border-background",
                  isLoading || isBusy
                    ? "animate-pulse bg-amber-500"
                    : "bg-emerald-500",
                )}
                aria-hidden
              />
            </span>
            <span className="truncate">{ASSISTANT_COPY.panel.title}</span>
          </h2>
          {isLoading ? (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {ASSISTANT_COPY.panel.typing}
            </p>
          ) : null}
        </div>
      </header>

      {messages.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-6">
          {isComposeStarterOpen ? (
            <div className="w-full space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
              <ComposeDraftForm
                draft={composeStarterDraft}
                onDraftChange={setComposeStarterDraft}
                fieldIdPrefix="assistant-compose-starter"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleComposeStarterCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!composeStarterDraft.to.trim()}
                  onClick={handleComposeStarterSubmit}
                >
                  Draft Email
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">
                {ASSISTANT_COPY.panel.emptyHeading}
              </p>
              <div className="flex flex-col items-center gap-4">
                {SUGGESTIONS.map((suggestion) => (
                  <motion.button
                    key={suggestion.title}
                    type="button"
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.15 }}
                    className="flex w-56 items-center justify-center gap-2 rounded-full border border-border/60 bg-muted/30 px-4 py-2.5 text-sm text-foreground/90 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <suggestion.icon className="size-4" aria-hidden />
                    {suggestion.title}
                  </motion.button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-3 px-4 py-4">
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
      )}

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
        </form>
      </footer>
    </div>
  );
}

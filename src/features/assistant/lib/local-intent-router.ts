import { ASSISTANT_COPY } from "@/features/assistant/constants";
import type {
  AssistantResponse,
  AssistantSearchResult,
} from "@/features/assistant/types/assistant-action";
import type { AssistantComposeDraftStatus } from "@/features/assistant/types/assistant-message";

export type LocalIntentResult =
  | { kind: "send_draft" }
  | { kind: "retry_send" }
  | { kind: "open_email"; threadId: string }
  | { kind: "discard_draft" }
  | { kind: "assistant_response"; response: AssistantResponse };

export type LocalIntentRouterContext = {
  canSend: boolean;
  hasActiveDraft: boolean;
  draftStatus: AssistantComposeDraftStatus | null;
  searchResults: AssistantSearchResult[] | null;
};

function normalizePrompt(prompt: string): string {
  return prompt.trim().replace(/[.!?]+$/u, "");
}

function matchesAny(prompt: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(prompt));
}

const SEND_PATTERNS = [
  /^send(?:\s+it|\s+now)?$/iu,
  /^yes$/iu,
  /^yup$/iu,
  /^sure$/iu,
  /^go ahead$/iu,
  /^looks good$/iu,
  /^perfect$/iu,
  /^do it$/iu,
  /^proceed$/iu,
  /^confirm$/iu,
  /^(?:ok(?:ay)?\s+send|send\s+ok)$/iu,
  /^that'?s fine$/iu,
  /^all good$/iu,
];

const RETRY_PATTERNS = [/^(?:retry|try again)$/iu];

const OPEN_LATEST_PATTERNS = [
  /^open (?:the )?(?:latest|most recent|newest)(?: one)?$/iu,
  /^open (?:the )?first(?: one)?$/iu,
];

const OPEN_SINGLE_PATTERNS = [
  /^(?:read|open|show)(?:\s+it|\s+that(?: email)?)?$/iu,
];

const GREETING_PATTERNS = [
  /^(?:hi|hello|hey|howdy)(?: there)?$/iu,
];

const THANKS_PATTERNS = [/^thanks?(?: you)?$/iu, /^thank you$/iu];

const HELP_PATTERNS = [/^help$/iu];

const CANCEL_PATTERNS = [
  /^(?:cancel|never mind|nevermind|discard)(?:\s+(?:draft|this|it))?$/iu,
];

function noActionResponse(thought: string): LocalIntentResult {
  return {
    kind: "assistant_response",
    response: {
      thought,
      requiresConfirmation: false,
      actions: [],
    },
  };
}

export function matchLocalIntent(
  rawPrompt: string,
  context: LocalIntentRouterContext,
): LocalIntentResult | null {
  const prompt = normalizePrompt(rawPrompt);
  if (!prompt) {
    return null;
  }

  if (matchesAny(prompt, RETRY_PATTERNS)) {
    if (context.draftStatus === "failed") {
      return { kind: "retry_send" };
    }
    return null;
  }

  if (matchesAny(prompt, SEND_PATTERNS)) {
    if (context.canSend) {
      return { kind: "send_draft" };
    }
    return noActionResponse(ASSISTANT_COPY.noActiveDraft);
  }

  if (matchesAny(prompt, CANCEL_PATTERNS) && context.hasActiveDraft) {
    return { kind: "discard_draft" };
  }

  if (matchesAny(prompt, OPEN_LATEST_PATTERNS)) {
    const threadId = context.searchResults?.[0]?.threadId;
    if (threadId) {
      return { kind: "open_email", threadId };
    }
    return noActionResponse(ASSISTANT_COPY.localIntent.searchFirst);
  }

  if (matchesAny(prompt, OPEN_SINGLE_PATTERNS)) {
    const results = context.searchResults;
    if (!results?.length) {
      return noActionResponse(ASSISTANT_COPY.localIntent.searchFirst);
    }
    if (results.length === 1) {
      return { kind: "open_email", threadId: results[0]!.threadId };
    }
    return null;
  }

  if (matchesAny(prompt, GREETING_PATTERNS)) {
    return noActionResponse(ASSISTANT_COPY.localIntent.greeting);
  }

  if (matchesAny(prompt, THANKS_PATTERNS)) {
    return noActionResponse(ASSISTANT_COPY.localIntent.thanks);
  }

  if (matchesAny(prompt, HELP_PATTERNS)) {
    return noActionResponse(ASSISTANT_COPY.localIntent.help);
  }

  return null;
}

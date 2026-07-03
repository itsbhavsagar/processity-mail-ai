import type {
  AssistantContext,
  AssistantResponse,
} from "@/features/assistant/types/assistant-action";
import { PROMPT_VERSION } from "@/features/assistant/lib/assistant-system-prompt";
import { serializeAssistantContextForPrompt } from "@/features/assistant/lib/serialize-assistant-context";

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  response: AssistantResponse;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry>();

function hashString(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

export function buildAssistantCacheKey(
  prompt: string,
  context: AssistantContext,
): string {
  const payload = [
    PROMPT_VERSION,
    prompt.trim().toLowerCase(),
    serializeAssistantContextForPrompt(context),
  ].join("\n");

  return hashString(payload);
}

export function getCachedAssistantResponse(
  cacheKey: string,
): AssistantResponse | null {
  const entry = responseCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    responseCache.delete(cacheKey);
    return null;
  }

  return entry.response;
}

export function setCachedAssistantResponse(
  cacheKey: string,
  response: AssistantResponse,
): void {
  responseCache.set(cacheKey, {
    response,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

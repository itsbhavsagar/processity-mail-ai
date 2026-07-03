import { ASSISTANT_COPY } from "@/features/assistant/constants";
import type { AssistantApiErrorCode } from "@/features/assistant/types/assistant-action";

export function getAssistantUserErrorMessage(
  code: AssistantApiErrorCode,
  apiMessage?: string,
): string {
  switch (code) {
    case "rate_limit":
      return ASSISTANT_COPY.rateLimitExceeded;
    case "model_error":
    case "validation_error":
    case "configuration":
      return ASSISTANT_COPY.temporarilyUnavailable;
    case "unauthorized":
    case "invalid_request":
      return apiMessage ?? ASSISTANT_COPY.unavailable;
    default:
      return ASSISTANT_COPY.unavailable;
  }
}

export function logAssistantProviderError(
  detail: Record<string, unknown>,
): void {
  console.log("[CommandMail AI]", detail);
}

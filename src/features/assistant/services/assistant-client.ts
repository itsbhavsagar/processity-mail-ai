import {
  getAssistantUserErrorMessage,
  logAssistantProviderError,
} from "@/features/assistant/lib/assistant-error-messages";
import type {
  AssistantApiErrorBody,
  AssistantRequest,
  AssistantResponse,
} from "@/features/assistant/types/assistant-action";

/**
 * What `/api/assistant` returns: the validated model output plus response
 * metadata. `model` is deliberately NOT part of `assistantResponseSchema` —
 * that schema validates what the LLM itself produces.
 */
export type AssistantApiResponse = AssistantResponse & { model?: string };

export class AssistantClientError extends Error {
  readonly code: AssistantApiErrorBody["error"];

  constructor(code: AssistantApiErrorBody["error"], message: string) {
    super(message);
    this.name = "AssistantClientError";
    this.code = code;
  }
}

export async function requestAssistantResponse(
  request: AssistantRequest,
): Promise<AssistantApiResponse> {
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const body = (await response.json()) as
    | AssistantApiResponse
    | AssistantApiErrorBody;

  if (!response.ok || "error" in body) {
    const errorBody = body as AssistantApiErrorBody;

    if (process.env.NODE_ENV === "development" || errorBody.providerDetail) {
      logAssistantProviderError({
        type: "assistant_api_error",
        httpStatus: response.status,
        code: errorBody.error,
        providerDetail: errorBody.providerDetail ?? errorBody.message,
      });
    }

    throw new AssistantClientError(
      errorBody.error ?? "model_error",
      getAssistantUserErrorMessage(errorBody.error, errorBody.message),
    );
  }

  return body;
}

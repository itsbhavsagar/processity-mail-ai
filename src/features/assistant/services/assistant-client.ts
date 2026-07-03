import {
  getAssistantUserErrorMessage,
  logAssistantProviderError,
} from "@/features/assistant/lib/assistant-error-messages";
import type {
  AssistantApiErrorBody,
  AssistantRequest,
  AssistantResponse,
} from "@/features/assistant/types/assistant-action";

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
): Promise<AssistantResponse> {
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const body = (await response.json()) as AssistantResponse | AssistantApiErrorBody;

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

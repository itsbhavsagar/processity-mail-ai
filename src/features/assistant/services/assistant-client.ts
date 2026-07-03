import { ASSISTANT_COPY } from "@/features/assistant/constants";
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
    throw new AssistantClientError(
      errorBody.error ?? "model_error",
      errorBody.message ?? ASSISTANT_COPY.unavailable,
    );
  }

  return body;
}

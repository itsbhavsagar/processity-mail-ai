import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import {
  getAssistantUserErrorMessage,
  logAssistantProviderError,
} from "@/features/assistant/lib/assistant-error-messages";
import {
  AssistantServiceError,
  generateAssistantResponse,
} from "@/features/assistant/services/assistant-service";
import {
  assistantRequestSchema,
  type AssistantApiErrorBody,
  type AssistantApiErrorCode,
} from "@/features/assistant/types/assistant-action";
import { authConfig } from "@/features/auth/server/auth-config";

function errorResponse(status: number, body: AssistantApiErrorBody) {
  return NextResponse.json(body satisfies AssistantApiErrorBody, {
    status,
  });
}

function toErrorBody(
  error: AssistantApiErrorCode,
  message: string,
  providerDetail?: string,
): AssistantApiErrorBody {
  const body: AssistantApiErrorBody = { error, message };

  if (process.env.NODE_ENV === "development" && providerDetail) {
    body.providerDetail = providerDetail;
  }

  return body;
}

export async function POST(request: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    return errorResponse(
      401,
      toErrorBody("unauthorized", "Please sign in to use the assistant."),
    );
  }

  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return errorResponse(
      400,
      toErrorBody("invalid_request", "Invalid request body."),
    );
  }

  const parsed = assistantRequestSchema.safeParse(json);

  if (!parsed.success) {
    return errorResponse(
      400,
      toErrorBody(
        "invalid_request",
        parsed.error.issues[0]?.message ?? "Invalid assistant request.",
      ),
    );
  }

  try {
    const result = await generateAssistantResponse(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AssistantServiceError) {
      const status =
        error.code === "configuration"
          ? 503
          : error.code === "rate_limit"
            ? 429
            : error.code === "validation_error"
              ? 502
              : 502;

      if (error.providerDetail) {
        logAssistantProviderError({
          type: "assistant_service_error",
          code: error.code,
          providerDetail: error.providerDetail,
        });
      }

      return errorResponse(
        status,
        toErrorBody(error.code, error.message, error.providerDetail),
      );
    }

    logAssistantProviderError({
      type: "assistant_api_failed",
      error,
    });

    return errorResponse(
      502,
      toErrorBody(
        "model_error",
        getAssistantUserErrorMessage("model_error"),
      ),
    );
  }
}

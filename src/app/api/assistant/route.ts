import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import {
  AssistantServiceError,
  generateAssistantResponse,
} from "@/features/assistant/services/assistant-service";
import {
  assistantRequestSchema,
  type AssistantApiErrorBody,
} from "@/features/assistant/types/assistant-action";
import { authConfig } from "@/features/auth/server/auth-config";

function errorResponse(
  status: number,
  error: AssistantApiErrorBody["error"],
  message: string,
) {
  return NextResponse.json({ error, message } satisfies AssistantApiErrorBody, {
    status,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    return errorResponse(401, "unauthorized", "Please sign in to use the assistant.");
  }

  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return errorResponse(400, "invalid_request", "Invalid request body.");
  }

  const parsed = assistantRequestSchema.safeParse(json);

  if (!parsed.success) {
    return errorResponse(
      400,
      "invalid_request",
      parsed.error.issues[0]?.message ?? "Invalid assistant request.",
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
          : error.code === "validation_error"
            ? 502
            : 502;

      return errorResponse(status, error.code, error.message);
    }

    return errorResponse(
      502,
      "model_error",
      "The assistant is unavailable. Try again in a moment.",
    );
  }
}

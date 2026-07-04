import {
  assistantResponseSchema,
  type AssistantContext,
  type AssistantRequest,
  type AssistantResponse,
} from "@/features/assistant/types/assistant-action";
import { ASSISTANT_COPY } from "@/features/assistant/constants";
import {
  logAssistantProviderError,
} from "@/features/assistant/lib/assistant-error-messages";
import {
  ACKNOWLEDGEMENT_PHRASES,
  buildAssistantSystemPrompt,
} from "@/features/assistant/lib/assistant-system-prompt";

const DEFAULT_ASSISTANT_MODEL =
  "meta-llama/llama-4-scout-17b-16e-instruct";

const GROQ_API_BASE =
  "https://api.groq.com/openai/v1/chat/completions";

function resolveAssistantModel(): string {
  return process.env.ASSISTANT_MODEL ?? DEFAULT_ASSISTANT_MODEL;
}

export class AssistantServiceError extends Error {
  readonly code:
    | "configuration"
    | "model_error"
    | "validation_error"
    | "rate_limit";
  readonly providerDetail?: string;

  constructor(
    code: "configuration" | "model_error" | "validation_error" | "rate_limit",
    message: string,
    providerDetail?: string,
  ) {
    super(message);
    this.name = "AssistantServiceError";
    this.code = code;
    this.providerDetail = providerDetail;
  }
}

function buildSystemPrompt(context: AssistantContext): string {
  return buildAssistantSystemPrompt(context);
}

interface GroqErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

function parseGroqErrorMessage(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as GroqErrorResponse;
    return parsed.error?.message?.trim() || null;
  } catch {
    return null;
  }
}

function resolveGroqFailure(
  status: number,
  body: string,
): AssistantServiceError {
  const groqMessage = parseGroqErrorMessage(body);
  const providerDetail = groqMessage ?? body;

  logAssistantProviderError({
    type: "groq_error",
    status,
    providerDetail,
  });

  if (status === 429) {
    return new AssistantServiceError(
      "rate_limit",
      ASSISTANT_COPY.rateLimitExceeded,
      providerDetail,
    );
  }

  if (status === 401 || status === 403) {
    return new AssistantServiceError(
      "configuration",
      ASSISTANT_COPY.temporarilyUnavailable,
      providerDetail,
    );
  }

  return new AssistantServiceError(
    "model_error",
    ASSISTANT_COPY.temporarilyUnavailable,
    providerDetail,
  );
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");

  if (objectStart !== -1 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1);
  }

  return trimmed;
}

function parseAssistantJson(raw: string): unknown {
  const payload = extractJsonPayload(raw);

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

const FALLBACK_ASSISTANT_RESPONSE: AssistantResponse = {
  thought:
    "I need a little more information to help with that. Who would you like to send the email to, and what should the subject and message be?",
  requiresConfirmation: false,
  actions: [],
};

function salvageThought(parsed: unknown): string | null {
  if (
    parsed &&
    typeof parsed === "object" &&
    "thought" in parsed &&
    typeof parsed.thought === "string" &&
    parsed.thought.trim().length > 0
  ) {
    return parsed.thought.trim();
  }

  return null;
}

function toSafeAssistantResponse(
  parsed: unknown,
  reason: string,
  rawResponse: string,
): AssistantResponse {
  console.warn("Assistant response normalized to safe fallback:", {
    reason,
    rawResponse,
    parsedResponse: parsed,
  });

  const thought = salvageThought(parsed);

  if (thought) {
    return {
      thought,
      requiresConfirmation: false,
      actions: [],
    };
  }

  return FALLBACK_ASSISTANT_RESPONSE;
}

function isBareAcknowledgement(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return (ACKNOWLEDGEMENT_PHRASES as readonly string[]).includes(normalized);
}

function sanitizeAssistantResponse(
  response: AssistantResponse,
  request: AssistantRequest,
): AssistantResponse {
  const lastMessage = request.messages.at(-1);

  if (
    response.actions.length === 0 ||
    lastMessage?.role !== "user" ||
    !isBareAcknowledgement(lastMessage.content)
  ) {
    return response;
  }

  return {
    thought: ASSISTANT_COPY.acknowledgementReply,
    requiresConfirmation: false,
    actions: [],
  };
}

export async function generateAssistantResponse(
  request: AssistantRequest,
): Promise<AssistantResponse> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new AssistantServiceError(
      "configuration",
      ASSISTANT_COPY.temporarilyUnavailable,
      "GROQ_API_KEY is not configured.",
    );
  }

  const model = resolveAssistantModel();
  const systemPrompt = buildSystemPrompt(request.context);

  const groqPayload = {
    model,
    temperature: 0.1,
    response_format: { type: "json_object" as const },
    messages: [
      { role: "system", content: systemPrompt },
      ...request.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ],
  };

  if (process.env.NODE_ENV === "development") {
    const payloadChars = JSON.stringify(groqPayload).length;
    const systemPromptChars = systemPrompt.length;
    console.log("[CommandMail AI]", {
      systemPromptChars,
      systemPromptApproxTokens: Math.ceil(systemPromptChars / 4),
      payloadChars,
      approxTokens: Math.ceil(payloadChars / 4),
    });
  }

  const response = await fetch(GROQ_API_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(groqPayload),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw resolveGroqFailure(response.status, body);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new AssistantServiceError(
      "model_error",
      ASSISTANT_COPY.temporarilyUnavailable,
      "The assistant returned an empty response.",
    );
  }

  const parsed = parseAssistantJson(content);

  if (parsed === null) {
    return toSafeAssistantResponse(parsed, "invalid_json", content);
  }

  const validated = assistantResponseSchema.safeParse(parsed);

  if (!validated.success) {
    return toSafeAssistantResponse(
      parsed,
      "schema_validation_failed",
      content,
    );
  }

  const sanitized = sanitizeAssistantResponse(validated.data, request);

  if (process.env.NODE_ENV === "development") {
    console.log({
      assistant: {
        model,
        prompt: systemPrompt,
        messages: request.messages,
        context: request.context,
        rawResponse: content,
        parsedResponse: validated.data,
        actions: sanitized.actions,
      },
    });
  }

  return sanitized;
}

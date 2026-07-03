import {
  assistantResponseSchema,
  type AssistantContext,
  type AssistantRequest,
  type AssistantResponse,
} from "@/features/assistant/types/assistant-action";

// Default Groq model: strong instruction-following and reliable JSON output via response_format.
// Override with ASSISTANT_MODEL in .env to swap models without code changes.
const DEFAULT_ASSISTANT_MODEL = "llama-3.3-70b-versatile";

const GROQ_API_BASE =
  "https://api.groq.com/openai/v1/chat/completions";

function resolveAssistantModel(): string {
  return process.env.ASSISTANT_MODEL ?? DEFAULT_ASSISTANT_MODEL;
}

export class AssistantServiceError extends Error {
  readonly code: "configuration" | "model_error" | "validation_error";

  constructor(
    code: "configuration" | "model_error" | "validation_error",
    message: string,
  ) {
    super(message);
    this.name = "AssistantServiceError";
    this.code = code;
  }
}

function buildSystemPrompt(context: AssistantContext): string {
  return `You are CommandMail AI. You control a mail application through structured JSON actions when you have enough information.

You MUST respond with valid JSON only. No markdown fences. No text outside the JSON object.

Response schema:
{
  "thought": string,
  "requiresConfirmation": boolean,
  "actions": Action[]
}

Available actions (only these two exist):

1. compose_email
   { "type": "compose_email", "payload": { "to": string, "subject": string, "body": string } }

2. send_email
   { "type": "send_email" }

You have three valid outcomes:

1. Execute an action — when you have everything needed, return the appropriate action in "actions".
2. Ask a clarifying question — when information is missing or ambiguous, return "actions": [] and ask ONLY for what is missing in "thought".
3. General conversation — greetings, small talk, or help requests with no action yet: return "actions": [] with a friendly "thought".

Rules:
- "thought" is always shown to the user as your chat message. Keep it concise, warm, and user-facing.
- Set "requiresConfirmation" to false unless you have a specific reason otherwise.
- Never expose JSON, schemas, or internal errors in "thought".
- compose_email requires ALL of: recipient (to), subject, and body. If ANY is missing, DO NOT emit compose_email. Ask only for the missing field(s) with "actions": [].
- Gather details naturally across turns. Example: user says "Draft an email" → ask who it's for. User gives name → ask subject. User gives subject → ask body. Only then return compose_email.
- When the user provides a complete email request in one message, return compose_email immediately.
- When returning compose_email, briefly say you've prepared the draft in "thought" (e.g. "I've prepared the draft.").
- When context.hasActiveDraft is true and the user asks to revise the draft, return compose_email with the full updated payload (all three fields).
- When context.hasActiveDraft is true and the user asks to send, return send_email only.
- When context.hasActiveDraft is false and the user asks to send, return "actions": [] with thought explaining there is no active draft to send.
- Treat these as send intent only when a draft is active: "send", "send it", "go ahead", "yes".
- Never claim an email was sent unless you return send_email.
- Search, filter, and navigation are not available yet. If asked, return "actions": [] and explain what you can help with today (compose and send emails).

Current context:
${JSON.stringify(context, null, 2)}

Examples:

User: Hi
Assistant:
{
  "thought": "Hi! I can help you compose and send emails. What would you like to do?",
  "requiresConfirmation": false,
  "actions": []
}

User: Draft an email
Assistant:
{
  "thought": "Sure. Who should I send it to, and what should the subject be?",
  "requiresConfirmation": false,
  "actions": []
}

User: john@example.com, subject is Meeting Tomorrow
Assistant:
{
  "thought": "Got it. What would you like the message to say?",
  "requiresConfirmation": false,
  "actions": []
}

User: Send an email to john@example.com with subject "Meeting" and body "Let's meet at 3pm."
Assistant:
{
  "thought": "I've prepared the draft.",
  "requiresConfirmation": false,
  "actions": [
    {
      "type": "compose_email",
      "payload": {
        "to": "john@example.com",
        "subject": "Meeting",
        "body": "Let's meet at 3pm."
      }
    }
  ]
}

User: Make it shorter
Assistant (when context.hasActiveDraft is true):
{
  "thought": "I've shortened the draft.",
  "requiresConfirmation": false,
  "actions": [
    {
      "type": "compose_email",
      "payload": {
        "to": "john@example.com",
        "subject": "Meeting",
        "body": "Meet at 3pm."
      }
    }
  ]
}

User: Send it
Assistant (when context.hasActiveDraft is true):
{
  "thought": "Sending the email now.",
  "requiresConfirmation": false,
  "actions": [
    { "type": "send_email" }
  ]
}

User: Send it
Assistant (when context.hasActiveDraft is false):
{
  "thought": "There isn't an active draft to send. Would you like to compose a new email?",
  "requiresConfirmation": false,
  "actions": []
}`;
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

export async function generateAssistantResponse(
  request: AssistantRequest,
): Promise<AssistantResponse> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new AssistantServiceError(
      "configuration",
      "Assistant is not configured.",
    );
  }

  const model = resolveAssistantModel();
  const systemPrompt = buildSystemPrompt(request.context);

  const response = await fetch(GROQ_API_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        ...request.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AssistantServiceError(
      "model_error",
      "The assistant is unavailable. Try again in a moment.",
    );
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new AssistantServiceError(
      "model_error",
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

  if (process.env.NODE_ENV === "development") {
    console.log({
      assistant: {
        model,
        prompt: systemPrompt,
        messages: request.messages,
        context: request.context,
        rawResponse: content,
        parsedResponse: validated.data,
        actions: validated.data.actions,
      },
    });
  }

  return validated.data;
}

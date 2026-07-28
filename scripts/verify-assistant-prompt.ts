/**
 * Live-model verification for assistant prompt changes.
 *
 * Runs a small set of scenarios against the REAL model and records every run to
 * `eval-runs/<timestamp>.jsonl`. Each record carries the prompt version AND the
 * exact model id, so a later failure can be attributed to a prompt change or to
 * the provider changing behaviour underneath us — never both at once.
 *
 * Usage:  npm run eval:prompt        (requires GROQ_API_KEY in .env)
 */
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { buildAssistantContext } from "@/features/assistant/lib/build-assistant-context";
import { PROMPT_VERSION } from "@/features/assistant/lib/assistant-system-prompt";
import {
  generateAssistantResponse,
  resolveAssistantModel,
} from "@/features/assistant/services/assistant-service";
import type { AssistantAction } from "@/features/assistant/types/assistant-action";
import type { MailConversation } from "@/features/mail/types/mail-conversation";

const OUTPUT_DIR = "eval-runs";

/**
 * Groq's free tier caps tokens-per-minute (8k at time of writing) and the full
 * system prompt is sent on every call, so unpaced runs get rate-limited part
 * way through. Pace the scenarios and retry once on a rate-limit error.
 */
const SCENARIO_DELAY_MS = Number(process.env.EVAL_DELAY_MS ?? 20_000);
const RATE_LIMIT_RETRY_MS = 35_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimited(error: unknown): boolean {
  return (
    error instanceof Error && /usage limit|rate.?limit/i.test(error.message)
  );
}

const openConversation: MailConversation = {
  id: "thread-1",
  subject: "Q3 planning",
  messages: [
    {
      id: "m1",
      sender: { name: "Alice", email: "alice@acme.com" },
      to: [{ name: "Me", email: "me@example.com" }],
      cc: [],
      subject: "Q3 planning",
      sentAt: "2026-07-01T10:00:00.000Z",
      bodyText: "Can you join the planning call tomorrow?",
    },
  ],
};

const withConversation = buildAssistantContext({
  mail: {
    mailbox: "inbox",
    conversationId: "thread-1",
    conversation: openConversation,
    currentUserEmail: "me@example.com",
  },
  hasActiveDraft: false,
  activeDraft: null,
  searchResults: null,
});

const emptyMailbox = buildAssistantContext({
  mail: { mailbox: "inbox", conversation: null },
  hasActiveDraft: false,
  activeDraft: null,
  searchResults: null,
});

interface Scenario {
  name: string;
  /** Why this scenario exists — usually a regression we already hit once. */
  regression: string;
  messages: { role: "user" | "assistant"; content: string }[];
  context: typeof emptyMailbox;
  expectActionTypes: string[];
  /** Substrings that must all appear in a search_emails query, if present. */
  expectQueryIncludes?: string[];
}

const scenarios: Scenario[] = [
  {
    name: "unread-this-week",
    regression: "model used to emit newer_than:1w, which Gmail rejects",
    messages: [{ role: "user", content: "show me unread emails from this week" }],
    context: emptyMailbox,
    expectActionTypes: ["search_emails"],
    expectQueryIncludes: ["is:unread", "newer_than:7d"],
  },
  {
    name: "yesterday-date-grammar",
    regression: "relative dates were computed by the model and came out wrong",
    messages: [{ role: "user", content: "show me emails from yesterday" }],
    context: emptyMailbox,
    expectActionTypes: ["search_emails"],
    expectQueryIncludes: ["newer_than:2d", "older_than:1d"],
  },
  {
    name: "acknowledgement-is-not-a-command",
    regression: "'thanks' used to re-run the previous search",
    messages: [
      { role: "user", content: "show me unread emails" },
      { role: "assistant", content: "Searching your mailbox." },
      { role: "user", content: "thanks" },
    ],
    context: emptyMailbox,
    expectActionTypes: [],
  },
  {
    name: "reply-to-open-conversation",
    regression: "reply must target the open thread, never invent a threadId",
    messages: [
      { role: "user", content: "reply saying I'll join tomorrow" },
    ],
    context: withConversation,
    expectActionTypes: ["reply_email"],
  },
  {
    name: "forward-to-recipient",
    regression: "forward must carry {threadId, to}; the app writes the body",
    messages: [
      { role: "user", content: "forward this email to john@example.com" },
    ],
    context: withConversation,
    expectActionTypes: ["forward_email"],
  },
];

function checkQuery(
  actions: AssistantAction[],
  expected: string[] | undefined,
): string | null {
  if (!expected?.length) {
    return null;
  }

  const search = actions.find((action) => action.type === "search_emails");
  if (!search) {
    return "no search_emails action to inspect";
  }

  const missing = expected.filter(
    (fragment) => !search.payload.query.includes(fragment),
  );

  return missing.length ? `query missing ${missing.join(", ")}` : null;
}

async function main() {
  const model = resolveAssistantModel();
  const startedAt = new Date().toISOString();
  const runId = startedAt.replace(/[:.]/g, "-");

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = join(OUTPUT_DIR, `${runId}.jsonl`);

  console.log(`prompt version : ${PROMPT_VERSION}`);
  console.log(`model          : ${model}`);
  console.log(`recording to   : ${outputPath}\n`);

  let passed = 0;
  let first = true;

  for (const scenario of scenarios) {
    if (!first) {
      await sleep(SCENARIO_DELAY_MS);
    }
    first = false;

    const record = {
      runId,
      startedAt,
      // Provenance: both moving parts are stamped on every single record.
      promptVersion: PROMPT_VERSION,
      model,
      scenario: scenario.name,
      regression: scenario.regression,
      expectActionTypes: scenario.expectActionTypes,
    };

    try {
      const run = () =>
        generateAssistantResponse({
          messages: scenario.messages,
          context: scenario.context,
        });

      let response;
      try {
        response = await run();
      } catch (error) {
        if (!isRateLimited(error)) {
          throw error;
        }
        console.log(`      rate limited — waiting to retry ${scenario.name}`);
        await sleep(RATE_LIMIT_RETRY_MS);
        response = await run();
      }

      const actualTypes = response.actions.map((action) => action.type);
      const typesMatch =
        actualTypes.length === scenario.expectActionTypes.length &&
        scenario.expectActionTypes.every((type, index) => actualTypes[index] === type);
      const queryProblem = checkQuery(response.actions, scenario.expectQueryIncludes);
      const ok = typesMatch && !queryProblem;

      const failureReason = !typesMatch
        ? `expected [${scenario.expectActionTypes.join(", ")}], got [${actualTypes.join(", ")}]`
        : queryProblem;

      appendFileSync(
        outputPath,
        `${JSON.stringify({
          ...record,
          ok,
          actualActionTypes: actualTypes,
          failureReason: failureReason ?? undefined,
          thought: response.thought,
          actions: response.actions,
        })}\n`,
      );

      if (ok) {
        passed += 1;
        console.log(`PASS  ${scenario.name}`);
      } else {
        console.log(`FAIL  ${scenario.name} — ${failureReason}`);
      }
    } catch (error) {
      appendFileSync(
        outputPath,
        `${JSON.stringify({
          ...record,
          ok: false,
          failureReason: `threw: ${(error as Error).message}`,
        })}\n`,
      );
      console.log(`ERROR ${scenario.name} — ${(error as Error).message}`);
    }
  }

  console.log(`\n${passed}/${scenarios.length} passed`);
  console.log(`full records: ${outputPath}`);

  if (passed !== scenarios.length) {
    process.exitCode = 1;
  }
}

void main();

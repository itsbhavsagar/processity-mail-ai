# CommandMail — Engineering Deep-Dive (LinkedIn / Interview Reference)

> Senior-engineer analysis of this repository, written for documenting the project on LinkedIn and preparing interview talking points. Everything below is grounded in the actual code, README.md, and ARCHITECTURE.md — nothing invented.

---

## 1. Project Overview

**What it is.** CommandMail is an AI-native Gmail client built for the Processity.ai hiring brief — *"build a mail app where the AI controls the UI."* It is a full mail client (Inbox/Sent/Drafts/Archive/Trash, conversation view, compose/reply/forward, real-time push sync) where a natural-language assistant operates the interface itself: it fills the compose form with a visible typing animation, swaps the inbox list for search results, jumps to threads, and drafts replies/forwards — against a real Gmail account, with nothing mocked.

**The problem it solves.** Most "AI + email" demos are chatbots that *talk about* your mailbox. CommandMail's assistant *drives* the mailbox: "show me unread emails from this week" doesn't produce a paragraph — it produces a filter card in the chat **and** the actual inbox list re-rendering with those results.

**Why it's different from a normal AI chatbot.** The model's entire output is a `thought` (user-facing sentence) plus zero or more **typed actions** drawn from a fixed, Zod-validated schema of exactly seven verbs (`compose_email`, `send_email`, `search_emails`, `open_email`, `reply_email`, `forward_email`, `navigate_mailbox`). A deterministic executor dispatches each action through the **same Server Actions and handlers the buttons already use**. The LLM decides *what* to do; the application owns *how* it happens. There is no path from the model to Gmail or the DOM that a mouse click doesn't also take.

**What makes the architecture interesting.**
- *The assistant is a caller, not an actor* — a security posture, not just a code-organization choice. The model can do everything the UI can do and nothing more.
- *Gmail is an integration, not the product* — the UI only ever sees normalized domain models (`MailThread`, `MailConversation`, `MailDraft`, `ReplyMailDraft`); Gmail's shapes never leave `features/gmail/`.
- *Real push-based realtime* — Gmail `users.watch` → Google Pub/Sub → OIDC-verified webhook → in-process hub → SSE → `router.refresh()`. No polling.
- *Human-in-the-loop by construction* — the assistant can only ever produce a **draft**; `send_email` fires solely on an explicit follow-up confirmation, and the visible draft card *is* the confirmation UI.

---

## 2. Assignment Understanding

**The brief:** build a mail app where the AI controls the UI, on real email infrastructure.

**Mandatory requirements → implementation:**

| Requirement | How it's satisfied |
|---|---|
| Send **and** receive real email | Gmail REST via `fetch()` in `gmail-service.ts`; sends through `messages.send` with hand-built MIME |
| Inbox + Sent with real data | Server Components call `listThreads()` → normalized `MailThread[]` |
| Compose + send from the UI | `compose-email-dialog.tsx` + `sendEmail` Server Action |
| Assistant fills the compose form from natural language | `compose_email` action → draft card with animated field-by-field typing |
| Assistant search updates the UI (not a chat-only reply) | `search_emails` → results replace the inbox list + filter/result cards in the panel |
| Context-aware assistant | `build-assistant-context.ts` serializes mailbox, open conversation (with body), active draft, and prior search results into every request |
| Real-time inbox sync | `users.watch` → Pub/Sub push → `/api/gmail/push` → hub → `/api/gmail/stream` (SSE) |

**Bonus features implemented:** reply *and* forward via the assistant; human-in-the-loop send; rich structured cards in the chat (email cards, list cards, filter cards, draft cards with live status); full conversation/thread view with Focus Mode; dark mode (`next-themes`, near-black neutral palette); 11 Jest suites / 38 unit tests over pure business logic; production deployment (multi-stage Docker → Render), plus a demo video and live URL in the README.

**Notable:** every requirement is satisfied against the real Gmail API — OAuth consent, token refresh, MIME threading headers, history-based sync. There are no fixtures standing in for the provider anywhere.

---

## 3. Complete Tech Stack

| Category | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui + Radix, framer-motion, sonner | Server Components eliminate a client data layer for reads; shadcn keeps UI vendored and ownable; TS end-to-end |
| **Backend** | Next.js Route Handlers + Server Actions (Node runtime) | Reads in Server Components, writes in Server Actions → one auth boundary, no bespoke API layer |
| **Database** | PostgreSQL (Neon) + Prisma | One table (`GmailSync`) for per-user sync state + encrypted refresh token; Prisma migrations for deploys |
| **Authentication** | NextAuth v4 (Auth.js), Google OAuth 2.0, JWT session strategy | `gmail.modify` scope, `access_type: offline`, `prompt: consent`; server-side token refresh; `proxy.ts` route guard (Next 16 middleware) |
| **AI** | Groq (`openai/gpt-oss-120b`), temperature 0.1, `response_format: json_object`, Zod validation | Fast/cheap inference suited to structured-output UI control; low temperature for determinism |
| **State management** | URL (`?thread=`, mailbox) for shareable state; React Context (`AssistantProvider`) for assistant session; `useState` for the rest | "Every piece of state has exactly one owner" — no global store, no client mail cache |
| **Architecture** | Feature-folder domain design (`features/auth|gmail|mail|assistant`), normalized domain models, action-executor pattern | Blast radius of a Gmail change is one folder; the model↔app contract is one Zod schema |
| **Infrastructure** | Docker multi-stage (deps → builder → migrator → runner), Next standalone output, non-root user, HEALTHCHECK | Secretless image build (env read at request time only); Prisma `binaryTargets` for x86 + arm64 glibc |
| **Deployment** | Render (live), docker-compose + Nginx config for VPS deployment | Compose binds the app to loopback behind Nginx; one-shot `migrate` service applies Prisma migrations |
| **Realtime** | Gmail `users.watch` → Google Pub/Sub (OIDC-authenticated push) → in-process hub → SSE (`EventSource`) | Push, not polling; SSE is the smallest primitive that fits one-way fan-out; 25s heartbeat + `X-Accel-Buffering: no` |
| **Testing** | Jest 30 via `next/jest` (SWC transform, node env), 11 suites / 38 tests | Pure-logic units where bugs are cheapest: query building, draft builders, MIME/crypto, parsing |
| **Developer tooling** | ESLint 9 (flat config) + Prettier, `tsc --noEmit`, knip-assisted dead-code cleanup, Claude Code as AI pair | typecheck + lint + test + build gate every change |

---

## 4. Architecture Decisions

**Server Components for reads / Server Actions for writes.**
*Why:* one auth boundary (`getServerSession` on the server), no client data cache, no API-route boilerplate for reads. *Alternative:* client-side fetching with TanStack Query. *Trade-off:* updates arrive via `router.refresh()` round-trips instead of optimistic client mutations. *Benefit:* dramatically less state to reason about; tokens never leave the server. *Downside:* every navigation re-fetches from Gmail.

**Typed AI actions + deterministic executor.**
*Why:* an LLM with a free path to the mailbox/DOM is an unauditable second actor. *Alternative:* tool-calling with open-ended function surface, or letting the model emit UI mutations. *Trade-off:* the assistant is limited to what the UI can do — which is exactly the intended safety property. *Benefit:* the entire model↔app contract is one discriminated-union Zod schema (`assistant-action.ts`); adding a capability (e.g., `forward_email`) is one schema entry + one executor case + prompt rules. *Downside:* every new capability requires code, not just prompting.

**Gmail behind a normalized domain layer.**
*Why:* UI code that consumes raw Gmail payloads is unswappable and untestable. *Alternative:* use `googleapis` SDK types throughout. *Trade-off:* a mapping layer (`normalize-message.ts`, `normalize-thread.ts`, `extract-message-body.ts`). *Benefit:* provider-agnostic UI; MIME/base64url weirdness contained in one folder. *Downside:* no formal provider interface yet — deliberately deferred until a second provider exists ("an interface designed against one implementation is usually wrong").

**Draft-then-send as the human-in-the-loop gate.**
*Why:* a separate "Are you sure?" dialog is ceremony; the visible, editable draft *is* the confirmation. *Mechanics:* `compose_email`/`reply_email`/`forward_email` only ever produce a draft card; `send_email` is a separate action gated by `canSendDraft` + explicit confirmation phrases; drafts carry a status lifecycle (preparing → typing → draft → sending → sent/failed) and stale drafts are superseded, never silently replaced.

**Prompt architecture: compressed spec + serialized context + versioning.**
*Why:* token cost and latency. The system prompt uses a compressed action syntax rather than full JSON Schema; context is packed as `key="value"` lines rather than raw JSON; history is trimmed to the last 8 messages; `PROMPT_VERSION` (currently 7) keys the response cache so prompt edits invalidate stale entries.

**Realtime: in-process hub over infrastructure.**
*Why:* the smallest thing that delivers push-based live sync on one instance. *Alternative:* Redis pub/sub, or client polling. *Trade-off:* the Pub/Sub webhook and a user's SSE connection must share a process — single-instance only, documented as the one hard scaling blocker. *Benefit:* zero additional infrastructure for the assignment's scale.

**OAuth & token custody.**
JWT session strategy; access token + expiry live in the JWT; refresh handled server-side in the `jwt` callback with the refresh token preserved across rotations; failure surfaces as `session.error = "RefreshAccessTokenError"`. The Gmail refresh token is additionally persisted (for the push webhook, which acts without a session) — **encrypted with AES-256-GCM** before it touches Postgres. Refresh tokens never reach the browser.

**Security posture.**
OIDC verification on the Pub/Sub webhook (audience + service-account email) before trusting any payload; `CRON_SECRET` bearer on watch renewal; DOMPurify-sanitized email HTML rendered inside a **sandboxed iframe without `allow-scripts`**; assistant reasons over `html-to-text` output rather than raw HTML (smaller prompts, injection-resistant); route protection in `proxy.ts`.

**State ownership.**
URL owns anything shareable (`?thread=`, mailbox). `AssistantProvider` (mounted above the route in the layout) owns the assistant session so it survives navigation. Everything else is local `useState`. No global store.

**Caching.**
A per-tab, 5-minute assistant response cache keyed on `hash(PROMPT_VERSION + normalized prompt + serialized context)` — identical questions in identical contexts skip Groq entirely. Context-sensitivity of the key means a changed mailbox/draft/results naturally misses.

---

## 5. AI Engineering

**How it works end-to-end.** User message → `build-assistant-context` snapshots the app (mailbox, open conversation with body, active draft, up to 5 prior search results, today's epoch) → cache check → `POST /api/assistant` builds the system prompt and calls Groq (`temperature 0.1`, `response_format: json_object`) → response is Zod-validated → the client executor runs each action through the same handlers the UI uses.

**Prompt generation.** `assistant-system-prompt.ts` holds a compressed behavioral spec: the seven-action list in shorthand (`reply_email(threadId,body)`), per-action rule blocks (when to act, when to ask, what never to do), date-handling rules (epoch-exact "today", `newer_than/older_than` grammar, weekday→date conversion), acknowledgement handling ("thanks" must not re-trigger a search), and few-shot examples as literal JSON. Context is appended as packed `key="value"` lines.

**Context creation.** The open conversation contributes its latest message — sender, recipients, cc, date, and body capped at 1,200 chars. A key detail: HTML-only emails (no `text/plain` part) fall back to a pure-string `htmlToPlainText` conversion so the assistant can actually read marketing/notification emails instead of seeing only the subject.

**Action validation.** Every model response is parsed against a Zod discriminated union. Unparseable or invalid output degrades to a safe fallback response (salvaging the `thought` when possible) rather than throwing. Malformed actions can never reach the executor.

**Hallucination reduction.** `threadId` must come from context the model actually saw (search results, open conversation, active draft) — the prompt forbids inventing ids, and invented ids resolve to nothing because there is no lookup path. Reply/forward drafts are built **client-side from the real open conversation** (`buildReplyDraftFromMailContext`, `buildForwardDraftFromMailContext`) — the model supplies intent (`threadId`, `to`, body text); the app supplies ground truth (subjects, recipients, quoted content). The app never trusts the model for facts it already has.

**How the AI controls the UI.** Actions map to the same handlers as clicks: `search_emails` runs the same search Server Action and swaps the inbox list; `open_email` performs a router navigation; `compose_email` opens the real compose card and types into it (time-boxed animation — 700ms/600ms/1200ms per field — so long bodies don't take forever); `navigate_mailbox` switches mailboxes.

**Human confirmation.** `send_email` with no active draft explains there's nothing to send. With a draft, it fires only when the user has explicitly confirmed ("send it", "yes", …) — bare acknowledgements ("thanks", "ok") are explicitly *not* send confirmations, enforced both in the prompt and by a server-side guard that forces `actions: []` for bare acknowledgements.

**Structured outputs.** `response_format: json_object` + a fixed response shape (`thought`, `requiresConfirmation`, `actions[]`) means the UI never parses free text.

**Zod as the protection boundary.** The same schemas type the client, validate the API request (`assistantRequestSchema`), and validate the model output — one source of truth for the entire contract, with TypeScript types inferred from it.

**Prompt compression & caching.** Compressed action syntax, packed context serialization, 8-message history window, and the versioned 5-minute response cache together keep per-request tokens and Groq spend low; the cache also makes repeated demo queries instant.

---

## 6. Gmail Integration

- **OAuth flow.** Authorization Code via NextAuth v4 with `gmail.modify`, `access_type: "offline"`, `prompt: "consent"` (guarantees a refresh token). Redirect URI is derived from `NEXTAUTH_URL`, making localhost and production work with the same code and one Google client.
- **Access-token refresh.** The `jwt` callback returns the cached token until `accessTokenExpires`, then POSTs `oauth2.googleapis.com/token` with the refresh token; failures mark `session.error` for the UI. A standalone `getAccessTokenFromRefreshToken` variant serves the sessionless webhook path.
- **Refresh-token storage & encryption.** Stored in the `GmailSync` row, encrypted with **AES-256-GCM** (12-byte random IV, 16-byte auth tag, `iv‖tag‖ciphertext` base64-packed; 32-byte key from `TOKEN_ENCRYPTION_KEY`). The unit tests cover round-trip, IV uniqueness, key validation, and GCM tamper rejection.
- **Sending mail.** `build-mime-message.ts` constructs raw RFC 822 messages by hand — RFC 2047 base64 encoding for non-ASCII subjects, base64url encoding for the Gmail API — POSTed to `messages.send`. No Google SDK anywhere; plain `fetch()`.
- **Replying.** `buildReplyHeadersFromConversation` chains `In-Reply-To`/`References` from the latest message's RFC ids so Gmail threads replies correctly; reply recipient logic answers the sender unless the user sent the latest message (then it falls back to that message's first recipient).
- **Searching.** `searchThreads` runs the list path with a raw Gmail `q=`; `buildGmailQuery` translates structured filters (sender / read-status / date range) into Gmail syntax, with an inclusive end-date implemented as `before: startOfDay(dateTo) + 86400`.
- **Conversation loading.** `threads.get?format=full`, recursive MIME-part walk (`extract-message-body.ts`) decoding base64url and preferring `text/html` + `text/plain` pairs; rendered via DOMPurify inside a sandboxed, auto-resizing iframe with the email's own CSS intact (Gmail-style rendering).
- **Realtime sync.** Sign-in registers `users.watch` on `INBOX` → Gmail publishes to a Pub/Sub topic → an **OIDC-authenticated push subscription** POSTs `/api/gmail/push` → the handler verifies the token (`verifyIdToken` against `GMAIL_PUSH_AUDIENCE`, sender must equal `GMAIL_PUSH_SA_EMAIL`), diffs `history.list` from the stored `historyId`, fetches metadata for the newest message, and publishes `inbox-changed` to the hub.
- **SSE.** `/api/gmail/stream` holds one connection per tab: 25s heartbeat, `X-Accel-Buffering: no` plus a padding flush for proxy compatibility, cleanup on `request.signal` abort. The client `EventSource` triggers `router.refresh()`, a toast, and a native Notification when the tab is hidden.
- **Watch renewal.** Gmail watches expire in ~7 days; a `CRON_SECRET`-protected `GET /api/gmail/renew-watch` re-registers all watches expiring within 24h (skips users without refresh tokens, reports renewed/skipped/failed).
- **History sync edge cases.** No stored baseline → adopt the incoming `historyId` and wait. `history.list` 404 (gap too old) → reset the baseline from `getProfile()` and ack. Unknown mailbox → `204` so Pub/Sub stops redelivering. Transient failures → `500` so Pub/Sub retries.

---

## 7. Biggest Engineering Challenges

**1. Making the LLM control the UI safely.**
*Problem:* the brief demands an AI that operates the interface, which naïvely means giving a model dangerous reach. *Why hard:* prompt injection via email content, hallucinated ids, and unbounded side effects are all real risks. *Solution:* the typed-action contract — seven Zod-validated verbs executed by deterministic code through pre-existing Server Actions, thread ids restricted to seen context, drafts built from ground truth rather than model output. *Lesson:* the safest LLM integration is one where the model returns **data**, and code decides everything else.

**2. Gmail realtime across four systems.**
*Problem:* new mail must appear with no refresh. *Why hard:* the pipeline spans Gmail watch registration, Pub/Sub delivery semantics, webhook authentication, history diffing, in-process fan-out, SSE through proxies, and a React client — a break anywhere looks identical from the browser ("nothing happens"). Real failures encountered along the way included a Pub/Sub subscription created as **Pull** instead of **Push**, missing OIDC env vars causing silent 401s, and proxy buffering considerations for SSE. *Solution:* verify each hop independently; log at every boundary (watch registration, push receipt, decode, publish with subscriber count, SSE connect/forward); treat Pub/Sub metrics as the source of truth for delivery. *Lesson:* distributed debugging is about instrumenting boundaries, not staring at code — the first missing log line names the broken hop.

**3. OAuth + long-lived Gmail access.**
*Problem:* the webhook must act on a user's mailbox with no session present. *Why hard:* access tokens live ~1 hour; refresh tokens are only issued on consent; the webhook path and the session path need different token flows. *Solution:* JWT-session refresh for interactive use; encrypted refresh token at rest for the webhook, minted into access tokens on demand; `prompt: "consent"` to guarantee refresh-token issuance. *Lesson:* map every code path that needs credentials **before** picking a token-custody model.

**4. LLM reliability on a small model.**
*Problem:* a 17B model with JSON output drifts — invalid date math (`newer_than:1w`), re-running searches after "thanks", never emitting `open_email` for "open the latest email from X". *Solution:* tightened prompt rules with explicit MUST/NEVER date grammar; acknowledgement short-circuiting in both prompt and server guard; a client-side open-intent heuristic that auto-navigates when a search stems from an "open …" request; live verification scripts calling the real prompt + Groq before shipping prompt changes; `PROMPT_VERSION` bumps to invalidate cached behavior. *Lesson:* prompt changes are code changes — version them, test them against the live model, and add deterministic guards for what prompts can't guarantee.

**5. Email HTML rendering.**
*Problem:* real-world emails (Amazon, LinkedIn templates) rendered as unreadable flat text, and dark mode made some invisible. *Why hard:* injected email HTML inherits the app's Tailwind reset and forced colors; emails assume a white background; many have no plain-text part at all. *Solution:* render each message in a sandboxed iframe (`srcDoc`, no `allow-scripts`, DOMPurify keeping `<style>`) with its own CSS and auto-height measurement; feed the assistant `htmlToPlainText(bodyHtml)` when `bodyText` is empty. *Lesson:* email HTML is a hostile document format — isolate it like one.

**6. Docker/deployment correctness.**
*Problem:* the image had to build with **zero secrets** and run Prisma correctly on any host. *Why hard:* a module-scope `throw` on missing `NEXTAUTH_SECRET` broke secretless builds (prerendered pages import the auth config); Prisma query engines are OS/libc-specific; stage ordering silently determines what a bare `docker build` produces. *Solution:* move secret reads to request time; `binaryTargets = ["native", "debian-openssl-3.0.x", "linux-arm64-openssl-3.0.x"]`; multi-stage build with the runner as the final (default) stage and a separate migrator target; verified by building with no env and booting the container against `/api/health`. *Lesson:* "builds without secrets" is a testable property — test it.

**7. Assistant state orchestration.**
*Problem:* one provider coordinates chat messages, draft lifecycle, typing animation, search results, live mail context, caching, and send transitions — across navigations. *Why hard:* stale-closure bugs and render loops lurk everywhere; the draft card must survive route changes; concurrent responses must supersede old drafts cleanly. *Solution:* refs mirror hot state for stable callbacks; a single status enum drives the draft card; supersede semantics instead of mutation; the provider mounted above the route. *Lesson:* explicit state ownership plus a status enum beats an ad-hoc web of booleans.

---

## 8. Things I Learned

- **React:** refs as escape hatches for stable event handlers (SSE listener reading current mailbox without reconnecting); context mounted above routes for cross-navigation state; status enums driving card UIs; `key={conversationId}` as a reset mechanism.
- **Next.js:** Server Components as the data layer (no client cache needed for reads); Server Actions as the single write path both humans and AI share; Route Handlers only where a fetchable boundary is genuinely required (LLM call, webhook, SSE); Next 16's middleware→`proxy.ts` rename; `output: "standalone"` and what actually gets traced into it.
- **TypeScript:** Zod schemas as the single source of truth with inferred types (`z.infer`) shared across client, API validation, and model-output validation; discriminated unions for action and draft types; `satisfies` for config objects.
- **Node:** hand-rolling MIME (RFC 2047/2822) and base64url without an SDK; `ReadableStream` for SSE with heartbeats and abort cleanup; `node:crypto` AES-256-GCM done correctly (random IV, auth tag, tamper rejection).
- **Architecture:** feature folders with a hard provider boundary; normalized domain models as the anti-corruption layer; deferring interfaces until the second implementation exists; in-process infrastructure as a legitimate, documented v1.
- **AI/LLMs:** small fast models are viable for UI control when the output space is closed; temperature 0.1 + `json_object` for determinism; models drift on date math and repetition — guard with grammar-level prompt rules *and* server-side checks.
- **Prompt engineering:** compressed action DSLs over raw JSON Schema for token economy; few-shot examples as literal JSON; explicit negative rules ("NEVER generate newer_than:1w"); prompt versioning tied to cache invalidation; verifying prompts against the live model as part of the change workflow.
- **OAuth:** authorization-code flow internals; refresh-token issuance semantics (`prompt=consent`); redirect-URI matching as env config, not code; the difference between session-based and sessionless (webhook) credential paths.
- **Security:** OIDC verification of Pub/Sub pushes; encrypting third-party credentials at rest; sandboxed-iframe email rendering without `allow-scripts`; keeping model input plain-text to shrink the injection surface; secretless image builds.
- **PostgreSQL/Prisma:** minimal schema design (one table doing exactly one job); `binaryTargets` and glibc/musl engine pitfalls; `migrate deploy` in a dedicated container stage; pooled Neon connections.
- **Testing:** `next/jest` setup; testing pure logic where bugs are cheapest (query builders, MIME/date/crypto edge cases, draft builders' guard clauses); a GCM tamper test as a security regression net; keeping the suite fast (~0.4s) so it's actually run.
- **Deployment:** multi-stage Docker with stage-ordering semantics; healthchecks with Node's built-in fetch; SSE behind proxies (`X-Accel-Buffering`, heartbeats, buffering); Render/Nginx env-driven configuration; debugging cloud config with boundary logs and provider metrics.
- **System design:** push-vs-poll trade-offs; history-cursor sync with gap recovery; fan-out topology; single-instance constraints stated honestly with the scaling path designed but not built.
- **Software engineering:** investigate-first workflow; smallest-change discipline; one-feature-per-commit; typecheck/lint/test/build as a gate on every change; documenting trade-offs at decision time.
- **Developer experience:** AI-assisted development with Claude Code as a daily driver — spec-first prompts, reviewed diffs, live verification scripts for LLM behavior.

---

## 9. Engineering Achievements

- **Built on real Gmail, zero mocks** — OAuth consent, real sends, real threads, real push notifications. Significant because integration pain (token expiry, MIME, history cursors, webhook auth) is exactly what mocked demos skip.
- **AI that drives the UI through a typed, bounded contract** — arguably the hardest part of the brief, solved with an architecture (schema + executor over shared Server Actions) rather than prompt hopes.
- **True push-based realtime** — a four-system pipeline (Gmail watch → Pub/Sub → OIDC webhook → SSE) with history-gap recovery and automated watch renewal. Most take-home projects poll.
- **Human-in-the-loop enforced by construction** — the model *cannot* send; it can only draft. Send requires explicit confirmation against an existing draft.
- **Security depth beyond assignment scope** — AES-256-GCM-encrypted refresh tokens (with a tamper test), OIDC-verified webhooks, sandboxed email rendering, secretless Docker builds, secret-protected cron.
- **Production deployment, verified** — live on Render from a multi-stage Dockerfile; image builds with no env vars and boots healthy; compose + Nginx config included for VPS deployment.
- **A fast, focused test suite** — 38 tests / 11 suites over the pure logic layer (query building, draft builders, MIME parsing, token crypto, formatting), running in under half a second.
- **Typed end-to-end** — one Zod schema family types the client, validates API input, and validates model output; domain models keep provider types quarantined.
- **Cost-conscious AI** — compressed prompts, packed context, trimmed history, versioned response caching; deliberate, measured token economy on every request.
- **Honest documentation** — README + ARCHITECTURE state what's built *and* what's deliberately deferred (single-instance hub, 1+N fetch, no provider interface), with reasons.

---

## 10. What This Project Demonstrates About Me

*As an interviewer reading this repo, I'd conclude:*

- **Architecture:** thinks in boundaries and contracts — the action schema, the domain layer, and state-ownership rules are all deliberate containment decisions, not accidents. Knows when *not* to abstract (no provider interface until a second provider exists).
- **Ownership:** carried one product from brief → architecture → implementation → tests → Docker → cloud deployment → production debugging (OAuth mismatches, Pub/Sub misconfiguration, SSE-through-proxy) — the full lifecycle, solo.
- **Code quality:** consistent feature-folder structure, small pure functions where it matters, guard clauses over defensive sprawl, meaningful naming, dead-code cleanup as an explicit pass.
- **Product thinking:** the typing animation, draft-as-confirmation, filter cards, focus mode, and toast/notification behavior show attention to how the feature *feels*, not just whether it works.
- **Documentation:** README and ARCHITECTURE are written for a reviewer — requirement-to-code traceability tables, mermaid diagrams for every major flow, and trade-offs recorded at decision time.
- **AI engineering:** treats prompts as versioned, tested artifacts; understands structured outputs, hallucination containment, token economics, and — most importantly — where LLM authority must end.
- **Frontend:** React 19 + App Router fluency, complex client orchestration (draft lifecycle, SSE, animation) without a state-management framework, accessibility-conscious primitives via Radix.
- **Backend:** hand-built MIME/OAuth/webhook/SSE plumbing over `fetch()` — comfort working *under* the SDK layer and debugging at protocol level.
- **System design:** a working event pipeline across four systems, with failure modes (history gaps, redelivery, expiry) handled and scaling limits stated with their designed remedies.
- **Engineering maturity:** ships the smallest correct thing, documents debt instead of hiding it, gates changes on typecheck/lint/test/build, and separates "deferred deliberately" from "missed."
- **Communication:** commit history reads as a feature narrative; docs distinguish as-built from aspiration; trade-offs are argued, not asserted.

---

## 11. Weaknesses (Brutally Honest)

**Technical debt that exists today:**
- `AssistantProvider` is a ~900-line client component doing orchestration, animation, caching, and send transitions — it needs splitting (acknowledged in ARCHITECTURE, still real debt).
- Mailbox loading is **1 + N** Gmail requests; past ~50 threads this is the first thing to break.
- The realtime hub and assistant response cache are **in-process** — a second instance breaks realtime delivery and forfeits cache hits. Fine for the assignment; documented; still a hard ceiling.
- Assistant context includes only the **latest message** of a thread (capped at 1,200 chars) — questions about earlier messages in a long thread can't be answered.
- NextAuth **v4** rather than Auth.js v5 — stable, but on the older major.
- Temporary realtime diagnostics (`[realtime] …` logs, committed in `aeac608`) are still in the code and should be stripped.
- Docs drift: README/ARCHITECTURE describe `forward_email` with a `body` payload field, but the implemented schema is `{threadId, to}` (the app builds the quoted body); ARCHITECTURE still mentions TanStack Query being "wired," which was removed in cleanup.

**Before open-sourcing:**
- Strip diagnostic logging; fix the doc drift above; add a LICENSE; secrets-scan git history (`.env` was never tracked, but verify); document the Google Cloud/Pub/Sub setup as a step-by-step; add CI (GitHub Actions running typecheck/lint/test/build); note the unverified OAuth app limitation prominently.

**With another month:**
- Redis pub/sub hub → horizontal scaling; batch the mailbox metadata fetch; rate-limit `/api/assistant`; header-injection hardening at the MIME layer; full-thread assistant context; streaming assistant responses; integration tests around the executor and an E2E smoke (Playwright); delete/archive/label actions; provider + LLM interfaces once a second of either exists; split `AssistantProvider`.

---

## 12. Resume Talking Points

- **One-liner:** "I built CommandMail — an AI-native Gmail client where the assistant *operates the UI* through typed, schema-validated actions: it fills the compose form, swaps the inbox for search results, opens threads, and drafts replies/forwards, all against real Gmail with push-based realtime sync."
- **Why:** a hiring brief ("build a mail app where the AI controls the UI") that I treated as a production exercise — real OAuth, real sends, real push, deployed live.
- **Hardest problem:** the realtime pipeline — Gmail `users.watch` → Pub/Sub OIDC push → history diffing → in-process fan-out → SSE. Debugging it in production meant instrumenting every boundary and using Pub/Sub metrics to find that a subscription was Pull instead of Push and OIDC env was missing — the browser symptom for every one of those failures is identical.
- **Favorite feature:** watching `compose_email` type into the real compose card field-by-field — the moment "AI controls the UI" becomes visceral rather than claimed.
- **Architecture decision I'd defend:** the assistant is a *second caller of the same Server Actions the buttons use* — bounded, auditable AI capability, and adding an action like `forward_email` was a schema entry + executor case + prompt rules, precisely because of that shape.
- **Trade-off I made consciously:** in-process realtime hub and response cache — smallest correct v1 for a single instance, with the Redis path designed and documented rather than built prematurely.
- **Lesson that transfers:** treat prompts like code (versioned, cache-keyed, tested against the live model) and never let the model be the source of truth for data the app already has — reply/forward drafts are built from the real conversation; the model only supplies intent.
- **Security story:** AES-256-GCM-encrypted refresh tokens (with a tamper-rejection test), OIDC-verified webhooks, sandboxed email HTML with no script execution, secretless Docker builds.
- **Numbers:** 7 typed actions; 38 unit tests / 11 suites (~0.4s); prompt version 7; 5-minute versioned response cache; 8-message history window; 1,200-char context cap; ~7-day watch expiry handled by automated renewal.

---

## 13. LinkedIn Content Ideas

### 20 engineering insights
1. The safest LLM integration is one where the model returns data and deterministic code does everything else.
2. Give your AI the same entry points as your buttons — never a private path to the backend.
3. A Zod discriminated union can be the entire contract between an LLM and your app.
4. Email HTML is a hostile document format — render it in a sandboxed iframe like you mean it.
5. The browser symptom for every broken realtime hop is identical: "nothing happens." Instrument boundaries, not vibes.
6. Push beats polling, but only if you respect webhook auth — verify the OIDC token before trusting a Pub/Sub payload.
7. `prompt: "consent"` is the difference between having a refresh token and having a support ticket.
8. Your Docker image should build with zero secrets — if it can't, you've coupled build time to runtime.
9. Prisma engines are OS-specific; `binaryTargets` is not optional once Docker is involved.
10. The last stage in a multi-stage Dockerfile is what a bare `docker build` produces — order is an API.
11. SSE through proxies needs three things: heartbeats, `X-Accel-Buffering: no`, and patience.
12. Store third-party refresh tokens like passwords: AES-256-GCM, random IV, and a tamper test in CI.
13. `history.list` is a cursor, and cursors have gaps — handle the 404 baseline reset or lose sync silently.
14. Reads in Server Components + writes in Server Actions ≈ an entire client data layer you don't have to build.
15. URLs are the best state manager nobody uses: `?thread=` made threads shareable, reload-safe, and back-button-correct for free.
16. When the current user sent the last message, "reply" means the recipient — recipient selection is a real algorithm, not `.sender`.
17. HTML-only emails have no `text/plain` part; if your AI reads only `bodyText`, it's blind to half the inbox.
18. A fast test suite is a used test suite — 38 tests in 0.4s means they run on every change.
19. `Promise.allSettled` for fan-out fetches: one bad thread shouldn't kill a mailbox.
20. Hand-rolling MIME once teaches you more about email than any SDK ever will.

### 20 lessons learned
1. Prompt changes are code changes — version them and let the version key your cache.
2. Test prompts against the live model before shipping; unit tests can't catch drift.
3. Small models follow closed action grammars surprisingly well at temperature 0.1.
4. Write the negative rules: "NEVER generate `newer_than:1w`" fixed what examples couldn't.
5. "Thanks" is not a command — models re-run the last action on acknowledgements unless you forbid it twice (prompt + server guard).
6. Never let the model restate facts the app already has; build drafts from ground truth and let the model supply intent.
7. Debugging distributed config means finding the first missing log line, not rereading correct code.
8. Pub/Sub Pull vs Push is a one-dropdown mistake that silently kills your webhook.
9. Missing env vars should fail loudly at the point of use — a silent 401 cost a debugging session.
10. Module-scope `throw` on missing env breaks builds in ways that only show up in Docker.
11. Verify "builds without secrets" by actually building without secrets.
12. The visible draft is a better confirmation dialog than a confirmation dialog.
13. Time-box typing animations by field, not by character — long bodies shouldn't mean long waits.
14. Dark mode breaks email rendering unless emails keep their own white world — isolate, don't restyle.
15. Auto-scroll to the *top* of tall result cards; the bottom of a 44-row list is not a UX.
16. Watches expire in 7 days; realtime without automated renewal is a demo, not a feature.
17. Defer interfaces until the second implementation exists — you'll design the wrong one from a sample size of one.
18. Documenting a limitation honestly ("single-instance hub") reads better than hiding it.
19. Cleanup is a feature: dead deps, dead exports, and empty folders are debt with interest.
20. AI pair programming works best spec-first: investigate, present, then implement the smallest change.

### 20 architecture observations
1. Two ideas carried the whole system: "the assistant is a caller, not an actor" and "Gmail is an integration, not the product."
2. Feature folders with a hard provider boundary make the blast radius of an API change one directory.
3. Normalized domain models are an anti-corruption layer — the UI never sees a Gmail shape.
4. The AI uses the same domain models as the UI; there is no "AI-shaped" parallel model.
5. Every piece of state has exactly one owner: URL, Server Component, context, or local state — never two.
6. The assistant provider mounts above the route so a draft survives navigation.
7. Seven verbs bound the entire AI capability surface — auditable in one file.
8. Adding an AI capability = schema entry + executor case + prompt rules; the architecture makes features mechanical.
9. Reads have no API routes at all; the only fetchable endpoints are the ones that genuinely need a boundary (LLM, webhook, SSE).
10. The webhook path is sessionless by design — which is exactly why refresh tokens live encrypted in the DB.
11. An in-process hub is a legitimate v1 when the scaling path is designed and documented.
12. Draft lifecycle as a status enum (preparing → typing → draft → sending → sent/failed) replaced a dozen booleans.
13. Supersede, don't mutate: new drafts mark old ones superseded, preserving chat history truthfully.
14. The response cache keys on prompt version + context hash — cache invalidation done by construction.
15. Focus Mode is a presentation mode of the same component, not a route — `mode` props over duplicated views.
16. `proxy.ts` (Next 16 middleware) does route guarding only; auth decisions stay server-side.
17. One Prisma table doing one job (`GmailSync`) is a schema decision, not an accident.
18. The migrator is its own Docker stage — the runtime image can't run migrations, on purpose.
19. Compose binds the app to loopback; only Nginx faces the network.
20. The mermaid diagrams in ARCHITECTURE.md are the same shape as the code — docs that mirror structure stay true longer.

### 20 interesting technical decisions
1. Gmail REST via plain `fetch()` — no `googleapis` SDK, keeping the dependency surface tiny.
2. RFC 2047 base64 subject encoding hand-implemented for non-ASCII subjects.
3. `In-Reply-To`/`References` chained manually so Gmail threads replies correctly.
4. Inclusive date-range search: `before: startOfDay(dateTo) + 86400` so the end date counts.
5. `format=full` conversation fetch keeps both `bodyHtml` and `bodyText` — render one, reason over the other.
6. DOMPurify configured to *keep* `<style>` (layout survives) while forbidding scripts/forms/iframes.
7. Sandboxed iframe without `allow-scripts` + auto-height measurement after image loads.
8. `<base target="_blank">` injected into email frames so every link opens safely.
9. `htmlToPlainText` fallback so HTML-only emails are visible to the assistant.
10. Draft builders return `null` unless the thread is the open conversation — a guard against acting on stale context.
11. `Fwd:`/`Re:` prefix dedup handled in the builders, not the prompt.
12. Client-side open-intent heuristic (`/^\s*open\b/i`) bridges a model gap without a prompt rewrite.
13. Acknowledgement short-circuit on the server forces `actions: []` for "ok/thanks" — belt and suspenders.
14. Response cache is per-tab and 5 minutes — matching a demo/session usage pattern, not a CDN's.
15. History trimmed to 8 messages: enough context for revisions, bounded token cost.
16. Watch renewal as a secret-protected GET — trivially schedulable from any cron provider.
17. `updateHistoryId` after publish, not before — at-least-once delivery over silent loss.
18. Non-root Docker user + healthcheck using Node's built-in fetch (no curl in the image).
19. `.dockerignore` excludes all `.env*` — secrets can't enter the build context even by accident.
20. Typing animation durations are per-field constants (700/600/1200ms) — a designed rhythm, not a side effect.

### 20 AI engineering takeaways
1. Structured output (`json_object`) + Zod turns an LLM from a text generator into a typed function.
2. Fixed action vocabularies beat open tool-calling when safety matters more than generality.
3. `thought` + `actions[]` cleanly separates what the user reads from what the app executes.
4. Validate model output at the boundary and degrade to a safe fallback — never throw on a bad generation.
5. Hallucinated ids are harmless when there's no lookup path that resolves them.
6. Context serialization is prompt engineering: packed `key="value"` lines cost fewer tokens than pretty JSON.
7. Cap context bodies (1,200 chars here) — most questions need the gist, not the transcript.
8. Send the model plain text, never raw HTML — smaller prompts and a smaller injection surface.
9. Date math is where small models die; give them exact epoch values and a closed relative-date grammar.
10. Few-shot examples as literal JSON responses anchor format better than schema descriptions.
11. Human-in-the-loop should be structural (model *can't* send) rather than behavioral (model *shouldn't* send).
12. Distinguish acknowledgements from commands or your model will re-run its last action on "thanks."
13. Draft revision is a first-class flow: `hasActiveDraft` context + full-payload re-emission.
14. Prompt versioning tied to cache keys means a prompt fix invalidates stale cached behavior automatically.
15. Temperature 0.1 for UI control; creativity is a liability when the output is an instruction.
16. A 17B model on fast inference beats a frontier model for sub-second UI-control loops — latency is UX.
17. Verify LLM behavior with live scripts against the real prompt before merging prompt changes.
18. The model supplies intent; the app supplies facts — quoted forward bodies come from the conversation, never the model.
19. LLM cost control is an engineering discipline: compressed specs, packed context, trimmed history, cached responses.
20. "AI controls the UI" is an architecture problem first and a prompt problem second.

---

*Generated from repository analysis — README.md, ARCHITECTURE.md, and the full source tree. Verified against the code: 7 actions in `assistant-action.ts`, `PROMPT_VERSION = "7"`, 11 Jest suites / 38 tests, AES-256-GCM in `token-crypto.ts`, and the realtime pipeline across `gmail-watch.ts` → `push/route.ts` → `inbox-hub.ts` → `stream/route.ts` → `use-inbox-live-sync.ts`.*

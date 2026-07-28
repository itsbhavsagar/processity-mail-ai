# COMMANDMAIL_DEEP_DIVE.md — The Technical Reference

*Every fact here is verified against the repo. Numbers you must know cold are **bold**. File paths are exact — when Peter says "show me," these are the files you open.*

---

## 1. The numbers (recite these)

- **7** assistant actions: `compose_email`, `send_email`, `search_emails`, `open_email`, `reply_email`, `forward_email`, `navigate_mailbox`
- Model: Groq **`openai/gpt-oss-120b`**, temperature **0.1**, `response_format: json_object`
- **PROMPT_VERSION = 7** — keys the response cache
- Response cache: **5 minutes**, per tab, key = hash(version + normalized prompt + serialized context)
- History window: last **8** messages. Conversation body cap: **1,200 chars**
- Typing animation: to **700ms** / subject **600ms** / body **1,200ms** — time-boxed per field, not per character
- SSE heartbeat: **25s**. Gmail watch expiry: **~7 days**, renewed daily within a 24h window
- Tests: **38** across **11** suites, ~0.4s runtime
- Crypto: **AES-256-GCM**, 12-byte random IV, 16-byte auth tag, packed `iv‖tag‖ciphertext` base64
- Stack: Next.js 16 (App Router), React 19, TypeScript, NextAuth v4, Prisma + PostgreSQL (Neon), Docker multi-stage, deployed on Render

## 2. Architecture in one paragraph

Two ideas do all the work. **The assistant is a caller, not an actor:** the model outputs a `thought` plus typed actions from a fixed Zod schema; a deterministic executor dispatches them through the same Server Actions the buttons use — the model decides *what*, the app owns *how*. **Gmail is an integration, not the product:** UI code only ever sees domain models (`MailThread`, `MailConversation`, `MailMessage`, drafts); Gmail's shapes stay inside `features/gmail/` behind mappers. Everything else — folder layout, state ownership, security posture — falls out of those two.

## 3. React & Next.js layer

- **Reads = Server Components.** `InboxWorkspace` (server) does `getServerSession` → `listThreads(accessToken, mailbox)` → renders. No API routes for reads, no client mail cache. Data updates arrive by `router.refresh()` re-running the Server Component.
- **Writes = Server Actions.** `sendEmail`, `sendReplyEmail`, `searchMailThreads`, `markThreadRead` in `features/mail/actions/`. Each re-checks the session server-side. This is the single write path shared by humans and AI — the convergence point of the whole design.
- **Route handlers only where a fetchable boundary is required:** `/api/assistant` (LLM call), `/api/auth/[...nextauth]`, `/api/gmail/push` (webhook), `/api/gmail/stream` (SSE), `/api/gmail/renew-watch` (cron), `/api/health` (Docker).
- **State ownership:** URL owns `?thread=` + mailbox (shareable, reload-safe). `AssistantProvider` (mounted in the layout, above pages) owns chat history, active draft, search results — survives navigation, dies on reload, deliberately. Local `useState` for focus mode and dialogs. JWT for session. No global store; React Query was wired early, unused, and deleted in cleanup.
- **`src/proxy.ts`** = Next 16's middleware (renamed from `middleware.ts`). Route guard only: `/app` needs a token, `/login` bounces authenticated users. Uses `getToken` (edge-safe, no Prisma import).
- Known drift to own if asked: ARCHITECTURE.md still mentions TanStack Query being wired; it was removed.

## 4. The AI pipeline, step by step

1. **Context build** (`features/assistant/lib/build-assistant-context.ts`): current mailbox; open conversation — threadId, sender, recipients, cc, date, body (latest message only, 1,200-char cap, **falls back to `htmlToPlainText(bodyHtml)` when the email has no text/plain part** — that fallback was a real bug fix); active draft; up to 5 prior search results; today's epoch precomputed (models can't do date math).
2. **Cache check** (`assistant-response-cache.ts`): hash(PROMPT_VERSION + lowercased prompt + serialized context). Context in the key means a changed mailbox/draft/results naturally misses. 5-min TTL, in-memory, per tab.
3. **Prompt build** (`assistant-system-prompt.ts`): compressed action list (`reply_email(threadId,body)` — shorthand, not JSON Schema); per-action rule blocks with explicit MUST/NEVER lines (every rule traces to an observed failure); packed `key="value"` context lines; few-shot examples as literal JSON.
4. **Groq call** (`assistant-service.ts`): temp 0.1, JSON mode. Server-side guard: a bare acknowledgement ("ok", "thanks"…) short-circuits to a friendly reply with `actions: []` regardless of what the model said.
5. **Validation** (`assistant-action.ts`): Zod discriminated union over the whole response. Invalid → safe fallback that salvages the `thought` string when possible. Never throws to the user.
6. **Execution** (`executor/execute-assistant-action.ts`): sequential switch dispatching to the same handlers the UI uses.

**Hallucination containment:** threadIds restricted to seen context by prompt AND by structure — `open_email` only navigates within current results; reply/forward builders return `null` unless the id equals the open conversation. **Ground truth rule:** the model never restates data the app has. Reply/forward drafts are built client-side from the real conversation (`build-reply-draft.ts`, `build-forward-draft.ts`); the model supplies intent only. `forward_email`'s payload is **`{threadId, to}`** — no body from the model (README drifted on this; own it).

**Human-in-the-loop:** compose/reply/forward can only produce a draft (status machine: preparing → typing_* → draft → sending → sent/failed, with supersede semantics for stale drafts). `send_email` requires an existing complete draft (`canSendDraft`) + explicit confirmation phrases; acknowledgements are excluded in prompt and server guard.

## 5. Gmail integration

- **Service** (`features/gmail/services/gmail-service.ts`): plain `fetch()` to `gmail.googleapis.com` — no SDK. Public surface: `listThreads`, `searchThreads`, `getConversation`, `markThreadAsRead`, `sendMail`, `sendReplyMail`, `getProfile`, `watchMailbox`, `listHistory`, `getMessageMetadata`.
- **Mailbox load:** `threads.list` + one metadata fetch per thread under `Promise.allSettled` (one bad thread can't kill the mailbox). Known cost: **1+N** — first thing to batch at scale.
- **Bodies** (`mappers/extract-message-body.ts`): recursive MIME-part walk, base64url decode, keeps both html and text.
- **MIME building** (`mappers/build-mime-message.ts`): hand-built RFC 822; **RFC 2047** base64 encoding for non-ASCII subjects; base64url for the API. Replies add **`In-Reply-To` + `References`** chained from the latest message's RFC ids — that's the entirety of Gmail threading.
- **Reply recipient algorithm** (`build-reply-draft.ts`): reply to the latest message's sender, unless that sender is the current user — then its first recipient. `Re:`/`Fwd:` prefixes deduped case-insensitively.
- **Search:** raw Gmail `q=`; `build-gmail-query.ts` maps structured filters — sender, is:read/unread, `after:` epoch, and an **inclusive** end date via `before: startOfDay(dateTo)+86400`.

## 6. OAuth & tokens

- NextAuth v4, Google provider, scope `gmail.modify`, `access_type: "offline"`, **`prompt: "consent"`** (forces refresh-token issuance every sign-in).
- **JWT strategy.** `jwt` callback: on sign-in stores `accessToken`/`refreshToken`/`accessTokenExpires`; on each read returns cached token until expiry, then POSTs `oauth2.googleapis.com/token` to refresh (preserving the refresh token unless Google rotates it); failure → `session.error = "RefreshAccessTokenError"`.
- **Two credential paths, one reason:** webhooks have no cookie. Interactive requests use the JWT. The Pub/Sub webhook loads the user's `GmailSync` row, decrypts the stored refresh token, and mints an access token on demand (`getAccessTokenFromRefreshToken`).
- **Encryption at rest** (`features/gmail/server/token-crypto.ts`): AES-256-GCM. `encrypt`: random 12-byte IV → cipher → 16-byte auth tag → base64(iv‖tag‖ct). Key = base64 32-byte env `TOKEN_ENCRYPTION_KEY`, length-validated. Tests: round-trip, IV uniqueness (same plaintext ≠ same ciphertext), missing/short key throws, **flipped ciphertext byte rejected** (the GCM tamper test).
- `redirect_uri_mismatch` mechanics: NextAuth derives `${NEXTAUTH_URL}/api/auth/callback/google`; Google string-matches registered URIs. Same code everywhere; env differs.

## 7. Realtime pipeline

```
signIn event → users.watch(INBOX → Pub/Sub topic)
new mail → Gmail publishes {emailAddress, historyId}
→ Pub/Sub PUSH subscription POSTs /api/gmail/push (OIDC bearer)
→ verifyIdToken: audience === GMAIL_PUSH_AUDIENCE, signer === GMAIL_PUSH_SA_EMAIL, else 401
→ load GmailSync row → decrypt refresh token → mint access token
→ history.list from stored historyId cursor
→ newest added message → getMessageMetadata → updateHistoryId
→ publish(email, {type:"inbox-changed", threadId, sender, subject}) → in-process hub
→ /api/gmail/stream SSE (one per tab, 25s heartbeat) fans out
→ client EventSource → router.refresh() + toast + Notification (if tab hidden)
```

- **Hub** (`server/realtime/inbox-hub.ts`): `Map<email, Set<listener>>`. **Single-instance assumption — the one hard scaling blocker.** Fix = Redis pub/sub; the hub's publish/subscribe API is already adapter-shaped.
- **Webhook edge cases:** no stored baseline → adopt incoming historyId, wait for next change. `history.list` 404 (cursor too old) → reset baseline from `getProfile()`, ack. Unknown mailbox → 204 (stop redelivery). Transient failure → 500 (Pub/Sub retries with backoff).
- **Duplicate/out-of-order delivery:** benign — events are refresh *hints*, not deltas; worst case is an extra refresh. That semantic choice was deliberate.
- **SSE details:** `X-Accel-Buffering: no` + padding flush for proxies; cleanup bound to `request.signal` abort; EventSource auto-reconnects (half the reason SSE beat WebSockets).
- **Renewal** (`/api/gmail/renew-watch`): `CRON_SECRET` bearer; re-registers watches expiring within 24h; reports renewed/skipped/failed. Failure mode: that user silently degrades to manual refresh — known gap: no alerting.
- **GCP config that burned me (know it cold):** the subscription must be **Push** (not Pull), endpoint = exact webhook URL, OIDC enabled with a **user-managed** service account (its email = `GMAIL_PUSH_SA_EMAIL`), audience = the URL (= `GMAIL_PUSH_AUDIENCE`); `gmail-api-push@system.gserviceaccount.com` needs Pub/Sub Publisher on the topic; the Pub/Sub service agent needs Token Creator on the SA.

## 8. Security model

1. **Bounded assistant:** seven schema-validated actions; no free-form path; executor isn't the security boundary — **Server Actions re-checking sessions are**. The executor protects the user from the model; the actions protect the server from any client.
2. **Tokens:** never in the browser; JWT server-side; refresh token AES-256-GCM at rest.
3. **Webhook:** OIDC-verified before any processing.
4. **Email rendering** (`email-html-frame.tsx`): DOMPurify (keeps `<style>`, strips scripts/forms/embeds/handlers) → sandboxed iframe via `srcDoc` with **no `allow-scripts`**, auto-height measured after image loads, `<base target="_blank">`, no-referrer. Two independent layers; total CSS isolation both directions.
5. **Model input:** plain text only (html-to-text), shrinking the injection surface.
6. **Known-open:** provenance marking for email-derived text in prompts; rate limiting on `/api/assistant`; MIME header-injection hardening; key rotation. Name these before he does.

## 9. Database & Prisma

- One table: **`GmailSync`** — email (pk), googleSub (unique), refreshTokenEnc, historyId, watchExpiration, timestamps. One table doing exactly one job: per-user sync state + encrypted credential for the sessionless path.
- Sessions are JWT — no session table on purpose (trade-off: no server-side revocation).
- **`binaryTargets = ["native", "debian-openssl-3.0.x", "linux-arm64-openssl-3.0.x"]`** — Prisma's query engine is a native per-OS/libc binary; generate on macOS and run on Debian fails without this. Engines verified present in the image.
- Migrations: `prisma migrate deploy` via the dedicated Docker **migrator** stage (`docker compose run --rm migrate`).

## 10. Docker & deployment

- **Stages:** `base` (node:22-bookworm-slim + openssl/ca-certs; Debian over Alpine because Prisma on musl is pain) → `deps` (`npm ci`, schema copied first so postinstall generate finds it) → `builder` (`prisma generate` on the image's OS + `next build`, standalone output) → `migrator` (Prisma CLI + schema, `migrate deploy`) → **`runner` last** (standalone server + `.next/static` + `public` + Prisma engine; non-root user; `HEALTHCHECK` via Node's built-in fetch on `/api/health`; `CMD node server.js`).
- **Stage order is API:** a bare `docker build` builds the **last** stage. Learned by shipping the migrator as the default image once — container applied zero migrations and exited.
- **Secretless build:** zero env at build time. The one violation was a module-scope `throw` on missing `NEXTAUTH_SECRET` in auth config — imported by prerendered pages, so it executed during `next build`. Moved to request-time read. Verified by building with no env and booting the container.
- Compose: app bound to `127.0.0.1:3000` behind Nginx (config in `deploy/nginx/` — SSE location gets `proxy_buffering off`); `migrate` service under a `tools` profile. Deployed on **Render** (not AWS — be upfront).

## 11. Testing

- Jest 30 via `next/jest` (SWC transform, node environment, `tests/` mirroring `src/`).
- Covered: `build-gmail-query` (ordering, operators, inclusive end date, epoch math), reply/forward builders (guards, dedup, recipient edge cases), `token-crypto` (round-trip, IV uniqueness, key validation, tamper rejection), `parse-mailbox` (quoted commas, `Name <email>`), `compose-send` FormData mapping, `assistant-message-utils` (`canSendDraft`, status→API-content mapping, supersede), `html-to-text`, `format-recipients`, `mailbox-url`, `sender-avatar`.
- Deliberately untested: components/framework, thin I/O services, date-dependent modules (would need fake timers) — documented as chosen. First E2E to add: Playwright smoke of login → inbox → compose → send.

## 12. Trade-offs table (the "when am I wrong" answers)

| Choice | Cost accepted | When the alternative wins |
|---|---|---|
| Typed actions vs tool-calling | every capability needs code | autonomy products where the AI must exceed the UI |
| Server Components vs client cache | no optimistic updates; refetch per nav | heavy interactive mutation UX, offline |
| In-process hub vs Redis | single instance only | the moment there are two instances |
| SSE vs WebSockets | one-way only | bidirectional features (typing indicators, collab) |
| Small fast model vs frontier | more guard code | nuanced generation where latency matters less |
| JWT vs DB sessions | no revocation | enterprise/multi-device session control |
| No provider interface | direct Gmail coupling inside one folder | the day Outlook is real |
| Hand-rolled MIME vs SDK | I own the encoding bugs | broad API surface usage beyond ~8 endpoints |

## 13. Future improvements (say them before he asks)

Redis hub → horizontal scale. Batch the 1+N mailbox fetch (elegant: the push pipeline already knows what changed — cache + invalidate from it). Rate-limit `/api/assistant`. Full-thread assistant context under a token budget. Provenance marking for email-derived prompt text. Split `AssistantProvider` (orchestration / animation / context wiring). Streaming assistant responses. Playwright smoke. Delete/archive/label actions. Provider + LLM interfaces when a second of either exists.

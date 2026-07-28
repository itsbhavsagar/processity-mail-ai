# LESSONS_LEARNED.md — What CommandMail Actually Taught Me

*Short lines on purpose. Each one is a lesson I can expand into a story if asked — nothing here is decoration.*

## React
- Refs are the escape hatch for stable event handlers. My SSE listener reads the current mailbox through a ref — no reconnect on every navigation.
- Context mounted above the route = state that survives navigation. That's why the draft lives through page changes.
- A status enum (preparing → typing → draft → sending → sent/failed) beats a pile of booleans. Every card render decision reads from one field.
- `key={conversationId}` is a legitimate reset button.
- Supersede, don't mutate. Old drafts get marked superseded — the chat history stays truthful.

## Next.js
- Server Components can *be* the data layer. I deleted React Query because nothing used it.
- Reads in Server Components, writes in Server Actions = one auth boundary, tokens never in the browser.
- `router.refresh()` re-renders truth. With realtime push, that's the whole client update story.
- Module scope is build time for anything a prerendered page imports. That's how a runtime secret broke my Docker build.
- Route handlers only where you genuinely need a fetchable boundary: LLM call, webhook, SSE, health.
- Next 16 renamed middleware to `proxy.ts`. Keep it to route guarding.

## Node
- Hand-rolling MIME demystifies email permanently. RFC 2047 subjects, base64url, header order.
- `ReadableStream` + heartbeat + abort-signal cleanup is all an SSE endpoint needs.
- `Promise.allSettled` for fan-out — one bad thread must not kill the mailbox.
- Plain `fetch` beats an SDK when you use eight endpoints.

## TypeScript
- One Zod schema family can type the client, validate the API, and validate the model. Single source of truth, inferred types everywhere.
- Discriminated unions are the right shape for actions, drafts, and rich content. The switch statement becomes the architecture.
- `satisfies` for config objects — checked without widening.

## Docker
- A bare `docker build` builds the LAST stage. Stage order is API.
- The image must build with zero secrets — and that's testable. Test it.
- Debian slim over Alpine when Prisma is involved. glibc vs musl is real.
- Separate migrator stage: the runtime image shouldn't carry migration tooling.
- Healthcheck with Node's built-in fetch — no curl in the image.

## OAuth
- `prompt: "consent"` is the difference between having a refresh token and not.
- redirect_uri_mismatch is string equality. Find the two strings.
- Map every code path that needs credentials BEFORE choosing token custody. Webhooks have no cookie — that's why the refresh token lives encrypted in the DB.
- Refresh-token rotation: preserve the old one unless the provider issues a new one.

## AI / LLMs
- The model decides *what*. The app owns *how*. Everything safe about my design comes from that split.
- Structured output = JSON mode + few-shot literal examples + Zod at the boundary. Never trust, always validate, degrade gracefully.
- Small fast model + guards beats big slow model for UI control. Latency is the product.
- Models can't do date math. Give them precomputed values.
- Hallucinations should resolve to no-ops by construction, not by luck.
- When the model acts dumb, audit its input first. Mine was blind to HTML-only emails — the prompt was innocent.
- The model must never restate facts the app already has. Forward bodies come from the real conversation.

## Prompt Engineering
- Prompts are code: versioned (v7), cache-keyed by version, tested against the live model before shipping.
- Negative rules ("NEVER generate newer_than:1w") outperform positive examples on small models.
- Every prompt rule should trace to an observed failure. That keeps prompts small and honest.
- Compression is engineering: shorthand action syntax, packed key=value context, 8-message history, 1200-char body caps.
- Acknowledgements ("thanks") get re-interpreted as commands. Guard in the prompt AND in code.

## Security
- Encrypt stored credentials like the DB is already leaked. AES-256-GCM, random IV, and a tamper test.
- GCM over CBC because tampering must fail loudly.
- Verify webhooks cryptographically (OIDC audience + signer) before reading the payload.
- Untrusted HTML gets an iframe without allow-scripts, not just a sanitizer. Two layers.
- The executor protects the user from the model. Server Actions re-checking sessions protect the server from everyone. Know which boundary is which.
- Feed models plain text, not HTML — smaller injection surface.

## PostgreSQL / Prisma
- One table doing one job is a design decision, not laziness.
- `binaryTargets` or the engine won't load in Docker. Verify the .so files in the image.
- `migrate deploy` in production, `migrate dev` locally — and migrations run from a dedicated container, not the app.

## System Design
- Push beats polling when a provider offers it — cost scales with events, not users.
- Events as hints ("something changed") instead of deltas made duplicates and reordering benign. Choose event semantics to dodge consistency problems.
- Cursor-based sync needs gap recovery (the history 404 → baseline reset).
- In-process infrastructure is a legitimate v1 when the scaling path is designed and *written down*.
- SSE vs WebSockets: match the primitive to the actual data direction.

## Deployment
- "Works locally" is a statement about your laptop.
- Debug distributed config by instrumenting boundaries; the first missing log line names the broken hop.
- Provider consoles (Pub/Sub metrics) are ground truth the browser can't give you.
- Don't stop at the first root cause. My realtime outage had two.
- Silent 401s on missing env are a design smell. Fail loudly at point of use.

## Architecture
- Two sentences can carry a whole system: "the assistant is a caller, not an actor" and "Gmail is an integration, not the product."
- Anti-corruption layers pay rent immediately — every Gmail weirdness has one home.
- Don't extract an interface from one implementation. Wait for the second.
- When adding a feature is schema entry + executor case + prompt rules, the architecture is working. Forward proved it.
- Name your debt precisely (900-line provider, 1+N fetch, single-instance hub). Vague debt is unmanaged debt.

## Communication / Engineering Practice
- Write docs that admit what's deferred. "Single-instance only, here's the fix" reads stronger than silence.
- Investigate first, present, then implement the smallest change. Every time I skipped that, I paid.
- Typecheck + lint + tests + build gate every change. Cheap discipline, compounding returns.
- One feature per commit — the git log becomes the project story.
- AI-assisted development is a review discipline, not a shortcut: spec first, review every diff, never merge what you can't defend.
- Being wrong out loud (my SSE buffering theory) costs nothing and builds trust.

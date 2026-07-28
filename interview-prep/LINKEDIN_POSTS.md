# LINKEDIN_POSTS.md — 15 Posts, One Real Lesson Each

*Rules followed: every post is grounded in a real file and a real event from CommandMail. No invented drama. Plain voice, short lines. Post 1–2 per week, not all at once. Screenshot tips assume the repo is public by then — crop to ~15 lines of code max, dark theme, readable font.*

---

## Post 1 — The AI can't do anything a mouse click can't

**Post:**
I built a Gmail client where the AI controls the UI.
The first design I rejected: giving the model its own tools — a sendEmail() function it can call.
Why? Emails are attacker-controlled input. They flow into the model's context.
If the model has a private path to Gmail, a malicious email can steer it.
So I inverted it. The model outputs typed JSON actions. Seven verbs. Validated with Zod.
A small executor runs them through the same Server Actions the buttons use.
Worst case, the AI does what a mouse click could do. Nothing more.
Prompts are not a security boundary. Code is.

**Screenshot:** the Zod discriminated union in `src/features/assistant/types/assistant-action.ts` (the seven action schemas).
**Recruiters notice:** "AI + security" in one project.
**Founders notice:** you think about what AI features can *cost* them.
**Senior engineers notice:** the trust-model framing; "prompts are not a security boundary."
**Interview questions this creates:** Isn't that just tool-calling with extra steps? When is your design wrong? How does the executor differ from function calling?
**Hashtags:** #AIEngineering #LLM #TypeScript #WebSecurity

---

## Post 2 — Treat prompts like code. Version them.

**Post:**
My system prompt is on version 7.
Not because I like rewriting it. Because every version fixed an observed failure.
The trick that made it manageable: PROMPT_VERSION is part of my response-cache key.
Change the prompt → every cached response invalidates automatically.
No stale behavior surviving a fix.
Before any prompt change ships, a script runs it against the live model with fixture contexts.
Prompts drift. Treat them like code: versioned, tested, reviewed.

**Screenshot:** `PROMPT_VERSION = "7"` plus the cache-key function in `src/features/assistant/lib/assistant-response-cache.ts`.
**Recruiters notice:** "prompt engineering" backed by process, not vibes.
**Founders notice:** discipline that prevents silent AI regressions in production.
**Senior engineers notice:** cache invalidation by construction.
**Interview questions:** How do you eval prompt changes? What broke between v1 and v7? Why cache LLM responses at all?
**Hashtags:** #PromptEngineering #LLM #AIProducts

---

## Post 3 — Never let an LLM do date math

**Post:**
"Show me yesterday's emails."
My model translated that to newer_than:1w. Weeks don't exist in Gmail search syntax.
Another time it recomputed "today" and got the timezone wrong.
The fix wasn't a smarter model. It was refusing to let the model calculate.
The context now includes a precomputed epoch for today. The model must copy it, never compute it.
Relative dates have exact templates. And every illegal shape I observed has an explicit NEVER line in the prompt.
LLMs are language models, not calendars. Give them values, not math.

**Screenshot:** the date-grammar block in `src/features/assistant/lib/assistant-system-prompt.ts` (the MUST/NEVER lines).
**Recruiters notice:** concrete LLM production experience.
**Founders notice:** you've hit real model failures and shipped through them.
**Senior engineers notice:** deterministic values injected into context; negative examples.
**Interview questions:** What else can't models do reliably? How did you find these failures? How do you regression-test prompts?
**Hashtags:** #LLM #PromptEngineering #GmailAPI

---

## Post 4 — The bug where Google never called my server

**Post:**
Deployed my mail app. Everything worked except real-time sync.
New emails only showed after a manual refresh.
The pipeline: Gmail watch → Pub/Sub → my webhook → SSE → browser.
Every failure in that chain looks identical from the browser: nothing happens.
So I tested hop by hop. Fetched the SSE stream raw from the console — healthy.
Checked the deploy env — two OIDC variables missing. My webhook was 401-ing every push. Fixed.
Still dead.
Then I opened the Pub/Sub console. The subscription was created as PULL.
Google was never calling my endpoint at all.
Recreated it as an authenticated Push subscription. Live sync came alive.
Lesson: instrument boundaries. The first missing log line names the broken hop.

**Screenshot:** the OIDC verification block in `src/app/api/gmail/push/route.ts`.
**Recruiters notice:** production debugging, not just building.
**Founders notice:** exactly the person you want during a client-launch fire.
**Senior engineers notice:** systematic elimination; provider metrics as ground truth.
**Interview questions:** How do you debug distributed systems? Why OIDC on the webhook? What did you change so it's found faster next time?
**Hashtags:** #Debugging #PubSub #GCP #DistributedSystems

---

## Post 5 — Docker stage order is part of your API

**Post:**
Ran docker build. Ran the container. It connected to the database, said "no pending migrations," and exited.
No server. Empty docker ps.
The cause: a bare docker build targets the LAST stage of a multi-stage Dockerfile.
My last stage was the migration job, not the app.
The image was a migration runner wearing the app's tag.
Fix: the runnable app is now the final stage; the migrator is an explicit --target.
Convention worth adopting: a plain docker build must always produce the thing you run.

**Screenshot:** the stage headers of the `Dockerfile` (base → deps → builder → migrator → runner) with the ordering comment.
**Recruiters notice:** real Docker experience beyond "I wrote a Dockerfile."
**Founders notice:** you catch deployment footguns before they hit users.
**Senior engineers notice:** the "stage order is API" framing.
**Interview questions:** Walk me through your stages. Why a separate migrator? Why Debian over Alpine?
**Hashtags:** #Docker #DevOps #Deployment

---

## Post 6 — Your Docker image should build with zero secrets

**Post:**
My Next.js build kept failing in Docker: NEXTAUTH_SECRET is not configured.
But builds shouldn't need production secrets at all.
The culprit: a module-scope throw in my auth config.
Next prerenders pages at build time. Those pages import the auth config. Module scope IS build time.
Fix: read the env at request time. The secret's absence should fail at runtime — where the secret belongs.
Then I proved it: built the image from a bare checkout with zero env vars, booted it, hit the health check.
"Builds without secrets" is a testable property. Test it.

**Screenshot:** the request-time secret read + comment in `src/features/auth/server/auth-config.ts`.
**Recruiters notice:** security awareness in CI/CD.
**Founders notice:** your secrets won't end up baked into image layers.
**Senior engineers notice:** the module-scope-equals-build-time insight.
**Interview questions:** How do secrets leak into images? What else runs at build time in Next? How did you verify?
**Hashtags:** #NextJS #Docker #Security

---

## Post 7 — Render email HTML like it's hostile. Because it is.

**Post:**
Real emails looked terrible in my mail app. Flat text. Broken layouts. Invisible in dark mode.
The cause: I was injecting email HTML into my page.
My Tailwind reset flattened their tables. My text colors overrode theirs. My sanitizer stripped their style tags.
And dark mode? Emails assume a white world. Their dark text vanished on my dark background.
The fix is what Gmail does: every message renders in a sandboxed iframe.
Own document. Own CSS. DOMPurify keeps styles but strips scripts. No allow-scripts in the sandbox.
Auto-height so it reads like one page. Links open in new tabs.
Email HTML is a document format from 2003 that hates you. Isolate it.

**Screenshot:** the sandbox + srcDoc setup in `src/features/mail/components/email-html-frame.tsx`.
**Recruiters notice:** product polish plus security in one story.
**Founders notice:** you sweat the details users actually see.
**Senior engineers notice:** two independent defense layers; iframe as the correct tool.
**Interview questions:** Why isn't DOMPurify alone enough? Why no allow-scripts? How does auto-height work?
**Hashtags:** #WebDev #Security #React #Email

---

## Post 8 — My AI was blind to half the inbox

**Post:**
User opens a rich HTML email. Asks the assistant: "what does this say?"
The assistant repeats the subject line and admits it knows nothing else.
Looked like a dumb model. It wasn't.
My context builder read only the email's plain-text part.
Marketing and notification emails often ship HTML-only. No text part at all.
So the human saw a full email. The model received an empty body.
Fix: fall back to stripped HTML text when the plain part is missing.
The lesson stuck with me: when an LLM acts stupid, audit its INPUT before touching the prompt.
The model was answering perfectly — given what it saw.

**Screenshot:** the fallback function in `src/features/assistant/lib/build-assistant-context.ts`.
**Recruiters notice:** LLM debugging depth.
**Founders notice:** you find root causes instead of blaming the model.
**Senior engineers notice:** "the screen and the model had different realities."
**Interview questions:** How do you debug LLM behavior systematically? What else diverges between UI and context?
**Hashtags:** #LLM #AIEngineering #Debugging

---

## Post 9 — Human-in-the-loop should be structural, not polite

**Post:**
My mail assistant cannot send an email. Ever.
Not "it's instructed not to." It can't.
Compose, reply, forward — those actions only produce a draft. A visible, editable card.
Send is a separate action. It only works if a complete draft exists AND the user explicitly confirmed.
The visible draft IS the confirmation dialog. No extra ceremony.
If you're gating AI behavior with prompt instructions, you're hoping.
If you're gating it with structure, you're engineering.

**Screenshot:** the draft status flow (preparing → draft → sending → sent) in the assistant panel, or `canSendDraft` in `assistant-message-utils.ts`.
**Recruiters notice:** "human-in-the-loop" as a buzzword made concrete.
**Founders notice:** AI features that can't embarrass them with customers.
**Senior engineers notice:** capability vs instruction distinction.
**Interview questions:** What if the user says "send it" twice? How do drafts supersede? When is auto-send acceptable?
**Hashtags:** #AIProducts #HumanInTheLoop #UX

---

## Post 10 — "Thanks" almost re-sent a search. Twice.

**Post:**
User: "show unread emails." Assistant searches. Results appear.
User: "thanks."
Assistant: runs the exact same search again.
Small models pattern-match acknowledgements as "do that again."
I fixed it in the prompt — rules saying thanks/ok/cool are not new requests.
It still happened occasionally.
So I added a server-side guard: bare acknowledgements short-circuit to a friendly reply with zero actions. The model doesn't get a vote.
Rule I now follow: prompt rules for behavior you prefer. Deterministic guards for behavior you require.

**Screenshot:** the acknowledgement handling in `src/features/assistant/services/assistant-service.ts`.
**Recruiters notice:** real iteration on LLM reliability.
**Founders notice:** belt-and-suspenders thinking on things that cost money per call.
**Senior engineers notice:** the prefer/require split.
**Interview questions:** What else gets a hard guard? How do you decide prompt vs code? What does a duplicate search cost?
**Hashtags:** #LLM #PromptEngineering #AIEngineering

---

## Post 11 — I chose SSE over WebSockets and I'd do it again

**Post:**
Real-time inbox sync: new mail appears with no refresh.
Everyone's first instinct is WebSockets. I used Server-Sent Events.
The data flow is strictly one-way. Server says "something changed." Client refreshes.
SSE gives me that over plain HTTP, with auto-reconnect built into the browser. No protocol to design.
WebSockets would buy me bidirectionality I have no use for — and more proxy pain.
The rule: match the primitive to the actual data flow, not to the impressive-sounding option.
(One real SSE lesson: heartbeats every 25s, and X-Accel-Buffering: no, or proxies will eat your events.)

**Screenshot:** the SSE response headers in `src/app/api/gmail/stream/route.ts`.
**Recruiters notice:** realtime experience.
**Founders notice:** you pick boring tech that ships.
**Senior engineers notice:** the heartbeat + anti-buffering details prove production contact.
**Interview questions:** When would you switch to WebSockets? How do dead connections get cleaned? What breaks at two instances?
**Hashtags:** #SSE #Realtime #WebDev #SystemDesign

---

## Post 12 — Encrypt tokens like the database is already leaked

**Post:**
My app stores Gmail refresh tokens. A refresh token is standing access to someone's entire mailbox.
"The database is private" is an assumption that fails exactly when it matters — backups, dumps, connection-string leaks.
So tokens are encrypted with AES-256-GCM before they touch Postgres.
Random 12-byte IV per encryption. Auth tag. Key only in the runtime env.
And the unit test I care about most: flip one byte of ciphertext — decryption must REJECT, not return garbage.
That's why GCM over CBC. Tampering fails loudly.
Cost me forty lines and a test.

**Screenshot:** `encryptToken` in `src/features/gmail/server/token-crypto.ts` + the tamper test.
**Recruiters notice:** security literacy.
**Founders notice:** you treat their users' credentials like your own.
**Senior engineers notice:** GCM-vs-CBC reasoning; the tamper test.
**Interview questions:** Key rotation story? Why also store the token when you have JWT sessions? What if the key leaks?
**Hashtags:** #Security #Cryptography #NodeJS

---

## Post 13 — Make hallucinations no-ops, not accidents

**Post:**
What happens when my mail assistant hallucinates a thread ID?
Nothing. Literally nothing.
Not because the model is well-behaved. Because there's no path where an invented ID resolves.
Open only navigates to threads in the current search results.
Reply and forward builders return null unless the ID matches the conversation that's actually open.
And the model never writes the forwarded content — the app quotes it from the real message.
The model supplies intent. The app supplies facts.
Design so the failure mode is a no-op, and hallucinations stop being scary.

**Screenshot:** the guard clause in `src/features/mail/lib/build-forward-draft.ts` (returns null on thread mismatch).
**Recruiters notice:** hallucination handling — everyone asks about it, few show it.
**Founders notice:** AI that fails safe by default.
**Senior engineers notice:** ground-truth construction over model trust.
**Interview questions:** What CAN a hallucination still do? How does this scale to more actions? Intent vs facts — where's the line?
**Hashtags:** #LLM #AIReliability #TypeScript

---

## Post 14 — I deleted React Query from my app. Nothing broke.

**Post:**
Early on I wired TanStack Query into my Next.js app. Habit.
Three weeks later I ran a dead-code pass. Nothing imported it.
Server Components had quietly eaten every read path. There was no client cache to manage.
Reads render on the server. Writes go through Server Actions. Updates arrive by router.refresh().
Deleting a dependency you defended in your head is uncomfortable. Do it anyway.
Unused infrastructure isn't neutral. It's a false story your codebase tells the next reader.

**Screenshot:** the cleanup commit diff removing the dependency (`git show dc74a56 --stat`).
**Recruiters notice:** App Router fluency.
**Founders notice:** you remove cost instead of accumulating it.
**Senior engineers notice:** honest architecture over resume-driven dependencies.
**Interview questions:** When WOULD you add Query back? What did Server Components replace exactly? Optimistic updates without a cache?
**Hashtags:** #React #NextJS #CleanCode

---

## Post 15 — The Prisma binary that only breaks in Docker

**Post:**
Works on my Mac. Dies in the container.
Prisma's query engine is a native binary, per OS and per libc.
Generate the client on macOS, run it on Debian — the engine doesn't load.
Two fixes, both needed:
binaryTargets in the schema — native for dev, plus the exact glibc targets for the deploy image (x86 AND arm64, because cloud hosts vary).
And re-run prisma generate inside the builder stage, on the image's own OS.
Then verify: list the .so engines in the final image. Both there.
"Works locally" is a statement about your laptop, not your deployment.

**Screenshot:** the `binaryTargets` line in `prisma/schema.prisma` with its comment.
**Recruiters notice:** Prisma + Docker in production.
**Founders notice:** fewer "works on my machine" surprises.
**Senior engineers notice:** the glibc/musl awareness; arm64 foresight.
**Interview questions:** Why Debian over Alpine for Prisma? How do migrations run in prod? What's in your standalone output?
**Hashtags:** #Prisma #Docker #PostgreSQL #DevOps

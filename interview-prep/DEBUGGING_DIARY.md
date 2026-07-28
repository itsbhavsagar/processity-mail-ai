# DEBUGGING_DIARY.md — Every Real Debugging Story from CommandMail

*These all actually happened. Durations are relative and honest — I'm not going to invent "took exactly 6 hours" numbers. Practice telling stories 1, 2, and 4 out loud — they're the ones Peter will love. Each follows: symptoms → investigation → mistakes → fix → lesson.*

---

## 1. Realtime dead in production (the big one)

**Symptoms:** Deployed to Render. Sign-in works, inbox loads, AI works. But new emails only appear on manual refresh. No errors anywhere visible. The browser Network tab shows the SSE request: status 200, type `text/event-stream`. Looks... fine?

**Investigation:**
- First instinct: proxy buffering. Render sits behind a proxy; SSE is notorious for being buffered. Added `X-Accel-Buffering: no` and a padding flush.
- **Mistake #1: I fixed a hypothesis instead of testing it.** So next I actually tested the transport: from the browser console, fetched `/api/gmail/stream` raw with a reader and timed the chunks. `: connected` arrived in **0ms**. Transport was healthy. My buffering theory was wrong. (Kept the headers as hardening — they're correct practice — but they were not the bug.)
- That test was the pivot. If SSE is healthy and authenticated, the break is upstream: watch registration, Pub/Sub delivery, or webhook auth.
- Checked the deploy's environment variables against every `process.env` read in the push route. Two were missing: `GMAIL_PUSH_AUDIENCE` and `GMAIL_PUSH_SA_EMAIL`. The handler's first check returns **401 before processing anything** when they're unset. Every push Google sent was being rejected — silently, from the browser's point of view.
- Added them. Still nothing. **Mistake #2: assumed one root cause.** There were two.
- Opened the Google Cloud console, Pub/Sub → Subscriptions. The subscription type: **Pull**. My server exposes a push endpoint. Nobody was ever calling it. Google was queueing notifications for a consumer that didn't exist.

**Fix:** Recreated the subscription as an authenticated **Push** subscription: endpoint = the exact webhook URL, OIDC auth enabled with a dedicated user-managed service account, audience = the same URL. Granted the Pub/Sub service agent token-creator on that SA, confirmed `gmail-api-push@system.gserviceaccount.com` had Publisher on the topic. Sent a test email: toast appeared in the app with no refresh.

**Lessons:** Prove each hop before fixing it. Don't stop at the first root cause. Provider consoles and delivery metrics are ground truth the browser can never give you. And missing env vars should fail loudly at startup or point-of-use — a silent 401 cost me the whole hunt.

---

## 2. Docker build demanded production secrets

**Symptoms:** `docker build` fails during `next build`: "NEXTAUTH_SECRET is not configured." But a build should never need runtime secrets.

**Investigation:** The error came from a module-scope check in the auth config — `if (!secret) throw`. Why does that run at *build* time? Because Next prerenders pages during the build, those pages import the auth config, and importing a module executes its top level. Module scope IS build time for anything a prerendered page touches. I then grepped every `process.env` read in `src/` and classified each: module-scope (build-breaking) or inside-a-function (safe). Exactly one was module-scope — this throw.

**Mistake:** My original intent was good — fail fast on missing config. I'd just put the check at the wrong layer.

**Fix:** Read the secret at request time (`secret: process.env.NEXTAUTH_SECRET` inside the config object consumed per-request). NextAuth itself enforces the secret in production at runtime — which is where the failure belongs. Then verified the property: built the image from a clean checkout with **zero** env vars, booted it, hit `/api/health` — 200.

**Lesson:** "Builds without secrets" is a testable property, so test it. And in Next.js, know exactly what executes at build time.

---

## 3. `docker run` applied migrations and exited

**Symptoms:** Built with plain `docker build -t commandmail .`, ran it. Output: Prisma connects to Neon, "No pending migrations to apply," container exits. `docker ps` empty. No web server anywhere.

**Investigation:** The container told me exactly what it was doing — the logs were pure Prisma migrate output. `docker inspect` on the image: `Cmd = ["npx","prisma","migrate","deploy"]`. That's the migrator stage. Then the realization: a bare `docker build` with no `--target` builds the **last stage** of a multi-stage Dockerfile, and I had defined `migrator` after `runner`.

**Mistake:** Treating stage order as cosmetic. It's part of the Dockerfile's public interface.

**Fix:** Reordered — `runner` is now the final stage, `migrator` sits above it and is only reachable via `--target migrator` (which compose's `migrate` service uses). Verified: default build's CMD is `node server.js`, boots, health 200.

**Lesson:** The default `docker build` must produce the thing you run. Convention matters because someone (me, that same evening) will build without flags.

---

## 4. The assistant was blind to half the inbox

**Symptoms:** User opens a rich HTML email (an Amazon Jobs notification). Asks the assistant "what is this email about?" Gets back a rephrasing of the subject line. "Tell me more" → "the email doesn't provide details." The email is *right there on screen*, fully rendered.

**Investigation:** Everyone's instinct is "the model is dumb" or "fix the prompt." Instead I traced the model's actual input: dumped the exact context being built for that thread. The `body` field was an **empty string**. Root cause one hop away: the context builder read `bodyText` — the MIME `text/plain` part — and this email, like most marketing/notification templates, ships **HTML-only**. No plain-text part exists. So the human saw a rendered email; the model received nothing. Two different realities.

**Fix:** A pure `htmlToPlainText` function (strip script/style with contents, preserve block-level line breaks, decode entities) used as fallback when `bodyText` is empty — still capped at 1,200 chars. Unit-tested. Also invalidated naturally through the cache since context is in the key.

**Lesson:** When an LLM behaves stupidly, audit its input before its prompt. The model answered perfectly — given what it saw.

---

## 5. Emails unreadable in dark mode, ugly everywhere

**Symptoms:** Two waves. After shipping dark mode: email text invisible — user sent an angry screenshot, justified. Later: even in light mode, real emails (Amazon, LinkedIn templates) rendered as flat black-and-white paragraphs instead of their designed layouts.

**Investigation:** Root cause chain: I was injecting email HTML directly into my page. So (a) emails assume a white background — their dark text vanished on my dark surface; (b) my Tailwind reset and forced text colors bled into their markup, flattening everything; (c) my sanitizer config stripped `<style>` blocks, so table-based layouts collapsed.

**Mistakes:** The first fix was a patch — a white "sheet" behind email bodies in dark mode. Readable, still ugly. I also initially confused a stale dev-server render for a broken fix (installing a dependency mid-run requires a restart — lost time to a ghost).

**Fix:** The Gmail approach: render every message in a **sandboxed iframe**. Own document via `srcDoc`, DOMPurify configured to *keep* `<style>` but strip scripts/forms/embeds, sandbox without `allow-scripts`, auto-height measured after images load, `<base target="_blank">` for links. Complete CSS isolation in both directions.

**Lesson:** Email HTML is a hostile document format. Don't restyle it — isolate it. Iframes are unfashionable and exactly correct here.

---

## 6. The model refused to open emails

**Symptoms:** "Open the latest email from David" → the assistant searches, shows results... and stops. Never emits `open_email`. Consistently.

**Investigation:** I didn't want prompt folklore, so I built a small harness: scripts that call the real prompt builder and the real Groq API with fixture contexts (search results present, conversation open, etc.). Reproducible evidence. The model emitted `search_emails` every time for "open X from Y," no matter how I phrased the prompt rules or examples.

**Mistake:** Spending too many iterations trying to prompt my way out before accepting the model's limitation.

**Fix:** A five-line deterministic bridge: if the user's message starts with "open" and the response is a search, auto-navigate to the top result after showing them. The model does what it's good at (the search); code closes the gap.

**Lesson:** With small models, guardrail code beats prompt heroics. And build the live-model test harness early — it turned prompt debugging from vibes into experiments.

---

## 7. Illegal date filters from the model

**Symptoms:** "Emails from yesterday" produced `newer_than:1w` — not even legal Gmail syntax (weeks don't exist). "Today" got recomputed wrong. Search results were silently wrong — the worst kind of failure.

**Investigation:** Collected the failures from the same live-model harness. Pattern: the model fails at *date arithmetic* and *syntax constraints* it hasn't been shown explicitly.

**Fix:** A closed grammar in the prompt: the context includes a precomputed epoch for "today" that the model must copy verbatim; MUST-ALWAYS templates for yesterday/this week/this month; explicit NEVER lines for every observed illegal shape. Bumped PROMPT_VERSION so cached responses died with the fix.

**Lesson:** Never let a language model calculate. Give it values and a lookup table. Every prompt rule should trace to an observed failure — that's how you keep prompts small.

---

## 8. redirect_uri_mismatch (the OAuth rite of passage)

**Symptoms:** Google's consent screen hard-refuses with `redirect_uri_mismatch` when the app runs anywhere other than the originally configured URL. Also hit a sneaky variant: container mapped to host port 3001 while `NEXTAUTH_URL` said 3000 — app loads fine, sign-in breaks.

**Investigation:** NextAuth v4 derives the callback as `${NEXTAUTH_URL}/api/auth/callback/google`, and Google compares that byte-for-byte against the registered redirect URIs. It's a string-equality problem wearing a scary error message.

**Fix:** One OAuth client with both callbacks registered (localhost + production), `NEXTAUTH_URL` set per environment, zero code changes between environments. For local Docker: map the ports to match the env.

**Lesson:** OAuth "mystery" errors are almost always two strings that don't match. Find the two strings.

---

## 9. The chat scrolled to the bottom of a 44-email card

**Symptoms:** Ask for a search, get a tall results card, and the chat auto-scrolls to its *bottom* — user sees the last of 44 rows and no context about what happened.

**Investigation:** Classic chat-UX bug: scroll-to-bottom-on-new-message is right for text, wrong for tall structured content. The sequence was: filter card appended, list card appended, scroll to bottom → the tall card's tail fills the viewport.

**Fix:** Gave every message a DOM id (`assistant-message-<id>`) and changed the scroll behavior for rich-card groups: pin the **top** of the new card group into view (`scrollIntoView({block: "start"})`) so the user sees the filter summary and first results.

**Lesson:** The last 10% of chat UX is scroll management. Also: stable DOM ids for messages pay for themselves immediately.

---

## 10. Prisma's engine wouldn't load in the container

**Symptoms:** Works on macOS. In the Debian container, Prisma can't find/load its query engine.

**Investigation:** Prisma's query engine is a native binary per OS/libc. Generated on darwin-arm64, deployed to debian/glibc — no matching engine in the image.

**Fix:** `binaryTargets = ["native", "debian-openssl-3.0.x", "linux-arm64-openssl-3.0.x"]` (both deploy architectures — cloud hosts vary), plus re-running `prisma generate` inside the builder stage on the image's own OS. Verified by listing the `.so` engines inside the final image.

**Lesson:** "Works locally" is a statement about your laptop. Native dependencies need the target platform named explicitly — and then verified in the artifact.

# INTERVIEW_GUIDE.md — Complete Prep for the CreatoRain Interview

*Companion files: [PETER_CHEN_INTERVIEW.md](PETER_CHEN_INTERVIEW.md) (the likely interview, in order), [COMMANDMAIL_DEEP_DIVE.md](COMMANDMAIL_DEEP_DIVE.md) (technical reference), [DEBUGGING_DIARY.md](DEBUGGING_DIARY.md) (war stories), and the repo-root `interview.md` (60 deep Q&As with follow-up chains).*

*Speaking style note, everywhere in this file: answers are written in short lines. That's deliberate. Speak them slowly. Pausing between short sentences reads as thoughtful, not hesitant. If you stutter mid-sentence, the sentence is short enough to just restart.*

---

# 1. Understanding CreatoRain (grounded in the JD only)

What their site exposed publicly: just the title — "Restaurant Marketing Platform | CreatoRain." Everything else below comes from the JD.

**What the company actually is:** a small, fully distributed startup (Atlanta HQ, India-based contractors) doing AI-powered influencer marketing for restaurants and brands. 700k+ creators indexed. They automate creator discovery, outreach, and campaign management. They ship daily. Claude Code is a core part of how they build — it's in the JD twice.

**What kind of engineer they need:** not a specialist. A senior generalist who:
- owns features spec → ship → verify with no hand-holding
- works their stack: Express + TypeScript API, PostgreSQL, React (Vite) + Next.js frontends
- integrates LLMs into product features — including **agentic outreach and email composition** (read that again — that is literally CommandMail's domain)
- communicates proactively in an async remote team — they explicitly say "proactive, reliable status updates"
- holds deadlines during client launches

**What kind of interview Peter will run:** he's a founder, not a big-company interviewer. Expect:
1. A deep-dive on CommandMail — he said "real, public engineering work counts most." He will probe whether you actually built it and understand it.
2. Practical questions tied to *his* problems: email composition with AI, Postgres at 700k rows, pipelines, shipping fast.
3. Ownership and communication signals — can he trust you alone with a client launch?
4. Probably no LeetCode. Founders at small startups test judgment, not algorithms.

**Skills that matter most to him, in order:**
1. Can you ship end-to-end alone (system design → deploy)
2. LLM integration + prompt engineering that actually works in production
3. TypeScript / React / Next.js / Node / Postgres fluency
4. Claude Code / AI-assisted development proficiency
5. Communication reliability

## Match / gap table — be honest with yourself

| JD requirement | Your evidence | Strength |
|---|---|---|
| TypeScript, React, Node, 3+ yrs production | Resume timeline + CommandMail + Prospello | ✅ Strong |
| Next.js | CommandMail is Next 16 App Router, deep | ✅ Strong |
| LLM integration + prompt engineering | CommandMail (versioned prompts, Zod-validated actions, caching), RAG projects | ✅ Strongest card |
| Agentic email composition | CommandMail *is* AI email composition with human-in-the-loop | ✅ Perfect overlap — lead with this |
| Claude Code proficiency | You built CommandMail with Claude Code daily. **Not on your resume** — say it out loud early | ✅ Strong but invisible on paper |
| PostgreSQL design | Prisma + Postgres in CommandMail and three projects | ⚠️ Real but small-scale. No 700k-row story. Don't fake one |
| Postgres optimization at scale | Nothing provable | ❌ Gap — honest answer below |
| AWS (SES, S3, Amplify) | Resume lists "AWS." CommandMail is on Render. No provable AWS project work | ❌ Weak — honest answer below |
| Express | BrickShare's standalone Express API, GFG, Prospello | ✅ Fine |
| Web scraping (Bright Data, Apify) | Nothing | ❌ Gap — honest answer below |
| Langfuse / LLM observability | Nothing formal. You do have live prompt-verification scripts + versioning | ⚠️ Partial — frame as "primitive version of the same idea" |
| Docker / CI | CommandMail multi-stage Dockerfile, secretless build, Render deploy | ✅ Strong |
| Playwright | On your resume/skills. Nothing visible in public repos. | ⚠️ Risk — only claim what you can defend |
| Cloudflare Workers / Hono / Drizzle | Nothing | ❌ Gap (preferred-only — low risk) |
| Git/GitHub, merge conflicts | Years of it; clean CommandMail history | ✅ Fine |
| English + proactive updates | Interview itself is the test. Stutter note below | ⚠️ Manage directly |

**Emphasize:** CommandMail end-to-end; the agentic-email overlap with their product; Claude Code workflow; prompt engineering as versioned, tested code; Docker/deploy; ownership stories.

**Don't volunteer, but never dodge if asked:** AWS depth, scraping, Langfuse, 700k-row Postgres. For each, the pattern is: honest gap + nearest real experience + how fast you'd close it. Scripts below.

**Avoid entirely:** nothing. Avoidance reads as evasion. But don't *linger* on React Native or the 2020–2021 agency work — they're not what he's buying.

## The honest-gap scripts (say these slowly, they land well)

**AWS:** "Honest answer — my production deployments are Docker on Render and Vercel, not AWS.
The concepts transfer. Object storage, transactional email, containers.
But I haven't run SES or Amplify in production.
I'd close that in the first week — the hard parts of deployment I already know."

**Scraping:** "I haven't built scrapers with Bright Data or Apify.
The closest I've done is data pipelines for RAG — PDF chunking, embeddings, enrichment.
Same shape: messy input, normalize, store, index.
The scraping-specific parts — proxies, rate limits, anti-bot — I'd be learning. I'd rather tell you that now."

**Postgres at 700k rows:** "My Postgres work is schema design and correctness, not big-scale tuning.
I know indexing and query plans conceptually.
I haven't had a table where a bad query cost real money. Yours would be my first. I'd enjoy that."

**Langfuse:** "I haven't used Langfuse.
What I built instead was a primitive version of the idea.
Versioned prompts. A test harness that calls the real model with fixture contexts before I ship a prompt change.
Langfuse would formalize what I already do by hand."

## The stutter — handle it up front, once

You control this narrative. One sentence early, then never again:
"Quick heads-up — I have a stutter, so I sometimes pause or restart a sentence. The thinking doesn't pause. Feel free to interrupt me anytime."
That's it. Founders respect directness. The JD asks for "excellent English communication" — which means clarity and reliability, not fluency of speech. Your written communication (README, ARCHITECTURE, commit history) is your proof. If communication comes up, point at the docs: "This is how I communicate on a team — I write things down."

---

# 2. Introductions

## 30 seconds
"I'm Bhav. Full-stack engineer, about four years in.
React, Next.js, Node, Postgres — I own features end to end.
Lately my work is AI products.
The most recent is CommandMail — a Gmail client where the AI controls the UI.
Typed actions, validated with Zod, human confirms every send.
Real Gmail, real push notifications, deployed and live.
I built it with Claude Code as my daily driver — which is also how you build."

## 1 minute
Add:
"Before this I was at Prospello, building MVPs from PRDs — AI learning platform, a fintech dashboard, a React Native health app.
I started as a frontend developer and kept absorbing the backend — APIs, auth, Postgres schemas — until end-to-end was just how I work.
The reason CommandMail matters: it's not a chatbot.
The model returns typed JSON actions. Seven verbs.
An executor runs them through the same Server Actions the buttons use.
So the AI can do everything the UI can do — and nothing more.
That's the safety property, and it's the part I'd want you to judge."

## 2 minutes
Add the realtime and production layer:
"The part that stretched me most was realtime.
Gmail watch → Pub/Sub → an OIDC-verified webhook → SSE to the browser.
New mail appears with no refresh.
And it broke in production — silently.
I debugged it hop by hop: proved the SSE stream healthy from the browser console, found missing env vars 401-ing the webhook, and finally found the Pub/Sub subscription had been created as Pull instead of Push — Google was never calling my endpoint.
That debugging night is the experience I'd bring to your on-call reality.
The other thing worth saying: I ship with Claude Code daily — spec-first, reviewed diffs, tests gating merges.
Your JD says that's how you work. It's already how I work."

## 5 minutes
Structure (don't script word-for-word — speak from these beats):
1. Who I am — frontend origin, grew into full-stack at startups (30s)
2. What CommandMail is + the one core decision (typed actions, second-caller) (1m)
3. Real Gmail integration — OAuth, MIME, threading, why no mocks (1m)
4. Realtime pipeline + the production debugging story (1m)
5. AI engineering specifics — prompt versioning, caching, hallucination containment, human-in-the-loop send (1m)
6. What I'd do differently + what's next (Redis hub, rate limiting, provider interface) (30s)

## 10-minute project walkthrough (share screen if possible)
1. **Demo first** (2m): sign in, inbox, "show unread from this week" → UI changes, "reply saying…" → draft types itself → send confirmation. The demo *is* the argument.
2. **The contract** (2m): open `assistant-action.ts`. "This file is the entire AI capability surface." Then the executor. Then one Server Action showing the shared path.
3. **The prompt** (1.5m): open `assistant-system-prompt.ts`. Compressed spec, date grammar rules, PROMPT_VERSION. "Every rule traces to an observed failure."
4. **Realtime** (2m): trace push route → hub → stream route → the client hook. Tell the Pull-vs-Push story here.
5. **Security** (1.5m): token-crypto (AES-256-GCM + tamper test), OIDC webhook verification, sandboxed email iframe.
6. **Honest limits** (1m): in-process hub = single instance; 1+N mailbox fetch; what the Redis fix looks like. Ending on your own limitations is a senior move.

---

# 3. Resume Walkthrough — every bullet, every trap

*For each item: what Peter sees, what he might ask, what he's really testing, and your answer shape. Metrics on your resume are YOUR claims — I cannot verify them. For every number, you must own a one-story proof. If you can't back a number, soften it before the interview, not during.*

## Summary line ("3.5+ years")
- Trap: timeline math. 2020–2022 (2 yrs) + 2024 (5 mo) + 2025–now. It adds up, but expect "walk me through the timeline."
- **The three gaps he may probe (I cannot answer these for you — prepare true answers):**
  1. **2013 → 2020.** BCA finished 2013, first dev job June 2020. Seven years. He *will* notice if he reads the education section. Have a calm, true, one-sentence answer ready.
  2. **Aug 2022 → Apr 2024** (Allen Digital → GFG).
  3. **Aug 2024 → Mar 2025** (GFG → Prospello).
- Rule for gaps: answer in one sentence, don't apologize, bridge to what you built next. Rehearse them out loud.

## Prospello (current)
- "Build and ship MVPs from PRDs" → *Q: Walk me through one PRD → production story. What did you push back on?* (Tests product thinking, not code.)
- "REST and GraphQL API contracts" → *Q: Where did you use GraphQL and why over REST?* Have ONE concrete GraphQL story or drop the word.
- "−70% crash rate" → *Q: 70% from what baseline? Measured how?* Know the tool (Crashlytics? Sentry?) and the top crash cause.
- "Zoom SDK + LiveKit" → *Q: Why both? What broke?* Know which does what in your architecture.
- "+35% LCP" → *Q: measured where — lab or field? What specifically moved it?* Name the exact changes (SSR/ISR of which pages, which bundles split).
- "−50% redundant API calls" → *Q: how did you count redundant calls?* Have the before/after mechanism.

## GeeksForGeeks (Apr–Aug 2024)
- Five months. *Q: why so short?* One honest sentence, no defensiveness. (Contract? Better offer? I can't know — you must.)
- "−80% form bugs via Formik/Yup" → same metric rule.

## Allen Digital
- "Millions of students" → *Q: what did YOU own inside that?* Have one specific component/flow story.
- "WCAG-compliant" → *Q: name three WCAG things you actually did.* (Contrast ratios, keyboard nav, aria-labels — only claim what you did.)

## SpeedWell
- Low risk. One sentence if asked. Don't linger.

## Projects section
- All three (Fintech Pay, BrickShare, AI LMS Tutor) are public on GitHub — good.
- **Repo-name mismatch:** resume says "BrickShare," the repo is `fintech_app`. Rename the repo or add "BrickShare" to its description *before* the interview.
- *Q: "Is Fintech Pay's Razorpay integration live-mode or test-mode?"* Be precise about what's real.
- *Q on AI LMS Tutor: "Walk me through your RAG pipeline."* Know your chunking strategy, embedding model (Cohere), retrieval method, and how you ground Groq responses.

## Skills section — liability scan
Every word in a skills list is a claimed interview topic:
- **AWS** — weakest listed claim. Use the honest-gap script.
- **Playwright** — can you write a Playwright test cold, right now? If not, be ready with "I've used it lightly; my depth is Jest" — or remove it.
- **GraphQL** — one story minimum.
- **Whisper, Vercel AI SDK, OpenAI API** — one sentence each about where you used them.
- **Claude Code is missing.** The JD's most distinctive requirement is absent from your resume. Say it in your intro instead — and consider adding it to the resume for future applications.

## Education
- MCA 2026–Present while working full-time → *Q: why now, and how do you manage both?* One honest sentence.
- BCA 2010–2013 → feeds the seven-year-gap question. Prepare it.

---

# 4. GitHub Analysis (fetched 2026-07-08, grounded)

Profile: 11 public repos, 231 followers, account since 2019. Bio: "Frontend focused Full Stack Engineer."

**Which repo Peter opens first:** none of them — he'll look for CommandMail, because your email will point him at it. **It's private.** That's the single biggest prep item: either make it public (after the cleanup pass — strip temp diagnostics, fix docs drift, add LICENSE) or offer him read access in your reply email. If he lands on your profile without CommandMail, he opens `fintech-pay` or `ai-lms-tutor` first — they match your resume and have live links.

**Strengthen your application:** `fintech-pay`, `ai-lms-tutor`, `fintech_app` (BrickShare), `medicore`, `lms`. All recent, all with live deploys — good signal.

**Weaken / tidy:**
- Bio says "Frontend focused" — your pitch is full-stack AI engineer. Change the bio.
- `fintech_app` → rename to `brickshare` (resume match).
- `full-stack-takehome`, `CognitiveCreations`, `bitscale-figma` have no descriptions. Add one line each — Peter skims descriptions.
- `Admin_Dashboard` (CSS, 2024) and the two forks add nothing. Consider archiving.
- Pin your best four (I couldn't verify current pins via API — check manually): fintech-pay, ai-lms-tutor, brickshare, lms — and CommandMail once public.

**If I were Peter, which do I click first?** CommandMail if it exists publicly (his email said "GitHub matters most" *after* reviewing your project claims). Otherwise `ai-lms-tutor` — because the JD is AI products, and that repo claims RAG + streaming + memory.

---

# 5. Portfolio Analysis (fetched 2026-07-08, grounded)

Overall: genuinely good. Clear positioning, metrics, live links, honest tech lists. Better than most.

**What impresses:** the "What I build" line (production APIs + databases + UIs); metrics repeated consistently with the resume; seven projects with live demos; skills grouped sanely; Render/Claude present in skills (matches reality better than the resume does).

**Problems to fix before Peter opens it:**
1. **CommandMail is absent.** Your strongest project — the one he's evaluating you on — isn't on your portfolio. Add it at the top with the live link and demo video.
2. **Location inconsistency:** portfolio says Delhi, GitHub says Bangalore, resume says Bengaluru (Prospello). Pick one.
3. Project dates show "2026" — reads oddly for things built during a role that started March 2025. Sanity-check those dates.
4. Healthcare App has no live link — either link something (store listing? video) or expect "can I see it?"
5. Portfolio mentions "Solinify" (fifth Prospello product) which the resume doesn't — fine, but be ready for "what's Solinify?"

**Questions the portfolio generates:** every project card = "walk me through it" + "what was hard" + "show me the code for X." The two he'd pick given the JD: AI LMS Tutor (RAG details) and Fintech Pay (payments + webhook handling — closest to B2B SaaS work).

---

# 6. Top-20 Most-Likely Questions — Speakable Answers

*(Deep versions with follow-up chains: `interview.md` Parts 8–9. These are the short spoken forms.)*

**1. "Tell me about CommandMail."**
"It's a Gmail client where the AI operates the UI.
Not a chatbot. It fills the compose form. Runs searches that change the inbox. Opens threads. Drafts replies and forwards.
The model outputs typed JSON — seven possible actions — validated with Zod.
A small executor runs them through the same Server Actions the buttons use.
So the AI can do everything the UI can do, and nothing more.
Real Gmail underneath. Deployed on Render."

**2. "Why not just let the model call tools directly?"**
"Because then the model is a second privileged actor.
Emails are attacker-controlled input, and they go into the model's context.
If the model has its own path to Gmail, a malicious email can steer it.
My way, the worst thing the model can do is what a mouse click can do.
Prompts are not a security boundary. Code is."

**3. "What stops the AI from sending an email on its own?"**
"Structure. Compose, reply, forward — those actions can only create a draft.
Send is a separate action.
It only works if a complete draft exists, and the user explicitly confirmed.
'Thanks' doesn't count as confirmation — I had to enforce that in the prompt *and* with a server-side guard."

**4. "How do you get reliable JSON from an LLM?"**
"Three layers.
Ask for it — JSON mode, temperature 0.1.
Show it — few-shot examples as literal JSON.
Never trust it — Zod validation on every response.
Bad output degrades to a safe fallback. It never throws."

**5. "How do you handle hallucinated thread IDs?"**
"Two ways.
The prompt says: IDs only from context you were shown.
And structurally, an invented ID resolves to nothing.
Open only navigates to threads in the current results.
Reply and forward builders return null unless it's the open conversation.
So a hallucination is a no-op, not a wrong action."

**6. "Why Groq and a small model instead of GPT-4-class?"**
"Latency is the product.
Operating a UI has to feel under a second.
A 17B model on Groq is fast and cheap.
With a closed action grammar at temperature 0.1, it's reliable enough —
and the architecture absorbs the rest. Validation. Guards. Ground-truth drafts."

**7. "Walk me through the realtime pipeline."**
"Sign-in registers a Gmail watch pointed at a Pub/Sub topic.
New mail → Google POSTs my webhook with an OIDC token.
I verify the token — audience and signer — before trusting anything.
Then I diff Gmail's history from a stored cursor.
Publish to an in-process hub.
Every open tab has an SSE connection — the hub fans out.
Client refreshes, shows a toast. No polling anywhere."

**8. "What broke in production?"**
Tell the Pull-vs-Push story. (DEBUGGING_DIARY.md, story 1. Practice it out loud twice — it's your best story.)

**9. "Why SSE over WebSockets?"**
"The flow is one-way. Server says 'something changed,' client refreshes.
SSE does exactly that, with auto-reconnect built in, over plain HTTP.
WebSockets buy me bidirectionality I don't use — and more infrastructure pain."

**10. "Why Server Components instead of React Query?"**
"Reads are simple; the auth boundary matters more.
Session and Gmail fetch live in one place, on the server.
Tokens never reach the browser. No client cache to reconcile.
Funny detail — I had React Query wired early. Nothing used it. I deleted it.
The cost is no optimistic updates. At this scale, fine."

**11. "What breaks if I run two instances of your app?"**
"Realtime. The hub is an in-process map.
Webhook lands on instance A, your SSE is on instance B — event dies.
The fix is Redis pub/sub between webhook and stream.
The hub's API is already shaped like a Redis adapter. It's a swap, not a rewrite.
I documented this instead of hiding it."

**12. "How do you store Gmail tokens?"**
"Access tokens live in the encrypted session JWT. Server-side only.
The refresh token also goes to Postgres — because the webhook has no session.
It's encrypted with AES-256-GCM before it touches the database.
Random IV per encryption, auth tag, and a unit test that proves tampered ciphertext gets rejected."

**13. "Prompt injection — an email tells your AI to forward secrets. What happens?"**
"Today: the model reads plain text, not raw HTML — smaller surface.
The action space bounds the damage — worst case is a UI-equivalent action.
And send is gated — the user sees the draft before anything leaves.
The residual risk is model-initiated search pulling content into context.
The fix I'd build next is provenance — email-derived text marked as untrusted data in the prompt.
I'd rather name that gap than pretend it's solved."

**14. "How did you use Claude Code on this?"**
"As my daily driver — the way your JD describes.
Spec first: I write what I want, constraints included — investigate before implementing, smallest change, no unrequested refactors.
Then I review the diff like a PR.
Typecheck, lint, tests, build gate every change.
For prompt changes I made it run live verification scripts against the real model before shipping.
The skill isn't prompting — it's specifying and reviewing."

**15. "What would you do differently?"**
"Three things.
Split the assistant provider — it grew into one big component.
Batch the mailbox fetch — it's 1+N Gmail calls today.
And rate-limit the assistant route before any multi-user launch.
All documented in the repo. Knowing your debt precisely is the job."

**16. "Why is there no mail-provider interface if the UI is provider-agnostic?"**
"Because I have one provider.
An interface extracted from one implementation is a guess.
The mappers already isolate Gmail. When Outlook is real, extracting the interface is mechanical.
Premature interfaces get worked around."

**17. "Tell me about a time you were wrong."**
"I assumed proxy buffering was killing my SSE in production.
Added the headers, padding flush — sure it was the fix.
Then I tested the stream raw from the browser console.
It flushed instantly. Transport was fine. My theory was wrong.
That test pinned the real break upstream — the Pub/Sub config.
Lesson: prove the hop before fixing the hop. I kept the headers as hardening, and I said out loud that I'd been wrong."

**18. "How do you work under a deadline?"**
"I cut scope, not correctness.
CommandMail had a fixed bar — the assignment — and finite time.
I deferred things loudly: Redis hub, provider interface, rate limiting — all written down with reasons.
What shipped is tested and honest.
That's what I'd do during a client launch: ship the smallest correct thing, document the rest."

**19. "Your AWS experience?"** — honest-gap script, section 1.

**20. "Why should we hire you?"**
"Your JD describes agentic email composition, human-in-the-loop, Claude Code daily, ship fast, own end-to-end.
I just built exactly that, alone, and deployed it.
Not a similar thing. The same thing.
The gaps I have — AWS specifics, scraping tools — are learnable in weeks.
The part that's hard to hire — shipping AI products end-to-end with judgment — I've already shown you."

---

# 7. Question Banks

*One line each. Deep answers for the CommandMail ones: `interview.md` Part 8 and COMMANDMAIL_DEEP_DIVE.md. Practice by picking five at random daily and answering out loud.*

## 100 technical questions

*Architecture & Next.js (1–20)*
1. Why Next.js App Router over Pages Router?
2. Server Component vs Client Component — where's the boundary in your app?
3. What exactly does a Server Action compile down to?
4. Why no API routes for reads?
5. What does `router.refresh()` actually re-run?
6. Where does `getServerSession` execute and what does it read?
7. What is `proxy.ts` and why isn't it called middleware anymore?
8. Why is the assistant provider in the layout, not the page?
9. What's in your standalone Next build output?
10. How does URL state (`?thread=`) drive server rendering?
11. What happens on a hard reload mid-draft? Why is that acceptable?
12. How do Server Actions handle auth?
13. Why FormData for your send actions?
14. What's your hydration story — any flashes, any suppression?
15. Why `next-themes` and class-based dark mode?
16. What triggers a Server Component re-render in your flow?
17. How would you add optimistic sends?
18. What's your error boundary strategy?
19. Why is focus mode state, not a route?
20. What would break if you moved reads to client fetching?

*AI & prompts (21–45)*
21. Walk me through your system prompt section by section.
22. Why compress the action syntax instead of sending JSON Schema?
23. What is PROMPT_VERSION and what does it key?
24. Why temperature 0.1?
25. How does your response cache key work?
26. When would the cache serve a wrong answer?
27. Why 8 messages of history?
28. Why cap conversation body at 1200 chars?
29. How does the model know today's date?
30. Why can't the model do date math reliably?
31. What is `json_object` mode actually guaranteeing?
32. How do few-shot examples anchor output format?
33. What happens on unparseable model output?
34. What's `salvageThought`?
35. Why does "thanks" need special handling?
36. How does the model revise an existing draft?
37. Why does forward not take a body from the model?
38. What context does the model get about the open email?
39. Why plain text and not HTML in context?
40. How would you evaluate prompt changes systematically?
41. What's your fallback if Groq is down?
42. Why one LLM call per message, no agent loop?
43. What would streaming responses change in your architecture?
44. How do you test LLM behavior before deploying?
45. What metrics would you track in production for the assistant?

*Gmail & realtime (46–70)*
46. Walk through OAuth from click to session.
47. What scopes do you request and why `gmail.modify`?
48. Why `prompt: "consent"`?
49. How does token refresh work in the jwt callback?
50. Why store the refresh token in Postgres too?
51. What's your MIME message structure?
52. What's RFC 2047 encoding and where do you use it?
53. How does reply threading work — which headers?
54. Your reply-recipient algorithm — edge cases?
55. What's base64url vs base64 and where does it matter?
56. What is `users.watch` and what does it cost?
57. What's a historyId?
58. What happens when history.list 404s?
59. Why 204 vs 500 responses in your webhook?
60. How do you verify a Pub/Sub push is really from Google?
61. What's the OIDC audience and why must it match exactly?
62. Why does the watch need renewal and how do you do it?
63. What happens if renewal fails for a user?
64. Duplicate Pub/Sub delivery — what happens in your system?
65. Out-of-order delivery?
66. Why SSE heartbeats every 25 seconds?
67. How do dead SSE connections get cleaned up?
68. What's `X-Accel-Buffering` and why did you add it?
69. Why `Promise.allSettled` on thread fetches?
70. Why no Gmail SDK?

*Security (71–85)*
71. Where do tokens live, end to end?
72. Why AES-256-GCM over CBC?
73. Walk through your encrypt function — IV, tag, packing.
74. What does your tamper test prove?
75. Key rotation story?
76. How do you render untrusted email HTML?
77. Why an iframe and not just DOMPurify?
78. Why does the sandbox exclude `allow-scripts`?
79. What's your threat model for the assistant?
80. Sketch a prompt-injection attack on your app and the mitigation.
81. Why is the executor not your security boundary?
82. How is the cron endpoint protected?
83. What security work did you consciously defer?
84. What's in your Docker image that shouldn't be — and what isn't?
85. How do you keep secrets out of the image?

*Data, Docker, testing (86–100)*
86. Your Prisma schema — walk me through it.
87. Why only one table?
88. What are Prisma binaryTargets and why did you need them?
89. How do migrations run in production?
90. Why a separate migrator Docker stage?
91. Explain each Dockerfile stage.
92. Why Debian slim and not Alpine?
93. How do you healthcheck the container?
94. What do you unit test and why those things?
95. Why no component tests?
96. What's the first E2E test you'd add?
97. What does your `next/jest` setup do?
98. How fast is your suite and why does that matter?
99. What's knip and how did you use it?
100. How would you add CI to this repo?

## Follow-up bank (Peter's second question, by theme — prepare the *second* layer)
For every answer above, expect one of these shapes:
- "How do you know?" (evidence: a test, a log, a metric, a doc)
- "What breaks it?" (failure mode: know one per feature)
- "What was the alternative?" (name it + why rejected)
- "Show me." (be ready to open the exact file — know your file names cold)
- "What would you do at 10x?" (scaling story per layer: batch fetch, Redis hub, rate limits, queue the webhook)
- "When is your choice wrong?" (every decision has a context where the alternative wins — `interview.md` Part 5 has these)
Drill: for questions 1–100, say out loud which file you'd open if he said "show me." If you don't know, that's your study list.

## 50 behavioral / ownership / leadership / failure
1. Tell me about yourself. 2. Why CreatoRain? 3. Why leave Prospello? 4. Walk me through your career — why the gaps? 5. Why did GFG last five months? 6. What did you do between 2013 and 2020? 7. Proudest technical achievement? 8. A time you were completely wrong? 9. A time you missed a deadline? 10. A time you cut scope — how did you decide what to cut? 11. A time you disagreed with a product decision? 12. How do you handle vague requirements? 13. Describe your ideal working day. 14. How do you give status updates without being asked? 15. What does "done" mean to you? 16. A time you shipped something you weren't proud of? 17. How do you handle feedback that stings? 18. What do you do when stuck for more than an hour? 19. How do you decide build vs buy? 20. Describe your code review standards. 21. What makes you quit a job? 22. How do you work with a founder directly? 23. What would your last manager say about you? 24. Biggest weakness — real one? 25. A time you took ownership of something broken you didn't build? 26. How do you handle two urgent things at once? 27. What do you automate first on a new team? 28. How do you learn a new tool fast — example? 29. What's your testing philosophy when time is short? 30. Describe a conflict with a teammate and the resolution. 31. When did you last change your mind about a strongly held technical opinion? 32. How do you estimate work? 33. What happens when your estimate is wrong? 34. Tell me about mentoring someone. 35. What does senior mean to you? 36. Why contract work — comfortable with it? 37. How do you handle timezone overlap requirements? 38. What hours do you actually work? 39. How would you handle a client-launch fire at 11pm? 40. What's the MCA for — are you leaving for studies? 41. How long do you intend to stay? 42. What compensation progression do you expect? 43. What do you need from a founder to do your best work? 44. First 30 days here — what would you do? 45. How do you keep AI-generated code honest? 46. What would you do if Claude Code wrote code you didn't understand? 47. Describe your git hygiene. 48. A merge conflict story? 49. What documentation do you write without being asked? 50. Why should I trust you alone with production?

## 50 architecture questions
1. Draw CommandMail's architecture from memory. 2. Where are the trust boundaries? 3. What's stateful vs stateless in your system? 4. Why is the hub in `server/` and not `features/gmail/`? 5. Justify your folder structure. 6. What is a domain model protecting you from? 7. When do you introduce an interface? 8. Why is your write path centralized? 9. What owns each piece of state — enumerate. 10. What's your caching story at every layer? 11. Where would you add a queue and why? 12. What's idempotent in your system and what isn't? 13. Race conditions you know about? 14. How would multi-account-per-user change the schema? 15. How would Outlook support change the code — be specific. 16. What survives a horizontal-scale rewrite untouched? 17. Why JWT sessions over DB sessions? 18. Where's your single point of failure? 19. What's your blast radius if Gmail changes an API shape? 20. Why is the assistant additive, never load-bearing? 21. How do the AI and human paths converge — show the exact point. 22. What's your API versioning story? 23. How would you split AssistantProvider — into what? 24. What is the executor pattern and where else would you use it? 25. Why client-side executor instead of server-side orchestration? 26. When would you move execution server-side? 27. What's a saga and when does your app need one? 28. How do you keep the prompt and the schema in sync? 29. What breaks if two tabs are open? 30. What's your migration strategy for a breaking schema change? 31. How do you deprecate an assistant action? 32. Where do feature flags fit in this design? 33. What's observable in your system today — and what's blind? 34. Design the audit log for assistant actions. 35. Where does rate limiting go and at what granularity? 36. What's your rollback story for a bad deploy? 37. Stateless webhook + stateful stream — tension? 38. Why per-render fetching over a client cache — steelman the opposite. 39. What's the cost model of your Gmail usage? 40. Which component would you rewrite first and why? 41. Justify seven actions — why not three, why not fifteen? 42. What makes an action "UI-equivalent"? 43. How would bulk operations (archive 50 threads) fit the action model? 44. What's your undo story? 45. How would drafts persist across reloads — design it. 46. Multi-device consistency — what breaks today? 47. Design notifications for mobile push instead of browser. 48. What would a plugin/extension API look like for actions? 49. How do you keep docs from drifting (yours did — forward payload)? 50. If you rebuilt from zero, what's the first file you'd write?

## 50 system design questions (CreatoRain-flavored)
1. Design creator discovery search over 700k creators in Postgres. 2. Which indexes, exactly? 3. When does this need Elasticsearch — and does it? 4. Design AI relevance scoring for creator-to-campaign matching. 5. Where do you store embeddings — pgvector or external? 6. Design agentic outreach: AI-composed emails at scale with human oversight. 7. How does your CommandMail draft-gate translate to bulk outreach? 8. Design the send pipeline on SES — bounces, complaints, suppression lists. 9. Rate limiting outreach per domain — design it. 10. Design reply detection and threading for outreach conversations. 11. Design the scraping pipeline: source → normalize → dedupe → store. 12. How do you dedupe 700k creator profiles? 13. Schema for creators with per-platform metrics that change daily? 14. Time-series metrics in Postgres — partitioning strategy? 15. Design campaign state — a state machine for outreach status. 16. Idempotent webhook processing for email events — design it. 17. Queue choice and why — SQS vs Postgres-backed vs Redis. 18. Design retry + dead-letter for failed LLM calls. 19. Budget guardrails for LLM spend per campaign — design. 20. Prompt versioning across a team — design the workflow. 21. LLM observability — what do you log per call? 22. Design an eval harness for outreach email quality. 23. A/B testing prompts in production — design. 24. Multi-tenant data isolation — schema-per-tenant vs row-level? 25. Design RBAC for brand teams vs agency admins. 26. Design the analytics dashboard queries — precompute or on-demand? 27. Caching layer for creator profiles — invalidation strategy? 28. Design image/media storage for creator content on S3. 29. CDN strategy for a media-heavy B2B dashboard. 30. Design search-as-you-type over creator names — latency budget. 31. Cursor vs offset pagination for creator lists — why? 32. Design CSV export of 100k rows without timing out. 33. Background jobs on App Runner — what's your scheduler? 34. Design the CI/CD: PR → preview → staging → prod. 35. Zero-downtime migration on a 700k-row table — walk through it. 36. Adding an index on a hot table in production — how? 37. Design monitoring: what pages someone at 3am? 38. SLO for the outreach pipeline — define one. 39. Design graceful degradation when the LLM provider is down. 40. Two LLM providers (Claude + OpenAI) — abstraction or per-feature choice? 41. Design contact enrichment (find creator emails) — legally and technically. 42. Handling Instagram/TikTok API rate limits in the pipeline. 43. Design change-data-capture: creator metrics changed → notify campaigns. 44. Realtime campaign dashboard — SSE, WebSockets, or polling here? Why different from CommandMail? 45. Design a staging environment with production-like data — safely. 46. Feature flags for a two-person team — how much process? 47. Design the audit trail for every AI-sent email. 48. GDPR/CAN-SPAM deletion — design data removal across the pipeline. 49. Cost model: estimate infra cost per 1,000 outreach emails. 50. What would you build in week one to make all future weeks faster?

## 50 AI engineering questions
1. RAG vs long context — when each? 2. Your chunking strategy in AI LMS Tutor — defend it. 3. Embedding model choice — why Cohere there? 4. How do you measure retrieval quality? 5. Hallucination taxonomy — what kinds exist in your apps? 6. Structured output: JSON mode vs function calling vs constrained decoding? 7. When does temperature matter and when doesn't it? 8. Prompt compression techniques you've actually used? 9. System vs user message — what goes where and why? 10. Few-shot: how many examples before diminishing returns? 11. How do you version prompts across environments? 12. Cache invalidation for LLM responses — your key design? 13. Token budgeting per request — walk through yours. 14. Latency budget: where does each millisecond go in your loop? 15. Streaming vs blocking responses — product trade-offs? 16. How do you keep model output out of your trust boundary? 17. Injection via retrieved content — mitigations ranked? 18. Provenance marking — design it for your context builder. 19. Eval sets: how would you build one for CommandMail's actions? 20. Golden tests for prompts — what breaks them? 21. When is fine-tuning worth it over prompting? 22. Small model + guards vs big model — cost math? 23. Groq vs OpenAI vs Anthropic APIs — practical differences you've hit? 24. Multi-step agent loops — why did you avoid them? 25. When would CommandMail need an agent loop? 26. Tool-calling APIs vs your typed-action pattern — compare honestly. 27. How do you debug a bad generation — process? 28. Logging LLM calls — what fields, what privacy issues? 29. PII in prompts — your policy? 30. Deterministic guards vs prompt rules — how do you choose? 31. The acknowledgement bug — why did it happen mechanically? 32. Why do models fail at date arithmetic? 33. Context window management at 100 messages — design. 34. Summarization as compression — when do you trust it? 35. Grounding: how does your forward feature embody it? 36. Confidence signals from LLMs — real or fake? 37. Retry strategy on malformed output — how many, then what? 38. Model upgrades — how do you regression-test behavior? 39. Prompt drift across model versions — experienced it? 40. Guardrail libraries vs hand-rolled Zod — trade-offs? 41. Moderation/safety filtering for outbound AI email — design. 42. Personalization at scale: 1,000 creators, one campaign — prompt design? 43. Batch LLM processing — how does it differ from interactive? 44. Cost attribution per feature — how would you track it? 45. What's an LLM proxy/gateway and would you use one? 46. Semantic caching — when is it safe? 47. Evals in CI — what would block a merge? 48. Human feedback loops — design one for outreach quality. 49. What did Whisper integration teach you about audio UX? 50. What's the most overrated thing in AI engineering right now — and underrated?

## 50 debugging questions
1. Tell me your best debugging story. (Pull-vs-Push — rehearsed.) 2. Your debugging process from symptom to fix — steps? 3. How do you debug something you can't reproduce? 4. Production-only bug — first three moves? 5. How did you prove the SSE stream was healthy? 6. Why did the webhook 401 silently — and what design lesson? 7. How do you debug OAuth failures generally? 8. redirect_uri_mismatch — mechanically, what's compared? 9. A CORS story? 10. How do you debug a hydration mismatch? 11. Stale closure in React — how do you spot it? 12. Memory leak in Node — tools and process? 13. How would you find a leaked SSE connection? 14. Docker build works locally, fails in CI — process? 15. The migrator-stage bug — how did you diagnose it? 16. Prisma engine mismatch — symptom and fix? 17. How do you read a Next.js build trace? 18. Debugging env-var issues across environments — system? 19. What logs did you add to the realtime pipeline and where? 20. Log levels — what deserves error vs warn vs info? 21. How do you debug from provider metrics (Pub/Sub) — what did you read? 22. A database bug you've chased? 23. N+1 detection — how? 24. How do you debug slow queries — explain analyze walkthrough? 25. Debugging a webhook you don't control — techniques? 26. Clock skew / timezone bugs — the date-grammar story? 27. How do you bisect a regression? 28. git bisect in practice — used it? 29. Debugging minified production JS — sourcemap story? 30. A caching bug — how did you catch it? 31. Race condition you've actually hit? 32. How do you debug flaky tests? 33. Debugging LLM nondeterminism — how is it different? 34. The HTML-only email bug — how did you find the empty context? 35. Why audit model input before prompts — explain with that story. 36. Dark-mode email invisibility — root cause chain? 37. How do you know when to stop debugging and rollback? 38. Post-mortem process — what do you write down? 39. When do you add a regression test vs move on? 40. Debugging under deadline — what changes? 41. Someone else's code is broken in prod — process? 42. Debugging across a language/framework you don't know? 43. Print debugging vs debugger — honest preference and why? 44. How do you instrument a distributed pipeline cheaply? 45. What's a heisenbug you've met? 46. Network tab techniques — favorite tricks? 47. curl as a debugging tool — examples from this project? 48. When did a wrong assumption cost you hours — story? 49. What's your "first 5 minutes" checklist for any incident? 50. What bug are you most proud of finding?

---

# 8. Strengths, Weaknesses, Red Flags

**Strengths to project:** end-to-end ownership (CommandMail is one person, brief → production); AI engineering with judgment (containment, not hype); honest documentation of trade-offs; debugging methodology; Claude Code fluency; the exact domain overlap (AI email composition, human-in-the-loop).

**Weaknesses to own (pick these when asked — real, not fake-humble):**
- "I over-build alone. CommandMail's provider grew to 900 lines before I flagged it. On a team, review catches that earlier — solo, I have to be my own reviewer, and I was late once."
- "No production AWS. Render and Vercel, yes. SES/S3 concepts, yes. Real AWS operations, not yet."
- "I haven't operated Postgres at large scale. Schema design yes, 700k-row tuning no."

**Red flags Peter might see — and your counters:**
- *Resume gaps (2013–2020 especially)* → prepare one calm true sentence each. Unanswered, this is the biggest risk in the interview. I can't write these for you.
- *Five-month GFG stint* → same.
- *"Did AI build this for him?"* → counter with depth: name files, tell the debugging stories, own the trade-offs. Also own the workflow proudly: "Claude Code wrote a lot of the code. I wrote the specs, reviewed every diff, and I can defend every decision. That's the workflow your JD describes."
- *Metrics inflation suspicion* → one proof story per number, or soften the number.
- *Contract commitment* → have a clear answer on staying power and the MCA.

---

# 9. Questions to Ask Peter (pick 3–4)

1. "You index 700k creators. What's the current bottleneck — data freshness, search quality, or outreach conversion?"
2. "For agentic outreach — how much human review is in the loop today, and where do you want it in a year?" (Shows you think about the exact problem you solved.)
3. "How does the team use Claude Code day to day — shared specs, review norms, anything you've standardized?"
4. "What does the first month look like for this role — a feature you already know you'd hand me?"
5. "What's broken right now that you wish someone would just own?"
6. "How do you evaluate LLM output quality today — evals, Langfuse traces, or founder eyeballs?"
7. "Two-hour overlap — which hours, and how do decisions get made async outside them?"
8. (If it went well) "What would make the person in this role indispensable to you in six months?"

Don't ask about: compensation details in round one (it's in the JD), vacation, "culture" generically.

---

# 10. Final prep checklist (do these before the call)

- [ ] Make CommandMail repo public after cleanup (strip `[realtime]` temp diagnostics, fix README `forward_email` payload drift, remove TanStack Query mention from ARCHITECTURE, add LICENSE) — or send Peter a collaborator invite.
- [ ] Move `interview-prep/`, `linkedin.md`, `interview.md` OUT of the repo (or gitignore them) before making it public. **These files must never be visible to Peter.**
- [ ] Add CommandMail to bhavsagar.com with live link + video.
- [ ] Rename `fintech_app` → `brickshare`; add descriptions to blank repos; update GitHub bio ("Frontend focused" → full-stack AI).
- [ ] Fix location inconsistency (Delhi vs Bangalore).
- [ ] Prepare true one-sentence answers for: 2013–2020, 2022–2024, 2024–2025, GFG five months, MCA-while-working.
- [ ] One proof story per resume metric (70%, 35%, 50%, 80%, 25%).
- [ ] Rehearse out loud: the 1-minute intro, the Pull-vs-Push story, the "why not tool-calling" answer. Three times each. Slowly.
- [ ] Test the live demo end-to-end the morning of the call. Have the video link ready as backup.

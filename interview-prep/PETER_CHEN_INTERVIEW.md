# PETER_CHEN_INTERVIEW.md — The Interview Peter Is Most Likely to Run

*Built from: his JD, his email ("real, public engineering work counts for a lot more than resume wording"), your resume, your GitHub, your portfolio, and CommandMail. 30 minutes, founder-style: no algorithms, all judgment. He interviews the way he hires — fast, direct, probing for whether he can leave you alone with production.*

*Format: **Q** = question. **Why** = what he's actually evaluating. **↳** = likely follow-ups. Answers: `interview.md` Part 8 + INTERVIEW_GUIDE.md section 6.*

---

## Phase 1 — Calibration (minutes 0–5)

**Q1. "Tell me about yourself — short version. I've read the resume."**
**Why:** Can you prioritize? Seniors give 60 seconds and land on what's relevant to *him*. Juniors recite chronology.
↳ "Why are you looking?" ↳ "Why a contract role at a small startup?"

**Q2. "Walk me through your last few years — I noticed some gaps."**
**Why:** Not gotcha — risk assessment. He's hiring a remote contractor; disappearing acts are his nightmare. Calm one-sentence answers close this in 30 seconds. Fumbling here poisons the next 25 minutes.
↳ "GeeksForGeeks was five months — what happened?" ↳ "You graduated in 2013 but your first dev role is 2020 — what were you doing?"
**Note: I cannot script these — only you know the truth. Prepare them first, before anything else in this file.**

**Q3. "You're doing an MCA right now while working. Why, and how does that fit a full-time contract?"**
**Why:** Availability risk. He needs someone who "holds the line under deadline pressure."

## Phase 2 — Did you actually build CommandMail? (minutes 5–15)

*This is the heart. His email said GitHub matters most. In the Claude Code era, every founder now tests whether the candidate owns their AI-assisted work. He'll ask questions where README knowledge fails and only the builder knows.*

**Q4. "CommandMail — give me the two-minute version. What should I judge you on?"**
**Why:** Opening move. Do you lead with a decision or a feature list?

**Q5. "You used AI to build this, right? How much of it did you actually write?"**
**Why:** The authenticity test, asked straight. He *wants* AI-assisted developers — the JD demands Claude Code — but he needs someone who owns the output. The wrong answers are both extremes: "I wrote everything myself" (he won't believe it) and "the AI did it" (nothing to hire).
**Your shape:** "Claude Code wrote a lot of the code. I wrote the specs and the constraints, reviewed every diff, rejected plenty, and made every architecture call. I can defend any file in the repo — pick one."
↳ He picks one. Know your files cold.

**Q6. "OK — walk me through what happens, in code, when I type 'reply saying I'll join tomorrow.'"**
**Why:** The real authenticity check. README knowledge gives the flow; only the builder knows the details.
↳ "Where does the recipient come from?" (the reply-recipient algorithm — sender unless the latest message is yours)
↳ "What if I say 'thanks' next?" (acknowledgement guard, both layers)
↳ "What if the model returns a threadId for a different conversation?" (builder returns null, toast — hallucination becomes no-op)

**Q7. "Why doesn't the model just call a send function? Everyone builds tool-calling agents."**
**Why:** Your core decision, challenged. He builds agentic outreach — he has opinions. He wants to see you defend a position without being religious about it.
↳ "When would tool-calling actually be the right design?" (autonomy products — know when your own architecture is wrong)
↳ Trick version: **"Isn't your executor just tool-calling with extra steps?"** — Partially yes, own it: "The difference isn't the dispatch, it's the authority. My actions are UI-equivalent by construction and the send is human-gated. Tool-calling usually grants the model capabilities no UI exposes. Same plumbing, different trust model."

**Q8. "Your realtime sync — walk me through the pipeline. Then tell me what broke."**
**Why:** Tests systems thinking AND invites your best story. Founders love production war stories — they predict how you'll behave during *his* client-launch fires.
↳ "How did you know the browser side was fine?" (raw SSE fetch, `: connected` in 0ms)
↳ "What told you it was the subscription?" (missing env vars first → 401; then the Pub/Sub console: Pull, not Push)
↳ "What did you change so this class of bug is found faster next time?" (boundary logging; fail loudly on missing env)

**Q9. Trick: "Your README says forward_email takes a body from the model. Does it?"**
**Why:** If he read closely, he found the drift. Tests honesty under catch.
**Your shape:** "No — good catch. The schema is `{threadId, to}`; the app builds the quoted body from the real conversation. The README drifted a day behind the code. That's deliberate design though: the model supplies intent, the app supplies facts — I never let the model restate content I already have."
Turning a catch into a principle is the strongest 20 seconds available in this interview.

**Q10. "What's wrong with CommandMail? You built it — indict it."**
**Why:** Seniors know their debt precisely. Vague self-criticism ("could be cleaner") fails; precise debt ("900-line provider, 1+N fetch, in-process hub caps me at one instance, no rate limiting on the assistant route") passes.

## Phase 3 — Mapping you onto CreatoRain (minutes 15–23)

**Q11. "We do agentic outreach — AI-composed emails to creators, at scale. You built AI email composition for one user. What changes at 1,000 sends a day?"**
**Why:** THE transfer question. His product is your project, scaled. This is where the hire decision actually happens.
**Your shape (think out loud, slowly):** batching and queueing instead of interactive loops; the draft-gate becomes review workflows (sample-based review, confidence thresholds, per-template approval instead of per-email); deliverability becomes first-class — SES bounces, complaints, suppression, per-domain rate limits; personalization prompts become versioned templates with evals; cost guardrails per campaign; and an audit trail for every AI-sent email. Anchor each point back to something you actually built (versioned prompts → template versioning; draft-gate → review queue; OIDC webhook → SES event webhooks).

**Q12. "Our core API is Express, not Next.js. Problem?"**
**Why:** Stack flexibility check.
**Shape:** "No — BrickShare's backend is a standalone Express + Prisma + Postgres API I built end to end. Next Server Actions and Express handlers are the same job with different wiring: auth middleware instead of getServerSession, routes instead of actions. The judgment transfers; the syntax is a week."

**Q13. "Postgres: 700k creator rows, a search endpoint is slow. What do you do — concretely?"**
**Why:** The JD's hardest hard-skill requirement, and your thinnest provable area. He may go stepwise.
**Shape:** "First, measure: `EXPLAIN ANALYZE` on the real query. Look for seq scans and row-estimate misses. Then the boring fixes in order: right index for the actual predicate — composite, partial, or GIN for text search; cursor pagination instead of offset; then question the query shape itself. If it's full-text relevance search, Postgres `tsvector` first — Elasticsearch only when Postgres actually fails, not before."
↳ "What's a partial index?" ↳ "Offset vs cursor — why?" ↳ "When do you denormalize?" — Study these three cold; they're his daily reality.
**And be honest at the edge:** "I'll be straight — my Postgres work is correctness and schema design at small scale. I know the tuning toolbox; I haven't had to use it in anger yet."

**Q14. "AWS — SES, S3, Amplify. Where are you with those?"**
**Why:** JD requirement, resume lists AWS, he'll verify. **Honest-gap script. Do not bluff — one probing follow-up exposes it and costs you everything else.**

**Q15. "Scraping — Bright Data, Apify, in-house. Experience?"**
**Why:** Same. Honest gap + nearest real experience (RAG ingestion pipelines) + learning speed.

**Q16. "How do you use Claude Code, mechanically? Not the pitch — the workflow."**
**Why:** His team's daily driver. He wants to hear a real process: specs, constraints, review discipline, verification gates.
↳ "What do you do when it writes code you don't understand?" — "I don't merge it. I ask it to explain or simplify, or I rewrite it by hand. Code I can't defend isn't mine, and everything I merge is mine."
↳ "How do you keep it from wrecking a codebase?" — investigate-first prompts, smallest-change constraints, typecheck/lint/test gates, one-feature-per-commit.

## Phase 4 — Working with you (minutes 23–28)

**Q17. "You'll be remote, contract, two hours of overlap. How do I know what you're doing?"**
**Why:** The "proactive, reliable status updates" line in the JD is there because someone burned him. He's buying predictability.
**Shape:** "You won't have to ask. Daily written update — what moved, what's blocked, what's next. Demos over descriptions: I send links, not promises. And bad news travels fastest — if a deadline is at risk, you hear it the day I know, with options."

**Q18. "Deadline is Friday. It's Wednesday. You're 60% done. What do you do?"**
**Why:** Client-launch behavior.
**Shape:** "Tell you Wednesday, not Friday. Bring a cut list, not just a problem — here's the smallest correct thing that ships Friday, here's what moves to next week, here's the risk of each. Scope bends. Correctness and the date don't."

**Q19. "What do you need from me to do your best work?"**
**Why:** Tests self-knowledge and whether you'll manage upward.

**Q20. "Questions for me?"**
**Why:** Quality of questions = quality of thinking. Pick 3 from INTERVIEW_GUIDE section 9 — lead with the 700k-bottleneck one or the human-review-loop one; they show you're already thinking inside his product.

---

## The trick-question index (could surface anywhere)

1. **"Isn't your executor just tool-calling with extra steps?"** → own the similarity, name the difference (authority + human gate).
2. **The README forward_email drift** → own it instantly, land the principle.
3. **"Your resume says AWS/Playwright/GraphQL — tell me about your deepest work with [one]."** → honest depth or pre-soften the resume.
4. **"Why is your GitHub bio 'Frontend focused' if you're a senior full-stack?"** → fix the bio before the call; if asked: "Stale — my last two years say otherwise."
5. **"Your repo says BrickShare but I couldn't find it."** → it's `fintech_app`; rename before the call.
6. **"What's Solinify?"** (portfolio mentions it, resume doesn't) → one honest sentence.
7. **"If I asked Claude Code to build CommandMail from your prompts, would it produce your repo?"** → "No — it would produce a first draft of it. The repo is a few hundred decisions, rejections, and production bug-fixes on top of first drafts. That's the difference between generating code and engineering."
8. **"Your app caps the AI at what the UI can do. Our product needs the AI to do MORE than the UI. Is your instinct wrong for us?"** → "Different trust model for a different product. Mine was right for an untrusted model holding a user's real mailbox. Yours amortizes trust across review workflows and evals. The shared instinct is: decide where model authority ends *on purpose*. That transfers; the specific gate doesn't have to."
9. **"How long did CommandMail actually take?"** → answer truthfully and specifically; builders know their timeline, embellishers round up.
10. **"Show me the ugliest code in your repo."** → have a real answer (the AssistantProvider) and what you'd do about it. Pretending there is none fails.

---

## How Peter scores this (read his mind)

| Signal | He's asking himself | You win with |
|---|---|---|
| Ownership | "Can I give him a feature and walk away?" | spec→ship→verify stories, deferred-loudly decisions |
| Authenticity | "Did he build what he claims?" | file-level detail, war stories, owning the drift |
| Judgment | "Will he make good calls without me?" | trade-offs with rejected alternatives, knowing when his own choices are wrong |
| Reliability | "Will he vanish or surprise me late?" | gap answers, status-update philosophy, Wednesday-not-Friday |
| Stack fit | "Productive in week one?" | Express/Postgres stories, honest AWS/scraping gaps with closing plans |
| AI maturity | "Does he ship AI or demo AI?" | containment thinking, versioned prompts, eval instincts, cost awareness |

# CommandMail

An email client where an AI assistant can drive the UI, not just answer questions about it. Built for the Processity.ai hiring task: "build a mail app where the AI controls the UI."

Gmail is the mail provider (OAuth, real sends, real threads — nothing mocked). The assistant sits in a floating panel and can compose, search, open, and reply to email through natural language, and the actual inbox/compose UI updates as it does.

## Features

- **Mailboxes** — Inbox, Sent, Drafts, Archive, Trash
- **Conversation view** — full thread reading, plus a distraction-free Focus Mode (`F` to toggle, `Esc` to exit)
- **Compose & reply** — real Gmail sends; replies thread correctly (`In-Reply-To` / `References`)
- **Read/unread tracking**, toast feedback on send/search/session errors
- **AI assistant** — see below

## Screens

```
Login → Mailbox (Inbox/Sent/Drafts/Archive/Trash) → Conversation → Focus Mode
```

Plus the assistant panel, floating over all of the above.

## AI assistant

Things you can say to it:

- _"Send an email to john@example.com, subject Meeting Tomorrow, body Let's meet at 3pm"_ — opens the compose card and types the fields in, visibly, not instantly
- _"Show me emails from the last 10 days"_ — the inbox list itself swaps to the results; it's not a chat-only answer
- _"Open the latest email from David"_ — jumps to that thread in the detail view
- _"Reply to this"_ (while reading a thread) — drafts a reply against that specific conversation

It runs on Groq, and every response is validated against a five-action schema (`compose_email`, `send_email`, `search_emails`, `open_email`, `reply_email`) before anything happens — the model can't do anything outside that list, and it never touches Gmail or the DOM directly. Drafts render as cards with live status (preparing → writing → sending → sent/failed), not plain text, and nothing sends without an explicit follow-up like "send it" or a button click.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the assistant pipeline, prompt compression, and response caching.

## Principles

A few rules the codebase tries to hold to:

- Gmail is an integration, not the product — the UI only talks to normalized domain types (`MailThread`, `MailConversation`, `MailDraft`), never raw Gmail payloads, so swapping providers shouldn't touch the UI
- The assistant is a second caller of the same mail Server Actions the UI uses (send, reply, search, mark-read) — never a separate path with its own side effects
- Vertical slices over horizontal layers — each commit ships something you can actually click through
- Add abstractions when repetition shows up, not before
- The URL owns state that should survive a refresh or a shared link; everything else stays local until that's not enough

Full breakdown — data flow diagrams, state ownership, the assistant pipeline — is in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Tech stack

| Layer     | Technology                                                  |
| --------- | ----------------------------------------------------------- |
| Framework | Next.js 16 (App Router), React 19, TypeScript               |
| Styling   | Tailwind CSS v4, shadcn/ui, Radix UI                        |
| Auth      | Auth.js (`next-auth@4`), Google OAuth                       |
| AI        | Groq (`llama-4-scout-17b-16e-instruct`), Zod-validated JSON |
| Mail      | Gmail REST API via `fetch()` — no SDK                       |

## Getting started

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/login`. Sign in with Google and you land on `/app`.

You'll need a Google Cloud project with the Gmail API enabled and an OAuth 2.0 client (Web application) — set the redirect URI below, and add the `gmail.modify` scope on the consent screen if it's not in testing mode with your own account.

| Variable                                    | Required               | Notes                                                                                |
| ------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| `NEXTAUTH_SECRET`                           | Yes                    | Session encryption secret                                                            |
| `NEXTAUTH_URL`                              | Yes                    | e.g. `http://localhost:3000`                                                         |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Yes                    | OAuth client — redirect URI must be `http://localhost:3000/api/auth/callback/google` |
| `GROQ_API_KEY`                              | Yes, for the assistant | Groq API key used by `/api/assistant`                                                |
| `ASSISTANT_MODEL`                           | No                     | Overrides the default model                                                          |

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`, `npm run format`.

## Screenshots

<!-- TODO: login, mailbox view, conversation view, focus mode -->
<!-- TODO: short demo video — assistant composing / searching / replying -->

## Current limitations

- Gmail only — no other providers
- No real-time sync; the inbox refreshes on navigation or after send, not automatically
- No UI filter controls — the assistant can filter via Gmail query syntax, but there are no dropdowns/date pickers yet
- No forwarding via the assistant, and no explicit "are you sure?" step before send (the draft-first flow is the safeguard today)
- HTML emails are converted to plain text
- No tests, not deployed

## What I'd improve with more time

- Real-time sync (Gmail push/Pub-Sub, or polling as a fallback) — the one graded requirement I haven't started
- UI filter controls, reusing the Gmail query logic the assistant already has
- Forward via assistant, and an explicit send confirmation step
- Tests around the assistant's action validation and the mail Server Actions
- Decide whether to keep `local-intent-router.ts` — it fast-paths a few common replies ("send it", "cancel") around the LLM call, but now that the prompt is small, the savings may not be worth maintaining a second place that interprets natural language

## Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — implementation details, data flow, state management, assistant pipeline
- [milestone.md](./milestone.md) — progress notes and what's next, against the hiring brief
- [ENGINEERING_GUIDELINES.md](./ENGINEERING_GUIDELINES.md) — contribution conventions

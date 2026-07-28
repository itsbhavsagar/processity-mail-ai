# PROJECT_STORY.md — CommandMail, Over Coffee

*This is the story in your voice. Short sentences on purpose — easy to speak, easy to restart if you pause. Don't memorize it. Read it until it feels like remembering.*

---

## How it started

I got a hiring assignment from Processity.
One line: "build a mail app where the AI controls the UI."

Most people would read that as: inbox plus chatbot.
I read it differently.
"Controls the UI" means the AI has to *do* things.
Fill forms. Change views. Open threads.

And that raises a scary question.
How do you give a language model control — without giving it power you can't bound?

## The first idea, and why I killed it

The fast way is obvious.
Give the model tools. A `sendEmail` function. A `searchGmail` function.
Let it call them.

I rejected that on day one.
Because then the model is a second privileged actor.
The user acts through buttons. Known behavior.
The model would act through its own private API.
And the only thing bounding it would be a prompt.

Prompts are not a security boundary.
Emails are attacker-controlled input. They go straight into the model's context.
If the model has its own path to Gmail, a malicious email can steer it.

I couldn't answer: "what's the worst thing an email can make the AI do?"
So I flipped the design.

## The idea that shaped everything

The assistant is a second caller of the same code the buttons call.

The model outputs one thing.
A `thought` — one sentence the user reads.
Plus a list of typed actions. Seven verbs. That's it.
Compose. Send. Search. Open. Reply. Forward. Navigate.

Every action is validated with Zod.
Then a small executor runs it through the same Server Actions a click uses.

So the worst thing the model can do
is exactly the worst thing a user can do with a mouse.

That one decision built the rest of the architecture.
Shared code paths need clean code paths.
So Gmail went behind a domain layer.
Writes went into Server Actions.
And the action schema became the contract.

## The second decision: real Gmail

The brief didn't force real Gmail.
But a mail app that fakes mail proves nothing.
The hard parts live in the integration.
OAuth. Token refresh. MIME. Threading headers. Push notifications.

I decided the pain was the point.
And honestly — every good story I have came from that pain.

## How it grew

I built it in layers.

First the mail core.
OAuth with NextAuth. Real inbox. Conversation view.
Compose and reply with hand-built MIME — no SDK, just `fetch`.

Then the assistant.
The schema. The executor. The prompt.
The compose card that types itself in — field by field.
That animation is the moment the assignment becomes visible.

Then realtime. The hardest part.
Gmail `users.watch` → Pub/Sub → my webhook → an in-process hub → SSE → the browser.
New mail appears with no refresh.
Plus a cron to renew watches, because Gmail kills them after seven days.

Then hardening.
Rich cards for search results.
Dark mode — which broke email rendering and taught me about iframes.
Forwarding — which took half a day, because the architecture made it cheap.
38 unit tests over the pure logic.
Docker, multi-stage, secretless build.
And deployment on Render.

## The production fight

Deployed. Everything worked. Except realtime.
Emails arrived in Gmail. The app only updated on refresh.

The pipeline crosses four systems.
And every failure looks identical from the browser: nothing happens.

So I debugged it hop by hop.
Proved the SSE stream was healthy — fetched it raw from the console.
That pinned the break upstream.
Found two missing env vars — the webhook was rejecting every push with a 401.
Fixed that. Still dead.
Then found the real one: the Pub/Sub subscription was created as **Pull**.
Google was never calling my endpoint at all.
Recreated it as an authenticated Push subscription. Live sync came alive.

That night taught me more than the build did.
Instrument boundaries. Read the provider's metrics.
The first missing log line names the broken hop.

## What it became

CommandMail.
A mail client you command.
Not a chatbot with an inbox attached.
An inbox where language is one more input device — wired to the same controls as the mouse.

Live on Render. Real Gmail. Nothing mocked.

## The one-line versions (memorize these shapes, not words)

- **What is it?** "A Gmail client where the AI operates the UI — through typed, validated actions that run the same code the buttons run."
- **Why is it safe?** "The model can do everything the UI can do. And nothing more."
- **Why real Gmail?** "Because the integration is where the engineering lives."
- **Hardest part?** "Realtime in production. Four systems, one silent failure."
- **Proudest part?** "Adding forward was a schema entry, an executor case, and prompt rules. When features get cheap, the architecture is working."

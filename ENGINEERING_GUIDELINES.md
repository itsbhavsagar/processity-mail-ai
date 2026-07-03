# Engineering Guidelines

These guidelines define how we build CommandMail.  
They apply to both human contributors and AI-assisted contributions.

## 1) UI Library First

Use shadcn/ui (Radix-based) for reusable UI primitives whenever available.

Examples: `Button`, `Input`, `Textarea`, `Card`, `Dialog`, `Sheet`, `Drawer`, `DropdownMenu`, `Tooltip`, `Avatar`, `Badge`, `Tabs`, `Popover`, `Command`, `ScrollArea`, `Separator`, `Skeleton`, `AlertDialog`, `ContextMenu`.

If a suitable shadcn primitive exists, use it.

## 2) No Unnecessary Wrappers

Do not wrap shadcn primitives without clear product value.

- Good: use `<Button variant="secondary" />` directly.
- Bad: create `<PrimaryButton>` that only wraps `<Button>`.

## 3) Build Compositions, Not Thin Abstractions

Custom components are encouraged when they represent product behavior or compose multiple primitives meaningfully.

- Good: `ComposeEmailDialog`, `AssistantPanel`, `WorkspaceEmptyState`.
- Bad: `MyInput`, `MyButton`, `ContainerBox` with no domain purpose.

## 4) Framer Motion Usage

Use Framer Motion intentionally for:

- page/panel transitions
- dialogs/sheets
- loading/empty states
- assistant thinking/streaming
- meaningful hover or arrival interactions

Avoid excessive `motion.*` usage for static layout.

## 5) DRY = No Repeated Knowledge

Do not duplicate canonical definitions across files.

- Good: one `MAIL_NAVIGATION_ITEMS` constant.
- Bad: repeating nav labels in multiple components.

## 6) Component Existence Test

Every component must answer: "Why does this exist?"

If the reason is unclear, do not create it.

## 7) Feature Boundaries

Keep concerns in their layer:

- `features/mail` -> mail product UI/logic
- `features/assistant` -> assistant product UI/logic
- `features/auth` -> authentication flows
- `app/(main)/app/_components` -> app shell/layout-only components

Do not mix feature logic into shell components.

## 8) Single Responsibility

Components should have one clear responsibility.

Example: `AppHeader` is presentation-only and should not fetch Gmail or invoke AI logic.

## 9) No Early Abstraction

Do not introduce abstractions until they are justified by repeated use.

Avoid speculative folders/patterns.

## 10) Vertical Slice Development

Each commit should deliver a working, user-visible increment.

Prefer:

1. end-to-end thin slice
2. then iteration

Avoid utility-only commits with no product outcome.

## 11) Service Boundary Contract

Services (`services/gmail`, `services/ai`) expose app-level methods (e.g. `listInbox`, `getThread`, `sendMail`) and hide provider SDK response shapes.

UI and feature layers must not depend on provider-specific objects.

## 12) State Management Rules

Choose the simplest state owner for the problem.

- Server Components own authenticated server data whenever possible.
- React Context for shared UI workflows (e.g. Assistant).
- TanStack Query for client-side server state when caching/refetching is needed.
- Zustand only for global client state that doesn't naturally belong in Context.
- React Hook Form for forms.
- Zod for validation.

Do not introduce global state unless local or contextual state is insufficient.

## 13) Styling Rules

- Tailwind + shadcn tokens only
- No CSS Modules
- No styled-components
- No inline styles except rare runtime-calculated values

## 14) Icon Policy

Use only:

- Lucide (shadcn ecosystem)
- React Icons

Do not introduce additional icon libraries unless approved.

## 15) AI Interaction Boundary

AI must never manipulate DOM directly.

Always flow through:

AI -> Tool -> Application state/service -> React UI

No `document.querySelector`-style imperative UI manipulation.

## 16) Definition of "Custom Component"

Custom components are allowed and encouraged when they are product-specific or meaningful compositions.

Examples:

- `ComposeEmailDialog` (custom, built with shadcn primitives)
- `AssistantPanel` (custom, product-specific)

Not allowed:

- trivial wrappers that only rename a primitive.

## 17) Contribution Checklist

Before opening or merging a change:

1. Follows layer boundaries
2. Uses shadcn primitives where applicable
3. Avoids unnecessary abstraction
4. Keeps provider details inside services
5. Passes lint, typecheck, and build

## 18) Simplicity First

Choose the simplest solution that satisfies the requirement.

Avoid introducing additional layers, routers, managers, wrappers, or abstractions unless they solve a real problem today.

Prefer readable code over clever architecture.

When in doubt, choose the implementation with fewer moving parts.

⸻

## 19) Extend Before Creating

Before creating a new:

- component
- hook
- utility
- service
- context
- helper
- type

first check whether an existing implementation can be extended.

Do not create parallel implementations of existing behavior.

⸻

## 20) One Source of Truth

Avoid duplicate implementations of the same business logic.

Examples:

- One compose pipeline.
- One reply pipeline.
- One filtering engine.
- One search implementation.

The assistant should reuse existing application flows rather than implementing its own versions.

⸻

## 21) Remove Dead Code

Whenever replacing an implementation:

- remove obsolete code
- remove unused files
- remove unused imports
- remove unused types
- remove unused constants

Do not leave abandoned code paths behind.

⸻

## 22) Documentation

Update documentation only when explicitly requested or when the implementation changes make existing documentation incorrect.

Do not rewrite README, architecture documents, or milestone notes unless that is part of the task.

⸻

## 23) Assignment Focus

Prioritize features that improve the working product.

Avoid spending significant time on:

- documentation rewrites
- speculative architecture
- cosmetic refactors

unless specifically requested.

⸻

## 24) Existing Code First

Before writing new code, understand how the existing implementation works.

Prefer integrating into the current architecture over replacing it.

Large rewrites should only happen when there is a clear technical benefit.

⸻

## 25) Human-Readable Code

Write code as an experienced engineer would.

Avoid AI-style code patterns such as:

- unnecessary abstractions
- excessive generic helpers
- over-engineering simple problems
- deeply nested utility layers
- repeating the same defensive checks everywhere
- overly verbose comments that restate the code

Prefer:

- descriptive names
- straightforward control flow
- small focused functions
- code that feels naturally written and easy to maintain

The goal is code that is clear, maintainable, consistent with the surrounding codebase, and easy for another engineer to understand.

---

## 26) Review Before Changes

Never assume a solution is correct.

Before making significant architectural or structural changes:

- explain the proposed approach
- explain why it is needed
- explain any trade-offs
- wait for approval

Small bug fixes do not require this.

---

## 27) No Automatic Commits

Never create commits automatically.

Do not commit, amend, squash, or rebase unless explicitly instructed.

Every commit requires user approval.

---

## 28) Code Review First

After implementing a feature:

1. Stop coding.
2. Present the completed changes.
3. Explain the files modified.
4. Explain any architectural decisions.
5. Wait for user review.

Only continue with cleanup, refactoring, or commits after approval.

---

## 29) No Unrequested Refactoring

While implementing a feature:

- do not rename files
- do not move files
- do not reorganize folders
- do not rewrite existing modules
- do not update documentation

unless it is required for the requested feature or explicitly approved.

Keep pull requests focused on the requested work.

## 30) Finish the Requested Work First

Complete the requested feature before suggesting additional improvements.

Do not interrupt implementation to:

- refactor unrelated code
- reorganize folders
- rewrite documentation
- introduce new architecture
- optimize prematurely

If improvements are identified, list them separately after the requested work is complete and wait for approval before implementing them.

## 31) Validate Before Finishing

Before declaring a feature complete:

- run typecheck
- run lint
- run a production build
- verify the primary user flow manually

Do not assume a successful build means the feature works correctly.

If a feature cannot be tested locally, clearly state what remains unverified.

## 32) Do Not Guess

If the implementation details are unclear:

- inspect the existing code
- follow the current architecture
- ask for clarification if necessary

Do not invent APIs, components, services, or application behavior.

## 33) Preserve Existing Conventions

Follow the conventions already established in the codebase.

Examples:

- naming
- file organization
- imports
- component structure
- error handling
- typing style

Do not introduce a different style within the same project.

## 34) Performance Awareness

Prefer solutions that are efficient and avoid unnecessary work.

Avoid:

- duplicate API requests
- unnecessary renders
- repeated computations
- oversized payloads
- unnecessary AI calls

Optimize only when it improves measurable behavior without making the code significantly more complex.

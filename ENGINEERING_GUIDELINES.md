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

- Server state -> TanStack Query
- UI/client state -> Zustand
- Form state -> React Hook Form
- Validation -> Zod

Keep these roles strict and explicit.

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

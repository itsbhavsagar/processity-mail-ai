# CommandMail

AI-native email application where a conversational assistant controls the UI through natural language.

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4, shadcn/ui, Radix UI, Framer Motion
- Zustand, TanStack Query, React Hook Form, Zod
- ESLint, Prettier

## Getting Started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/app`.

## Structure

```
src/
├── app/          # Routes, layouts, API handlers
├── features/     # Product capabilities
│   ├── assistant/
│   ├── auth/
│   └── mail/
├── services/     # External integrations
│   ├── ai/
│   └── gmail/
├── shared/       # Reusable UI, hooks, lib, types
└── config/       # Env and site config
```

## Scripts

| Command             | Description              |
| ------------------- | ------------------------ |
| `npm run dev`       | Start development server |
| `npm run build`     | Production build         |
| `npm run lint`      | Run ESLint               |
| `npm run format`    | Format with Prettier     |
| `npm run typecheck` | TypeScript check         |

## Adding shadcn/ui components

```bash
npx shadcn@latest add dialog
```

Components install to `src/shared/ui/`.

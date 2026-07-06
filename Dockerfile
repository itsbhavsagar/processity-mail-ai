# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Base: Debian "bookworm" slim + Node 22 LTS.
# Debian (glibc) is used instead of Alpine (musl) because Prisma's query
# engine is far better supported on glibc. OpenSSL + CA certs are required by
# the Prisma engine and by outbound TLS to Google / Groq / Neon.
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------------------------------------------------------------------------
# deps: install ALL dependencies (dev included — the build needs them).
# The prisma schema is copied before `npm ci` so the `postinstall`
# (`prisma generate`) hook can find it. This layer is cached until the
# lockfile or schema changes.
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---------------------------------------------------------------------------
# builder: compile the standalone Next.js server.
# `prisma generate` is re-run here so the engine is generated on THIS OS/libc.
# No secrets are referenced at build time — env vars are injected at runtime.
# ---------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate \
  && npm run build

# ---------------------------------------------------------------------------
# migrator: transient image used to apply migrations against Neon on deploy
# (`docker compose run --rm migrate`). It carries the Prisma CLI + schema so
# the runtime image can stay minimal and migration-free.
#
# This stage is defined BEFORE `runner` on purpose: `runner` must remain the
# LAST stage so a plain `docker build .` (no --target) produces the APP image,
# not the run-once migration job.
# ---------------------------------------------------------------------------
FROM base AS migrator
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY package.json ./
CMD ["npx", "prisma", "migrate", "deploy"]

# ---------------------------------------------------------------------------
# runner: minimal production image and the DEFAULT build target. Only the
# standalone server, static assets, public dir, and the Prisma engine are
# copied — no npm, no source, no dev deps.
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Run as a non-root user.
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# `.next/standalone` bundles the traced node_modules + server.js.
# `public` and `.next/static` are NOT part of standalone and must be copied.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Safety net: guarantee the Prisma client + query engine are present even if a
# future Next version stops tracing the dynamically-loaded engine binary.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000

# Uses Node 22's built-in fetch — no curl/wget needed in the image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

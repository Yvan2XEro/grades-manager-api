# syntax=docker/dockerfile:1
#
# Multi-stage build for apps/secondary.
# Build context: monorepo root (grades-manager-api/)
#
#   docker build -f apps/secondary/Dockerfile -t tkams-secondary .
#
# Required env vars at runtime:
#   BETTER_AUTH_SECRET — min 32 chars
#   BETTER_AUTH_URL   — public URL of this server, e.g. https://secondary.example.com
#   CORS_ORIGINS      — comma-separated allowed origins, e.g. https://app.example.com
#
# Optional:
#   PORT              — defaults to 3001
#   NODE_ENV          — defaults to production
#   USE_PGLITE        — set to "true" to use embedded PGlite instead of PostgreSQL
#   DATABASE_URL      — PostgreSQL connection string (when USE_PGLITE=false)
#   PGLITE_DATA_DIR   — persistent data dir when USE_PGLITE=true (e.g. /data/pglite)
#   PUPPETEER_EXECUTABLE_PATH — override Chromium binary (default: /usr/bin/chromium)

# ─── Stage 1: Install monorepo dependencies ──────────────────────────────────
FROM oven/bun:1.3.10 AS deps

WORKDIR /repo

# Copy only the manifests needed for workspace install (layer cache)
COPY package.json bun.lock bunfig.toml ./
# All workspace package.json files are needed so bun can resolve workspace deps
COPY apps/server/package.json    ./apps/server/package.json
COPY apps/web/package.json       ./apps/web/package.json
COPY apps/website/package.json   ./apps/website/package.json
COPY apps/remotion/package.json  ./apps/remotion/package.json
COPY apps/secondary/package.json ./apps/secondary/package.json
COPY packages/emails/package.json ./packages/emails/package.json

# Skip Puppeteer Chromium download; system Chromium is installed in the runner
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN bun install --frozen-lockfile

# ─── Stage 2: Build React SPA client ─────────────────────────────────────────
FROM deps AS builder

WORKDIR /repo

# Copy app source and shared packages
COPY apps/secondary/ ./apps/secondary/
COPY packages/emails/ ./packages/emails/

WORKDIR /repo/apps/secondary

# Build only the React SPA → dist/
# The Hono server runs natively with bun (no bundling needed).
# Bundling breaks @react-email/render because it uses bun-specific dynamic
# imports (react-dom/server.bun) and requires prettier at runtime — both fail
# when bundled. Bun handles TypeScript natively in production.
RUN bun run build:client

# ─── Stage 3: Production runner ───────────────────────────────────────────────
FROM oven/bun:1.3.10 AS runner

# Install system Chromium for Puppeteer (report-card PDF generation).
RUN apt-get update && \
    apt-get install -y \
      chromium \
      fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
# Drizzle migration files live in the source tree (no bundle means no copy needed)
ENV MIGRATIONS_DIR=/app/apps/secondary/src/db/migrations
# Point Puppeteer to the system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
# Default port (override with PORT env var)
EXPOSE 3001

# Non-root user for container security
# /home/app/data/pglite  — default PGlite data dir (PGLITE_DATA_DIR)
# /home/app/storage       — default file upload dir  (STORAGE_LOCAL_ROOT)
RUN groupadd -r app && useradd -r -g app -s /sbin/nologin app -m -d /home/app && \
    mkdir -p /home/app/data/pglite /home/app/storage/uploads && \
    chown -R app:app /home/app

# Sane defaults for persistent data dirs — override with env vars if needed
ENV PGLITE_DATA_DIR=/home/app/data/pglite
ENV STORAGE_LOCAL_ROOT=/home/app/storage/uploads

# Monorepo root — bun needs package.json + bunfig.toml for workspace resolution
COPY --from=deps --chown=app:app /repo/package.json  ./package.json
COPY --from=deps --chown=app:app /repo/bunfig.toml   ./bunfig.toml

# Full node_modules (all production + dev deps for workspace packages)
COPY --from=deps --chown=app:app /repo/node_modules  ./node_modules

# App source (index.ts, src/, and dist/ from build:client)
COPY --from=builder --chown=app:app /repo/apps/secondary ./apps/secondary

# Shared email package (workspace: @tkams/emails)
COPY --from=builder --chown=app:app /repo/packages/emails ./packages/emails

# bun 1.3+ writes cache to $HOME/.bun
ENV HOME=/home/app
USER app

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3001}/api/auth/get-session 2>/dev/null || exit 1

# Run TypeScript source directly — bun handles it natively, no bundling required
CMD ["bun", "run", "/app/apps/secondary/index.ts"]

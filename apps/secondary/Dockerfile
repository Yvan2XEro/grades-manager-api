# syntax=docker/dockerfile:1
#
# Multi-stage build for apps/secondary.
# Build context: monorepo root (grades-manager-api/)
#
#   docker build -f apps/secondary/Dockerfile -t tkams-secondary .
#
# Required env vars at runtime:
#   DATABASE_URL      — PostgreSQL connection string (USE_PGLITE defaults to false)
#   BETTER_AUTH_SECRET — min 32 chars
#   BETTER_AUTH_URL   — public URL of this server, e.g. https://secondary.example.com
#   CORS_ORIGINS      — comma-separated allowed origins, e.g. https://app.example.com
#
# Optional:
#   PORT              — defaults to 3001
#   NODE_ENV          — defaults to production
#   USE_PGLITE        — set to "true" to use embedded PGlite instead of PostgreSQL
#   PGLITE_DATA_DIR   — persistent data dir when USE_PGLITE=true (e.g. /data/pglite)
#   PUPPETEER_EXECUTABLE_PATH — override Chromium binary (default: /usr/bin/chromium)

# ─── Stage 1: Install monorepo dependencies ──────────────────────────────────
FROM oven/bun:1.2.21 AS deps

WORKDIR /repo

# Copy only the manifests needed for workspace install (layer cache)
COPY package.json bun.lock bunfig.toml ./
# All workspace package.json files are needed so bun can resolve workspace deps
COPY apps/server/package.json    ./apps/server/package.json
COPY apps/web/package.json       ./apps/web/package.json
COPY apps/website/package.json   ./apps/website/package.json
COPY apps/remotion/package.json  ./apps/remotion/package.json
COPY apps/secondary/package.json ./apps/secondary/package.json

# Skip Puppeteer Chromium download; system Chromium is installed in the runner
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN bun install --frozen-lockfile

# ─── Stage 2: Build client + server ──────────────────────────────────────────
FROM deps AS builder

WORKDIR /repo

# Copy the secondary app source (client + server)
COPY apps/secondary/ ./apps/secondary/

WORKDIR /repo/apps/secondary

# 1. Build React SPA → dist/
# 2. Bundle Hono server → out/index.js  (bun --target bun bundles all JS deps)
# 3. Copy PGlite WASM blobs so the server can fall back to embedded DB if needed
RUN bun run build:client && \
    bun build ./index.ts --outdir ./out --target bun && \
    cp -r ./src/db/migrations ./out/migrations && \
    cp /repo/node_modules/@electric-sql/pglite/dist/postgres.data ./out/ && \
    cp /repo/node_modules/@electric-sql/pglite/dist/postgres.wasm ./out/

# ─── Stage 3: Production runner ───────────────────────────────────────────────
FROM oven/bun:1.2.21 AS runner

# Install system Chromium for Puppeteer (report-card PDF generation)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      chromium \
      fonts-liberation \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libcups2 \
      libdbus-1-3 \
      libgdk-pixbuf2.0-0 \
      libgtk-3-0 \
      libnspr4 \
      libnss3 \
      libxcomposite1 \
      libxdamage1 \
      libxrandr2 \
      libx11-xcb1 \
      xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
# Tell the server bundle where Drizzle SQL migrations live at runtime
ENV MIGRATIONS_DIR=/app/migrations
# Point Puppeteer to the system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
# Default port (override with PORT env var)
EXPOSE 3001

# Bundled Hono server + PGlite WASM blobs
COPY --from=builder /repo/apps/secondary/out/ ./out/

# Built React SPA (served by Hono serveStatic from ./dist)
COPY --from=builder /repo/apps/secondary/dist/ ./dist/

# Drizzle SQL migration files — applied at startup by pushSchema()
COPY --from=builder /repo/apps/secondary/src/db/migrations/ ./migrations/

# Non-root user for container security
RUN groupadd -r app && useradd -r -g app -s /sbin/nologin app
USER app

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3001}/api/auth/get-session 2>/dev/null || exit 1

CMD ["bun", "./out/index.js"]

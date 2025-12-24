FROM oven/bun:1 AS base
WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Install all workspaces once so we can build the server bundle
FROM base AS deps
COPY bun.lock bunfig.toml package.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN PUPPETEER_SKIP_DOWNLOAD=true CYPRESS_INSTALL_BINARY=0 bun install --backend=hardlink --verbose

# Compile the API (tsdown emits ESM into apps/server/dist)
FROM deps AS build
COPY . .
RUN bun run --filter server build

# Runtime image with only the server workspace and production deps
FROM base AS runtime
WORKDIR /usr/src/app

# Install Chromium for Puppeteer and PostgreSQL client for migrations
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libxss1 \
    libappindicator3-1 \
    libasound2 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json bun.lock bunfig.toml ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN PUPPETEER_SKIP_DOWNLOAD=true bun install --ci --production --filter server --backend=hardlink --verbose

# Copy built application
COPY --from=build /usr/src/app/apps/server/dist ./apps/server/dist
COPY --from=build /usr/src/app/apps/server/storage ./apps/server/storage
COPY --from=build /usr/src/app/apps/server/src/db/migrations ./apps/server/dist/db/migrations

# Copy database schema and config for migrations/push
COPY --from=build /usr/src/app/apps/server/src/db ./apps/server/src/db
COPY --from=build /usr/src/app/apps/server/drizzle.config.ts ./apps/server/drizzle.config.ts

# Create seed directory for optional volume mount
RUN mkdir -p /usr/src/app/apps/server/seed

# Copy and setup entrypoint script
COPY apps/server/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

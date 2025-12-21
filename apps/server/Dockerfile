FROM oven/bun:1 AS base
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Install all workspaces once so we can build the server bundle
FROM base AS deps
COPY bun.lock bunfig.toml package.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN bun install --ci

# Compile the API (tsdown emits ESM into apps/server/dist)
FROM deps AS build
COPY . .
RUN bun run --filter server build

# Runtime image with only the server workspace and production deps
FROM base AS runtime
WORKDIR /usr/src/app
COPY package.json bun.lock bunfig.toml ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN bun install --ci --production --filter server
COPY --from=build /usr/src/app/apps/server/dist ./apps/server/dist
COPY --from=build /usr/src/app/apps/server/storage ./apps/server/storage

ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "--filter", "server", "start"]

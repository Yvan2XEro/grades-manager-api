ARG VITE_SERVER_URL="http://localhost:3000"
ARG VITE_DEFAULT_ORGANIZATION_SLUG="sgn-institution"

FROM oven/bun:1 AS base
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Install dependencies for all workspaces to leverage Bun's cache
FROM base AS deps
ARG VITE_SERVER_URL
ARG VITE_DEFAULT_ORGANIZATION_SLUG
COPY bun.lock bunfig.toml package.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN bun install --ci

# Build the Vite bundle
FROM deps AS build
ARG VITE_SERVER_URL
ARG VITE_DEFAULT_ORGANIZATION_SLUG
ENV VITE_SERVER_URL=${VITE_SERVER_URL}
ENV VITE_DEFAULT_ORGANIZATION_SLUG=${VITE_DEFAULT_ORGANIZATION_SLUG}
COPY . .
RUN bun run --filter web build

# Runtime layer keeps Bun so we can serve through `vite preview`
FROM base AS runtime
WORKDIR /usr/src/app
COPY package.json bun.lock bunfig.toml ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN bun install --ci --filter web
COPY --from=build /usr/src/app/apps/web ./apps/web

ENV PORT=4173
EXPOSE 4173
CMD ["bun", "run", "--filter", "web", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]

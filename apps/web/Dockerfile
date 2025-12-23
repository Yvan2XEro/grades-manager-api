ARG VITE_SERVER_URL="http://localhost:3000"
ARG VITE_DEFAULT_ORGANIZATION_SLUG="sgn-institution"

FROM oven/bun:alpine AS base
WORKDIR /app

FROM base AS deps
COPY bun.lock bunfig.toml package.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN bun install

FROM base AS builder
ARG VITE_SERVER_URL
ARG VITE_DEFAULT_ORGANIZATION_SLUG
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_DEFAULT_ORGANIZATION_SLUG=$VITE_DEFAULT_ORGANIZATION_SLUG
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run --filter web build

FROM oven/bun:alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN bun add --global serve
COPY --from=builder /app/apps/web/dist ./dist
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]

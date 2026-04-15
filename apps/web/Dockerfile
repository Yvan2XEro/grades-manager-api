FROM oven/bun:alpine AS base
WORKDIR /app

FROM base AS deps
COPY bun.lock bunfig.toml package.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN PUPPETEER_SKIP_DOWNLOAD=true CYPRESS_INSTALL_BINARY=0 bun install --backend=hardlink --verbose

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN cd apps/web && bun run build

FROM oven/bun:alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN bun add --global serve
COPY --from=builder /app/apps/web/dist ./dist
COPY apps/web/docker-entrypoint.sh /usr/local/bin/web-docker-entrypoint.sh
RUN chmod +x /usr/local/bin/web-docker-entrypoint.sh
EXPOSE 4173
ENTRYPOINT ["/usr/local/bin/web-docker-entrypoint.sh"]

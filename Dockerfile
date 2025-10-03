
FROM oven/bun:latest

WORKDIR /usr/src/app

COPY . .

RUN bun install --ci
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start:server"]

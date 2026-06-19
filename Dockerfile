
FROM oven/bun:latest

WORKDIR /usr/src/app

COPY . .

RUN bun install --ci
RUN bun run build

EXPOSE 3000

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]

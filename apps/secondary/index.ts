import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { pushSchema } from "./src/db/index";
import { auth } from "./src/lib/auth";
import { createContext } from "./src/lib/context";
import { appRouter } from "./src/routers/index";

// Apply migrations on startup (no-op for PostgreSQL, runs migrator for PGlite)
await pushSchema();

const app = new Hono();

const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
	.split(",")
	.map((o) => o.trim());

app.use(
	"*",
	cors({
		origin: (origin) =>
			allowedOrigins.includes(origin) ? origin : allowedOrigins[0]!,
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", "X-Organization-Slug"],
		credentials: true,
		maxAge: 86400,
	}),
);

app.on(["GET", "POST"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext,
	}),
);

app.use("/*", serveStatic({ root: "./dist" }));
app.get("/*", serveStatic({ path: "./dist/index.html" }));

export default {
	port: Number(process.env.PORT ?? 3001),
	fetch: app.fetch,
};

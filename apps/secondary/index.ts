import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { pushSchema } from "./src/db/index";
import { auth } from "./src/lib/auth";
import { createContext } from "./src/lib/context";
import { getStorageAdapter } from "./src/lib/storage";
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

// ─── File upload endpoint ────────────────────────────────────────────────────
// POST /api/upload — multipart/form-data with field "file"
// Returns { url, key, contentType, size }
app.post("/api/upload", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const formData = await c.req.formData();
	const file = formData.get("file");
	if (!file || !(file instanceof File)) {
		return c.json({ error: "Missing file field" }, 400);
	}

	const maxSize = 10 * 1024 * 1024; // 10 MB
	if (file.size > maxSize) {
		return c.json({ error: "File too large (max 10 MB)" }, 413);
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const storage = await getStorageAdapter();
	const stored = await storage.save({
		buffer,
		filename: file.name,
		mimeType: file.type || "application/octet-stream",
	});
	return c.json(stored);
});

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

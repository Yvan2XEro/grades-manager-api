import { trpcServer } from "@hono/trpc-server";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { user as userTable } from "./src/db/auth";
import { db, pushSchema } from "./src/db/index";
import { institutions } from "./src/db/schema";
import { auth } from "./src/lib/auth";
import { createContext } from "./src/lib/context";
import { getStorageAdapter } from "./src/lib/storage";
import { appRouter } from "./src/routers/index";

// Apply migrations on startup (no-op for PostgreSQL, runs migrator for PGlite)
await pushSchema();

// Bootstrap system admin from env vars on first boot
async function bootstrapSystemAdmin() {
	const email = process.env.SYSTEM_ADMIN_EMAIL;
	const password = process.env.SYSTEM_ADMIN_PASSWORD;
	const name = process.env.SYSTEM_ADMIN_NAME ?? "System Admin";
	if (!email || !password) return;

	const existing = await db
		.select()
		.from(userTable)
		.where(eq(userTable.email, email))
		.limit(1);
	if (existing.length > 0) return;

	await auth.api.signUpEmail({ body: { email, password, name } });
	await db
		.update(userTable)
		.set({ role: "admin" })
		.where(eq(userTable.email, email));
	console.log(`[bootstrap] System admin created: ${email}`);
}

await bootstrapSystemAdmin();

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

// ─── Institution setup endpoint ─────────────────────────────────────────────
// POST /api/setup/institution — creates a Better-Auth org + sec_institutions
// record atomically for first-time users who have no institution yet.
app.post("/api/setup/institution", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const body = await c.req.json<{ name: string }>();
	const name = (body?.name ?? "").trim();
	if (!name) return c.json({ error: "name is required" }, 400);

	const slug = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "")
		.slice(0, 50);

	// Create the Better-Auth organization (sets the creator as owner/admin)
	const orgResp = await auth.api.createOrganization({
		headers: c.req.raw.headers,
		body: { name, slug },
	});
	if (!orgResp || !orgResp.id) {
		return c.json({ error: "Failed to create organization" }, 500);
	}

	// Create the matching sec_institutions record (orgId links to Better-Auth org)
	await db
		.insert(institutions)
		.values({ orgId: orgResp.id, name })
		.onConflictDoNothing();

	return c.json({ id: orgResp.id, name });
});

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext,
	}),
);

// Serve uploaded files from local storage
app.use("/uploads/*", serveStatic({ root: "./storage" }));

app.use("/*", serveStatic({ root: "./dist" }));
app.get("/*", serveStatic({ path: "./dist/index.html" }));

export default {
	port: Number(process.env.PORT ?? 3001),
	fetch: app.fetch,
};

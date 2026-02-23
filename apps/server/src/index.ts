import { trpcServer } from "@hono/trpc-server";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db } from "./db";
import { institutions } from "./db/schema/app-schema";
import { organization } from "./db/schema/auth";
import { auth } from "./lib/auth";
import { createContext } from "./lib/context";
import { startBackgroundJobs } from "./lib/jobs";
import { appRouter } from "./routers/index";

const app = new Hono();

app.use(logger());
app.use("/static/*", serveStatic({ root: "./" }));
if ((process.env.STORAGE_DRIVER ?? "local") === "local") {
	const uploadsPath = process.env.STORAGE_LOCAL_PUBLIC_PATH ?? "/uploads";
	const uploadsRoot = process.env.STORAGE_LOCAL_ROOT ?? "./storage/uploads";
	app.use(
		`${uploadsPath}/*`,
		serveStatic({
			root: uploadsRoot,
			rewriteRequestPath: (path) =>
				path.replace(new RegExp(`^${uploadsPath}`), ""),
		}),
	);
}
app.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGINS?.split(",") || [],
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", "X-Organization-Slug"],
		credentials: true,
	}),
);

app.get("/api/public/branding/:slug", async (c) => {
	const slug = c.req.param("slug");
	const [result] = await db
		.select({
			slug: organization.slug,
			nameFr: institutions.nameFr,
			nameEn: institutions.nameEn,
			shortName: institutions.shortName,
			sloganFr: institutions.sloganFr,
			sloganEn: institutions.sloganEn,
			logoUrl: institutions.logoUrl,
			coverImageUrl: institutions.coverImageUrl,
			contactEmail: institutions.contactEmail,
			website: institutions.website,
		})
		.from(organization)
		.innerJoin(institutions, eq(institutions.organizationId, organization.id))
		.where(eq(organization.slug, slug))
		.limit(1);
	if (!result) {
		return c.json({ error: "Organization or institution not found" }, 404);
	}
	return c.json(result);
});

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);
app.get("/", (c) => {
	return c.text("OK");
});

const cleanupJobs = await startBackgroundJobs();

// Graceful shutdown
process.on("SIGTERM", async () => {
	await cleanupJobs();
	process.exit(0);
});

export default app;

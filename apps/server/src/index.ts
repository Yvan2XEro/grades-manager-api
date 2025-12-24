import { trpcServer } from "@hono/trpc-server";
import "dotenv/config";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
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
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

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

startBackgroundJobs();

export default app;

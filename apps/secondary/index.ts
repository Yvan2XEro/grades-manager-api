import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { auth } from "./src/lib/auth";
import { createContext } from "./src/lib/context";
import { appRouter } from "./src/routers/index";

const app = new Hono();

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

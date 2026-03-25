import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { db } from "@/db";
import { diplomationApiKeys } from "@/db/schema/app-schema";

export function hashApiKey(raw: string): string {
	return createHash("sha256").update(raw).digest("hex");
}

export async function apiKeyMiddleware(c: Context, next: Next) {
	const raw = c.req.header("X-Api-Key");
	if (!raw) {
		return c.json({ error: "Missing X-Api-Key header" }, 401);
	}
	const hash = hashApiKey(raw);
	const record = await db.query.diplomationApiKeys.findFirst({
		where: and(
			eq(diplomationApiKeys.keyHash, hash),
			eq(diplomationApiKeys.isActive, true),
		),
	});
	if (!record) {
		return c.json({ error: "Invalid or inactive API key" }, 401);
	}
	// Non-blocking update of lastUsedAt
	db.update(diplomationApiKeys)
		.set({ lastUsedAt: new Date() })
		.where(eq(diplomationApiKeys.id, record.id))
		.catch(() => {});
	c.set("apiKeyRecord", record);
	await next();
}

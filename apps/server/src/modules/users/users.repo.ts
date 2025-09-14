import { and, eq, gt, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";

export async function list(opts: {
	cursor?: string | null;
	limit?: number;
	role?: string;
}) {
	const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
	let condition: SQL<unknown> | undefined;
	if (opts.role) {
		condition = eq(user.role, opts.role);
	}
	if (opts.cursor) {
		const cursorCond = gt(user.id, opts.cursor);
		condition = condition ? and(condition, cursorCond) : cursorCond;
	}
	const items = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
		})
		.from(user)
		.where(condition)
		.orderBy(user.id)
		.limit(limit + 1);
	let nextCursor: string | undefined;
	if (items.length > limit) {
		const nextItem = items.pop();
		nextCursor = nextItem?.id;
	}
	return { items, nextCursor };
}

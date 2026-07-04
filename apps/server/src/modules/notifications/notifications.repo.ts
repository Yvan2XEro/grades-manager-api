import {
	and,
	asc,
	count,
	desc,
	eq,
	gt,
	isNull,
	lt,
	lte,
	or,
	sql,
} from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function createNotification(data: schema.NewNotification) {
	const [created] = await db
		.insert(schema.notifications)
		.values(data)
		.returning();
	return created;
}

export async function updateStatus(
	id: string,
	status: schema.NotificationStatus,
	payload: Partial<schema.NewNotification> = {},
) {
	const setData: Partial<schema.NewNotification> & {
		status: schema.NotificationStatus;
	} = { ...payload, status };
	if (status === "sent" && !payload.sentAt) {
		setData.sentAt = new Date();
	}
	const [updated] = await db
		.update(schema.notifications)
		.set(setData)
		.where(eq(schema.notifications.id, id))
		.returning();
	return updated;
}

// Cursor format: "<createdAt ISO>|<id>" — compound key to handle same-timestamp rows.
function encodeCursor(item: { createdAt: Date; id: string }): string {
	return `${item.createdAt.toISOString()}|${item.id}`;
}

function parseCursor(cursor: string): { ts: Date; id: string } | null {
	const idx = cursor.lastIndexOf("|");
	if (idx === -1) return null;
	return { ts: new Date(cursor.slice(0, idx)), id: cursor.slice(idx + 1) };
}

function cursorCondition(cursor: string) {
	const parsed = parseCursor(cursor);
	if (!parsed) return null;
	// Items strictly older, OR same timestamp but lower id (desc id sort)
	return or(
		lt(schema.notifications.createdAt, parsed.ts),
		and(
			eq(schema.notifications.createdAt, parsed.ts),
			lt(schema.notifications.id, parsed.id),
		),
	);
}

export async function listNotifications(
	status?: schema.NotificationStatus,
	limit = 50,
	cursor?: string,
	channel?: schema.NotificationChannel,
) {
	const pageLimit = Math.min(Math.max(limit, 1), 100);
	const conditions = [];

	if (status) {
		conditions.push(eq(schema.notifications.status, status));
	}
	if (channel) {
		conditions.push(eq(schema.notifications.channel, channel));
	}
	if (cursor) {
		const cond = cursorCondition(cursor);
		if (cond) conditions.push(cond);
	}

	const items = await db.query.notifications.findMany({
		where: conditions.length > 0 ? and(...conditions) : undefined,
		limit: pageLimit,
		orderBy: [
			desc(schema.notifications.createdAt),
			desc(schema.notifications.id),
		],
	});

	const last = items[items.length - 1];
	const nextCursor =
		items.length === pageLimit && last ? encodeCursor(last) : undefined;
	return { items, nextCursor };
}

export async function findPending(limit = 25) {
	return db.query.notifications.findMany({
		where: eq(schema.notifications.status, "pending"),
		limit,
	});
}

/** Returns pending + retrying-but-due notifications with recipient email. */
export async function findReadyToSend(limit = 25) {
	const now = new Date();
	// For both pending and retrying: only pick up when nextRetryAt is null or in the past.
	// This lets claimForDelivery set a future nextRetryAt to act as a processing lock,
	// preventing a second worker from picking up a notification already being processed.
	const readyCondition = or(
		isNull(schema.notifications.nextRetryAt),
		lte(schema.notifications.nextRetryAt, now),
	);
	return db.query.notifications.findMany({
		where: or(
			and(eq(schema.notifications.status, "pending"), readyCondition),
			and(eq(schema.notifications.status, "retrying"), readyCondition),
		),
		with: { recipient: { columns: { primaryEmail: true } } },
		limit,
		orderBy: [asc(schema.notifications.createdAt)],
	});
}

/**
 * Atomically claims a notification for delivery by setting nextRetryAt to a
 * near-future "processing window". Guards on both attemptCount (so a second
 * worker with stale data fails) and nextRetryAt (so a claim already in-flight
 * blocks a second concurrent claim on the same row).
 */
export async function claimForDelivery(
	id: string,
	currentAttemptCount: number,
) {
	const now = new Date();
	const [claimed] = await db
		.update(schema.notifications)
		.set({ nextRetryAt: new Date(Date.now() + 5 * 60 * 1000) })
		.where(
			and(
				eq(schema.notifications.id, id),
				eq(schema.notifications.attemptCount, currentAttemptCount),
				// Not already claimed by another worker (nextRetryAt not set or in the past)
				or(
					isNull(schema.notifications.nextRetryAt),
					lte(schema.notifications.nextRetryAt, now),
				),
			),
		)
		.returning({ id: schema.notifications.id });
	return !!claimed;
}

export async function findMyInApp(
	recipientId: string,
	limit: number,
	cursor?: string,
) {
	const conditions = [
		eq(schema.notifications.recipientId, recipientId),
		eq(schema.notifications.channel, "in-app"),
	];
	if (cursor) {
		const cond = cursorCondition(cursor);
		if (cond) conditions.push(cond);
	}
	const pageLimit = Math.min(Math.max(limit, 1), 50);
	const items = await db.query.notifications.findMany({
		where: and(...conditions),
		orderBy: [
			desc(schema.notifications.createdAt),
			desc(schema.notifications.id),
		],
		limit: pageLimit,
	});
	const last = items[items.length - 1];
	const nextCursor =
		items.length === pageLimit && last ? encodeCursor(last) : undefined;
	return { items, nextCursor };
}

export async function countUnreadInApp(recipientId: string) {
	const [result] = await db
		.select({ total: count() })
		.from(schema.notifications)
		.where(
			and(
				eq(schema.notifications.recipientId, recipientId),
				eq(schema.notifications.channel, "in-app"),
				isNull(schema.notifications.readAt),
			),
		);
	return result?.total ?? 0;
}

export async function markRead(id: string, recipientId: string) {
	const [updated] = await db
		.update(schema.notifications)
		.set({ readAt: new Date() })
		.where(
			and(
				eq(schema.notifications.id, id),
				eq(schema.notifications.recipientId, recipientId),
			),
		)
		.returning();
	return updated;
}

export async function findRecentInApp(
	recipientId: string,
	type: string,
	sinceMs: number,
	dedupeKey?: string,
) {
	const since = new Date(Date.now() - sinceMs);
	const conditions = [
		eq(schema.notifications.recipientId, recipientId),
		eq(schema.notifications.type, type),
		eq(schema.notifications.channel, "in-app"),
		gt(schema.notifications.createdAt, since),
	];
	if (dedupeKey !== undefined) {
		conditions.push(
			sql`${schema.notifications.payload}->>'_dedupeKey' = ${dedupeKey}`,
		);
	}
	return db.query.notifications.findFirst({
		where: and(...conditions),
		columns: { id: true },
	});
}

export async function markAllReadInApp(recipientId: string) {
	await db
		.update(schema.notifications)
		.set({ readAt: new Date() })
		.where(
			and(
				eq(schema.notifications.recipientId, recipientId),
				eq(schema.notifications.channel, "in-app"),
				isNull(schema.notifications.readAt),
			),
		);
}

export async function getStats() {
	const rows = await db
		.select({ status: schema.notifications.status, total: count() })
		.from(schema.notifications)
		.groupBy(schema.notifications.status);
	const result: Record<string, number> = {
		pending: 0,
		retrying: 0,
		failed: 0,
		sent: 0,
	};
	for (const row of rows) {
		result[row.status] = Number(row.total);
	}
	return result as {
		pending: number;
		retrying: number;
		failed: number;
		sent: number;
	};
}

export async function requeueFailed(id: string) {
	const [updated] = await db
		.update(schema.notifications)
		.set({
			status: "pending",
			attemptCount: 0,
			lastError: null,
			nextRetryAt: null,
		})
		.where(
			and(
				eq(schema.notifications.id, id),
				eq(schema.notifications.status, "failed"),
			),
		)
		.returning();
	return updated ?? null;
}

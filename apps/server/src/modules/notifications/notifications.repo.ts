import { and, asc, eq, gt } from "drizzle-orm";
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
	const [updated] = await db
		.update(schema.notifications)
		.set({ ...payload, status, sentAt: payload.sentAt ?? new Date() })
		.where(eq(schema.notifications.id, id))
		.returning();
	return updated;
}

export async function listNotifications(
	status?: schema.NotificationStatus,
	limit = 50,
	cursor?: string,
) {
	const pageLimit = Math.min(Math.max(limit, 1), 100);
	const conditions = [];

	if (status) {
		conditions.push(eq(schema.notifications.status, status));
	}
	if (cursor) {
		conditions.push(gt(schema.notifications.id, cursor));
	}

	const items = await db.query.notifications.findMany({
		where: conditions.length > 0 ? and(...conditions) : undefined,
		limit: pageLimit,
		orderBy: [asc(schema.notifications.id)],
	});

	const nextCursor =
		items.length === pageLimit ? items[items.length - 1].id : undefined;
	return { items, nextCursor };
}

export async function findPending(limit = 25) {
	return db.query.notifications.findMany({
		where: eq(schema.notifications.status, "pending"),
		limit,
	});
}

export async function findByRecipient(recipientId: string) {
	return db.query.notifications.findMany({
		where: recipientId
			? eq(schema.notifications.recipientId, recipientId)
			: undefined,
		orderBy: (t, { desc }) => [desc(t.createdAt)],
	});
}

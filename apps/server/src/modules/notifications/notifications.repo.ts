import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function createNotification(data: schema.NewNotification) {
        const [created] = await db.insert(schema.notifications).values(data).returning();
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
) {
        return db.query.notifications.findMany({
                where: status ? eq(schema.notifications.status, status) : undefined,
                limit,
                orderBy: (t, { desc }) => [desc(t.createdAt)],
        });
}

export async function findPending(limit = 25) {
        return db.query.notifications.findMany({
                where: eq(schema.notifications.status, "pending"),
                limit,
        });
}

export async function findByRecipient(recipientId: string) {
        return db.query.notifications.findMany({
                where: recipientId ? eq(schema.notifications.recipientId, recipientId) : undefined,
                orderBy: (t, { desc }) => [desc(t.createdAt)],
        });
}

import { TRPCError } from "@trpc/server";
import type * as schema from "@/db/schema/app-schema";
import * as repo from "./notifications.repo";

export async function queueNotification(
	data: Omit<schema.NewNotification, "status" | "createdAt">,
) {
	return repo.createNotification({ ...data, status: "pending" });
}

export async function sendPending(limit = 25) {
	const pending = await repo.findPending(limit);
	const delivered = [] as schema.Notification[];
	for (const notification of pending) {
		const updated = await repo.updateStatus(notification.id, "sent", {
			sentAt: new Date(),
		});
		if (updated) delivered.push(updated);
	}
	return delivered;
}

export async function list(
	status?: schema.NotificationStatus,
	limit?: number,
	cursor?: string,
) {
	return repo.listNotifications(status, limit ?? 50, cursor);
}

export async function acknowledge(id: string) {
	const updated = await repo.updateStatus(id, "sent", { sentAt: new Date() });
	if (!updated) {
		throw new TRPCError({ code: "NOT_FOUND" });
	}
	return updated;
}

export async function registerWorkflowAlert(
	type: string,
	payload: Record<string, unknown>,
	recipientId?: string | null,
) {
	return queueNotification({
		channel: "email",
		type,
		payload,
		recipientId: recipientId ?? undefined,
	});
}

export async function queueInApp(
	recipientId: string,
	type: string,
	payload: Record<string, unknown>,
	opts: { dedupeWindowMs?: number; dedupeKey?: string } = {},
) {
	const windowMs = opts.dedupeWindowMs ?? 5 * 60 * 1000;
	const existing = await repo.findRecentInApp(
		recipientId,
		type,
		windowMs,
		opts.dedupeKey,
	);
	if (existing) return existing as { id: string };
	return repo.createNotification({
		recipientId,
		channel: "in-app",
		type,
		payload: opts.dedupeKey
			? { ...payload, _dedupeKey: opts.dedupeKey }
			: payload,
		status: "sent",
	});
}

export async function myInAppNotifications(recipientId: string, limit = 30) {
	return repo.findByRecipient(recipientId, { channel: "in-app", limit });
}

export async function unreadCount(recipientId: string) {
	return repo.countUnreadInApp(recipientId);
}

export async function markRead(id: string, recipientId: string) {
	const updated = await repo.markRead(id, recipientId);
	if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
	return updated;
}

export async function markAllRead(recipientId: string) {
	await repo.markAllReadInApp(recipientId);
}

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

export async function list(status?: schema.NotificationStatus) {
	return repo.listNotifications(status);
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

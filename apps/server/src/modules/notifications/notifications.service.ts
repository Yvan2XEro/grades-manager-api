import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import type * as schema from "@/db/schema/app-schema";
import { institutions } from "@/db/schema/app-schema";
import { defaultEmailSend, type EmailSendFn } from "@/lib/email";
import {
	type InstitutionScope,
	requireProfileInInstitution,
} from "../_shared/tenant-ownership";
import * as repo from "./notifications.repo";

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [5 * 60 * 1000, 30 * 60 * 1000] as const;

function calcNextRetryAt(attempt: number): Date | undefined {
	// attempt is 1-indexed: first retry uses index 0 (5 min), second uses index 1 (30 min)
	const delay = RETRY_DELAYS_MS[attempt - 1];
	if (delay === undefined) return undefined;
	return new Date(Date.now() + delay);
}

function buildEmailHtml(
	type: string,
	payload: Record<string, unknown>,
): string {
	const rows = Object.entries(payload)
		.filter(([k]) => !k.startsWith("_"))
		.map(
			([k, v]) =>
				`<tr><td style="padding:4px 8px;border:1px solid #ddd">${k}</td><td style="padding:4px 8px;border:1px solid #ddd">${String(v ?? "")}</td></tr>`,
		)
		.join("");
	return `<h3 style="font-family:sans-serif">Notification: ${type}</h3><table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${rows}</table>`;
}

export async function queueNotification(
	data: Omit<schema.NewNotification, "status" | "createdAt">,
) {
	return repo.createNotification({ ...data, status: "pending" });
}

/** Queues a notification on behalf of an institution: the recipient must be one of its users. */
export async function queueForInstitution(
	scope: InstitutionScope,
	data: Omit<schema.NewNotification, "status" | "createdAt">,
) {
	if (data.recipientId)
		await requireProfileInInstitution(data.recipientId, scope);
	return queueNotification({ ...data, institutionId: scope.id });
}

export async function sendPending(
	limit = 25,
	emailSend: EmailSendFn = defaultEmailSend,
	scope?: InstitutionScope,
) {
	const ready = await repo.findReadyToSend(limit, scope);
	const delivered: schema.Notification[] = [];

	for (const notification of ready) {
		if (notification.channel === "in-app") {
			// In-app notifications are marked sent at creation; skip here
			continue;
		}

		// Atomically claim the notification (optimistic lock on attemptCount).
		// If another worker already incremented attemptCount, the WHERE won't match and
		// we skip — prevents double delivery when sendPending is called concurrently.
		const claimed = await repo.claimForDelivery(
			notification.id,
			notification.attemptCount ?? 0,
		);
		if (!claimed) continue;

		const recipientEmail = notification.recipient?.primaryEmail;
		if (!recipientEmail) {
			// No recipient email — mark sent so it's not retried indefinitely
			const updated = await repo.updateStatus(notification.id, "sent");
			if (updated) delivered.push(updated);
			continue;
		}

		try {
			const subject = `Notification: ${notification.type}`;
			const html = buildEmailHtml(
				notification.type,
				(notification.payload as Record<string, unknown>) ?? {},
			);
			await emailSend(recipientEmail, subject, html);
			const updated = await repo.updateStatus(notification.id, "sent");
			if (updated) delivered.push(updated);
		} catch (err) {
			const attempt = (notification.attemptCount ?? 0) + 1;
			const lastError = err instanceof Error ? err.message : String(err);
			const nextRetryAt = calcNextRetryAt(attempt);
			const nextStatus: schema.NotificationStatus =
				attempt >= MAX_ATTEMPTS ? "failed" : "retrying";
			await repo.updateStatus(notification.id, nextStatus, {
				attemptCount: attempt,
				lastError,
				nextRetryAt: nextRetryAt ?? null,
			});
		}
	}

	return delivered;
}

export async function list(
	scope: InstitutionScope,
	status?: schema.NotificationStatus,
	limit?: number,
	cursor?: string,
	channel?: schema.NotificationChannel,
) {
	return repo.listNotifications(scope, status, limit ?? 50, cursor, channel);
}

export async function listPaged(opts: {
	scope: InstitutionScope;
	page: number;
	pageSize: number;
	status?: schema.NotificationStatus;
	channel?: schema.NotificationChannel;
}) {
	return repo.listNotificationsPaged(opts);
}

export async function acknowledge(id: string, scope: InstitutionScope) {
	if (!(await repo.findByIdInInstitution(id, scope)))
		throw new TRPCError({ code: "NOT_FOUND" });
	const updated = await repo.updateStatus(id, "sent");
	if (!updated) {
		throw new TRPCError({ code: "NOT_FOUND" });
	}
	return updated;
}

export async function registerWorkflowAlert(
	type: string,
	payload: Record<string, unknown>,
	recipientId?: string | null,
	institutionId?: string,
) {
	if (institutionId && recipientId) {
		// The recipient must be one of the institution's users
		const institution = await db.query.institutions.findFirst({
			where: eq(institutions.id, institutionId),
			columns: { id: true, organizationId: true },
		});
		if (!institution) throw new TRPCError({ code: "NOT_FOUND" });
		await requireProfileInInstitution(recipientId, institution);
	}
	return queueNotification({
		channel: "email",
		type,
		payload,
		recipientId: recipientId ?? undefined,
		institutionId: institutionId ?? null,
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

export async function myInAppNotifications(
	recipientId: string,
	limit = 30,
	cursor?: string,
) {
	return repo.findMyInApp(recipientId, limit, cursor);
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

export async function stats(scope: InstitutionScope) {
	return repo.getStats(scope);
}

export async function requeue(id: string, scope: InstitutionScope) {
	const updated = await repo.requeueFailed(id, scope);
	if (!updated) {
		throw new TRPCError({ code: "NOT_FOUND" });
	}
	return updated;
}

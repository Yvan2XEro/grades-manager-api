import { describe, expect, it, setDefaultTimeout } from "bun:test";

setDefaultTimeout(30_000);

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema/app-schema";
import { asAdmin, createDomainUser } from "@/lib/test-utils";
import { appRouter } from "@/routers";
import * as repo from "../notifications.repo";
import * as service from "../notifications.service";

describe("notifications — retry and failure handling", () => {
	it("flush with no recipient marks email notification as sent immediately", async () => {
		const ctx = asAdmin();
		const admin = appRouter.createCaller(ctx);

		await admin.notifications.queue({
			channel: "email",
			type: "no_recipient_event",
			payload: { info: "hello" },
		});

		const noopSend = async () => {};
		const delivered = await service.sendPending(25, noopSend);
		const found = delivered.find((n) => n.type === "no_recipient_event");
		// No recipient email → marked sent without delivery attempt
		expect(found?.status).toBe("sent");
	});

	it("failed email delivery marks notification as retrying with attempt count", async () => {
		const profile = await createDomainUser({
			primaryEmail: "retry@example.com",
		});
		const ctx = asAdmin();
		const admin = appRouter.createCaller(ctx);

		await admin.notifications.queue({
			channel: "email",
			type: "retry_test",
			payload: { value: 1 },
			recipientId: profile.id,
		});

		const failSend = async () => {
			throw new Error("SMTP timeout");
		};

		// First attempt → should become "retrying"
		await service.sendPending(25, failSend);

		const { items } = await service.list("retrying");
		const retrying = items.find((n) => n.type === "retry_test");
		expect(retrying).toBeDefined();
		expect(retrying?.attemptCount).toBe(1);
		expect(retrying?.lastError).toBe("SMTP timeout");
		expect(retrying?.nextRetryAt).toBeDefined();
	});

	it("notification becomes failed after MAX_ATTEMPTS consecutive failures", async () => {
		const profile = await createDomainUser({
			primaryEmail: "exhaust@example.com",
		});
		const ctx = asAdmin();
		const admin = appRouter.createCaller(ctx);

		await admin.notifications.queue({
			channel: "email",
			type: "exhaust_test",
			payload: {},
			recipientId: profile.id,
		});

		const failSend = async () => {
			throw new Error("permanent error");
		};

		// 3 attempts → status = "failed"
		for (let i = 0; i < 3; i++) {
			// After the first failure, force nextRetryAt to past so it's picked up again
			if (i > 0) {
				await db
					.update(notifications)
					.set({ nextRetryAt: new Date(0) })
					.where(eq(notifications.type, "exhaust_test"));
			}
			await service.sendPending(25, failSend);
		}

		const { items } = await service.list("failed");
		const failed = items.find((n) => n.type === "exhaust_test");
		expect(failed).toBeDefined();
		expect(failed?.attemptCount).toBe(3);
		expect(failed?.lastError).toBe("permanent error");
	});

	it("retrying notification with future nextRetryAt is NOT picked up", async () => {
		const profile = await createDomainUser({
			primaryEmail: "future@example.com",
		});
		const ctx = asAdmin();
		const admin = appRouter.createCaller(ctx);

		await admin.notifications.queue({
			channel: "email",
			type: "future_retry_test",
			payload: {},
			recipientId: profile.id,
		});

		const failSend = async () => {
			throw new Error("transient");
		};

		// First failure → retrying with nextRetryAt in the future
		await service.sendPending(25, failSend);

		// Flush again — notification has future nextRetryAt so it should be skipped
		let called = false;
		const guardSend = async () => {
			called = true;
		};
		await service.sendPending(25, guardSend);
		// The guard send should not have been called for this notification
		// (delivered count should not include future_retry_test)
		const { items } = await service.list("retrying");
		const stillRetrying = items.find((n) => n.type === "future_retry_test");
		expect(stillRetrying?.status).toBe("retrying");
	});

	it("in-app notifications are not processed by sendPending", async () => {
		const profile = await createDomainUser({
			primaryEmail: "inapp@example.com",
		});

		// Create in-app notification directly (marked "sent" at creation)
		await service.queueInApp(profile.id, "in_app_event", { x: 1 });

		let emailCallCount = 0;
		const countingSend = async () => {
			emailCallCount++;
		};

		// sendPending picks up "pending" and "retrying" — in-app is "sent", so skipped
		const before = emailCallCount;
		await service.sendPending(25, countingSend);
		// No additional calls due to the in-app notification
		expect(emailCallCount).toBe(before);
	});

	it("backoff order: first retry waits 5 min, second waits 30 min", async () => {
		const profile = await createDomainUser({
			primaryEmail: "backoff@example.com",
		});
		const ctx = asAdmin();
		const admin = appRouter.createCaller(ctx);

		await admin.notifications.queue({
			channel: "email",
			type: "backoff_order_test",
			payload: {},
			recipientId: profile.id,
		});

		const failSend = async () => {
			throw new Error("err");
		};

		// First failure → nextRetryAt ≈ 5 min from now
		const before1 = Date.now();
		await service.sendPending(25, failSend);
		const after1 = Date.now();

		const { items: items1 } = await service.list("retrying");
		const n1 = items1.find((n) => n.type === "backoff_order_test");
		expect(n1?.attemptCount).toBe(1);
		const delay1Ms = new Date(n1!.nextRetryAt!).getTime() - before1;
		// Should be ~5 min (300 000 ms), allow ±5 s tolerance
		expect(delay1Ms).toBeGreaterThan(295_000);
		expect(delay1Ms).toBeLessThan(310_000 + (after1 - before1));

		// Force nextRetryAt to past so it can be picked up again
		await db
			.update(notifications)
			.set({ nextRetryAt: new Date(0) })
			.where(eq(notifications.type, "backoff_order_test"));

		// Second failure → nextRetryAt ≈ 30 min from now
		const before2 = Date.now();
		await service.sendPending(25, failSend);
		const after2 = Date.now();

		const { items: items2 } = await service.list("retrying");
		const n2 = items2.find((n) => n.type === "backoff_order_test");
		expect(n2?.attemptCount).toBe(2);
		const delay2Ms = new Date(n2!.nextRetryAt!).getTime() - before2;
		// Should be ~30 min (1 800 000 ms), allow ±5 s tolerance
		expect(delay2Ms).toBeGreaterThan(1_795_000);
		expect(delay2Ms).toBeLessThan(1_810_000 + (after2 - before2));
	});

	it("concurrent sendPending calls do not double-deliver the same notification", async () => {
		const profile = await createDomainUser({
			primaryEmail: "concurrent@example.com",
		});
		const ctx = asAdmin();
		const admin = appRouter.createCaller(ctx);

		await admin.notifications.queue({
			channel: "email",
			type: "concurrent_test",
			payload: {},
			recipientId: profile.id,
		});

		// Simulate two workers reading the notification at the same time,
		// then both attempting to claim it. Only one claim should succeed.
		const [notif] = await db.query.notifications.findMany({
			where: eq(notifications.type, "concurrent_test"),
			limit: 1,
		});

		const claim1 = await repo.claimForDelivery(
			notif.id,
			notif.attemptCount ?? 0,
		);
		const claim2 = await repo.claimForDelivery(
			notif.id,
			notif.attemptCount ?? 0,
		);

		// Exactly one claim must succeed
		expect(claim1 && !claim2).toBe(true);

		// Verify: actual delivery via sendPending (which also claims) should send exactly once
		let sendCount = 0;
		// Reset to pending so sendPending can pick it up properly
		await db
			.update(notifications)
			.set({ nextRetryAt: new Date(0) })
			.where(eq(notifications.id, notif.id));

		const countSend = async () => {
			sendCount++;
		};
		// Two back-to-back calls — second sees future nextRetryAt set by first claim
		await service.sendPending(25, countSend);
		await service.sendPending(25, countSend);
		expect(sendCount).toBe(1);
	});

	it("list endpoint filters by retrying status", async () => {
		const profile = await createDomainUser({
			primaryEmail: "listfilter@example.com",
		});
		const ctx = asAdmin();
		const admin = appRouter.createCaller(ctx);

		await admin.notifications.queue({
			channel: "email",
			type: "list_filter_test",
			payload: {},
			recipientId: profile.id,
		});

		const failSend = async () => {
			throw new Error("err");
		};
		await service.sendPending(25, failSend);

		const result = await admin.notifications.list({ status: "retrying" });
		expect(result.items.some((n) => n.type === "list_filter_test")).toBe(true);
	});
});

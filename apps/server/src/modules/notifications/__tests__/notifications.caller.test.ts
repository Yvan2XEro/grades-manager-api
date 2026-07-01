import { describe, expect, it, setDefaultTimeout } from "bun:test";

setDefaultTimeout(30_000);

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema/app-schema";
import { asAdmin, createDomainUser } from "@/lib/test-utils";
import { appRouter } from "@/routers";
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

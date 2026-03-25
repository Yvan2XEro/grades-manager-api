import { createHmac } from "node:crypto";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { diplomationApiKeys } from "@/db/schema/app-schema";

export type WebhookEvent =
	| {
			event: "deliberation.signed";
			deliberationId: string;
			institutionId: string;
			deliberationType: string;
			signedAt: string;
			classId: string;
			academicYearId: string;
	  }
	| {
			event: "semester.grades_locked";
			semesterId: string;
			institutionId: string;
			classId: string;
			academicYearId: string;
			lockedAt: string;
	  };

function hmacSha256(body: string, secret: string): string {
	return createHmac("sha256", secret).update(body).digest("hex");
}

export async function dispatchWebhook(
	institutionId: string,
	payload: WebhookEvent,
): Promise<void> {
	const keys = await db.query.diplomationApiKeys.findMany({
		where: and(
			eq(diplomationApiKeys.institutionId, institutionId),
			eq(diplomationApiKeys.isActive, true),
			isNotNull(diplomationApiKeys.webhookUrl),
		),
	});

	if (keys.length === 0) return;

	const body = JSON.stringify(payload);

	for (const key of keys) {
		if (!key.webhookUrl) continue;
		const sig = `sha256=${hmacSha256(body, key.webhookSecret ?? "")}`;
		fetch(key.webhookUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Diplomation-Signature": sig,
				"X-Diplomation-Event": payload.event,
			},
			body,
			signal: AbortSignal.timeout(8000),
		}).catch((err: Error) => {
			console.error(
				`[Webhook] Delivery failed to ${key.webhookUrl}: ${err.message}`,
			);
		});
	}
}

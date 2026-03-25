import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";
import type { z } from "zod";
import { hashApiKey } from "@/lib/api-key-auth";
import * as repo from "./diplomation-keys.repo";
import type {
	createKeySchema,
	revokeKeySchema,
	updateWebhookSchema,
} from "./diplomation-keys.zod";

export async function createKey(
	input: z.infer<typeof createKeySchema>,
	institutionId: string,
) {
	const rawKey = randomBytes(32).toString("hex");
	const keyHash = hashApiKey(rawKey);
	await repo.create({
		institutionId,
		label: input.label,
		keyHash,
		webhookUrl: input.webhookUrl ?? null,
		webhookSecret: input.webhookSecret ?? null,
	});
	return { rawKey, label: input.label };
}

export async function listKeys(institutionId: string) {
	return repo.list(institutionId);
}

export async function revokeKey(
	input: z.infer<typeof revokeKeySchema>,
	institutionId: string,
) {
	const existing = await repo.findById(input.id, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	return repo.revoke(input.id, institutionId);
}

export async function updateWebhook(
	input: z.infer<typeof updateWebhookSchema>,
	institutionId: string,
) {
	const existing = await repo.findById(input.id, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	return repo.updateWebhook(
		input.id,
		institutionId,
		input.webhookUrl,
		input.webhookSecret,
	);
}

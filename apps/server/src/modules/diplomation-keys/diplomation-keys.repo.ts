import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
	diplomationApiKeys,
	type NewDiplomationApiKey,
} from "@/db/schema/app-schema";

export async function create(data: NewDiplomationApiKey) {
	const [item] = await db
		.insert(diplomationApiKeys)
		.values(data)
		.returning();
	return item;
}

export async function list(institutionId: string) {
	return db.query.diplomationApiKeys.findMany({
		where: eq(diplomationApiKeys.institutionId, institutionId),
		columns: {
			id: true,
			label: true,
			webhookUrl: true,
			isActive: true,
			lastUsedAt: true,
			createdAt: true,
			institutionId: true,
		},
	});
}

export async function findById(id: string, institutionId: string) {
	return db.query.diplomationApiKeys.findFirst({
		where: and(
			eq(diplomationApiKeys.id, id),
			eq(diplomationApiKeys.institutionId, institutionId),
		),
	});
}

export async function revoke(id: string, institutionId: string) {
	const [item] = await db
		.update(diplomationApiKeys)
		.set({ isActive: false })
		.where(
			and(
				eq(diplomationApiKeys.id, id),
				eq(diplomationApiKeys.institutionId, institutionId),
			),
		)
		.returning();
	return item;
}

export async function updateWebhook(
	id: string,
	institutionId: string,
	webhookUrl: string | null,
	webhookSecret: string | null,
) {
	const [item] = await db
		.update(diplomationApiKeys)
		.set({ webhookUrl, webhookSecret })
		.where(
			and(
				eq(diplomationApiKeys.id, id),
				eq(diplomationApiKeys.institutionId, institutionId),
			),
		)
		.returning();
	return item;
}

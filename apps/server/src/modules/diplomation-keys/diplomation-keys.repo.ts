import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
	diplomationApiCallLogs,
	diplomationApiKeys,
	diplomationDocuments,
	type NewDiplomationApiKey,
} from "@/db/schema/app-schema";

export async function create(data: NewDiplomationApiKey) {
	const [item] = await db.insert(diplomationApiKeys).values(data).returning();
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

export async function getActivityStats(institutionId: string, days = 30) {
	const since = new Date();
	since.setDate(since.getDate() - days);

	const rows = await db
		.select({
			date: sql<string>`date_trunc('day', ${diplomationDocuments.generatedAt})::date::text`,
			apiKeyId: diplomationDocuments.generatedByApiKeyId,
			count: sql<number>`cast(count(*) as integer)`,
		})
		.from(diplomationDocuments)
		.where(
			and(
				eq(diplomationDocuments.institutionId, institutionId),
				gte(diplomationDocuments.generatedAt, since),
			),
		)
		.groupBy(
			sql`date_trunc('day', ${diplomationDocuments.generatedAt})`,
			diplomationDocuments.generatedByApiKeyId,
		)
		.orderBy(sql`date_trunc('day', ${diplomationDocuments.generatedAt}) asc`);

	const keyIds = [
		...new Set(rows.map((r) => r.apiKeyId).filter(Boolean)),
	] as string[];

	const keyLabels =
		keyIds.length > 0
			? await db
					.select({
						id: diplomationApiKeys.id,
						label: diplomationApiKeys.label,
					})
					.from(diplomationApiKeys)
					.where(inArray(diplomationApiKeys.id, keyIds))
			: [];

	return { rows, keyLabels };
}

export async function getCallStats(institutionId: string, days = 30) {
	const since = new Date();
	since.setDate(since.getDate() - days);

	const rows = await db
		.select({
			date: sql<string>`date_trunc('day', ${diplomationApiCallLogs.calledAt})::date::text`,
			apiKeyId: diplomationApiCallLogs.apiKeyId,
			count: sql<number>`cast(count(*) as integer)`,
		})
		.from(diplomationApiCallLogs)
		.where(
			and(
				eq(diplomationApiCallLogs.institutionId, institutionId),
				gte(diplomationApiCallLogs.calledAt, since),
			),
		)
		.groupBy(
			sql`date_trunc('day', ${diplomationApiCallLogs.calledAt})`,
			diplomationApiCallLogs.apiKeyId,
		)
		.orderBy(sql`date_trunc('day', ${diplomationApiCallLogs.calledAt}) asc`);

	const keyIds = [
		...new Set(rows.map((r) => r.apiKeyId).filter(Boolean)),
	] as string[];

	const keyLabels =
		keyIds.length > 0
			? await db
					.select({
						id: diplomationApiKeys.id,
						label: diplomationApiKeys.label,
					})
					.from(diplomationApiKeys)
					.where(inArray(diplomationApiKeys.id, keyIds))
			: [];

	return { rows, keyLabels };
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

import { and, asc, eq, gt, ilike } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

const centerSelection = {
	id: schema.centers.id,
	institutionId: schema.centers.institutionId,
	code: schema.centers.code,
	shortName: schema.centers.shortName,
	name: schema.centers.name,
	nameEn: schema.centers.nameEn,
	description: schema.centers.description,
	addressFr: schema.centers.addressFr,
	addressEn: schema.centers.addressEn,
	city: schema.centers.city,
	country: schema.centers.country,
	postalBox: schema.centers.postalBox,
	contactEmail: schema.centers.contactEmail,
	contactPhone: schema.centers.contactPhone,
	logoUrl: schema.centers.logoUrl,
	logoSvg: schema.centers.logoSvg,
	adminInstanceLogoUrl: schema.centers.adminInstanceLogoUrl,
	adminInstanceLogoSvg: schema.centers.adminInstanceLogoSvg,
	watermarkLogoUrl: schema.centers.watermarkLogoUrl,
	watermarkLogoSvg: schema.centers.watermarkLogoSvg,
	authorizationOrderFr: schema.centers.authorizationOrderFr,
	authorizationOrderEn: schema.centers.authorizationOrderEn,
	isActive: schema.centers.isActive,
	createdAt: schema.centers.createdAt,
	updatedAt: schema.centers.updatedAt,
};

export async function create(data: schema.NewCenter) {
	const [item] = await db.insert(schema.centers).values(data).returning();
	return item;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<schema.NewCenter>,
) {
	const [item] = await db
		.update(schema.centers)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(schema.centers.id, id),
				eq(schema.centers.institutionId, institutionId),
			),
		)
		.returning();
	return item;
}

export async function remove(id: string, institutionId: string) {
	await db
		.delete(schema.centers)
		.where(
			and(
				eq(schema.centers.id, id),
				eq(schema.centers.institutionId, institutionId),
			),
		);
}

export async function findById(id: string, institutionId: string) {
	const [center] = await db
		.select(centerSelection)
		.from(schema.centers)
		.where(
			and(
				eq(schema.centers.id, id),
				eq(schema.centers.institutionId, institutionId),
			),
		)
		.limit(1);
	return center ?? null;
}

export async function list(
	institutionId: string,
	opts: {
		q?: string;
		cursor?: string;
		limit?: number;
		includeInactive?: boolean;
	},
) {
	const limit = opts.limit ?? 50;
	const conditions = [eq(schema.centers.institutionId, institutionId)] as Array<
		ReturnType<typeof eq> | ReturnType<typeof gt>
	>;
	if (!opts.includeInactive) {
		conditions.push(eq(schema.centers.isActive, true));
	}
	if (opts.q) {
		conditions.push(ilike(schema.centers.name, `%${opts.q}%`));
	}
	if (opts.cursor) {
		conditions.push(gt(schema.centers.id, opts.cursor));
	}
	const condition =
		conditions.length === 1 ? conditions[0] : and(...conditions);
	const rows = await db
		.select(centerSelection)
		.from(schema.centers)
		.where(condition)
		.orderBy(schema.centers.name)
		.limit(limit);
	const nextCursor =
		rows.length === limit ? rows[rows.length - 1]?.id : undefined;
	return { items: rows, nextCursor };
}

export async function listAdministrativeInstances(centerId: string) {
	return db
		.select()
		.from(schema.centerAdministrativeInstances)
		.where(eq(schema.centerAdministrativeInstances.centerId, centerId))
		.orderBy(
			asc(schema.centerAdministrativeInstances.orderIndex),
			asc(schema.centerAdministrativeInstances.createdAt),
		);
}

export async function listLegalTexts(centerId: string) {
	return db
		.select()
		.from(schema.centerLegalTexts)
		.where(eq(schema.centerLegalTexts.centerId, centerId))
		.orderBy(
			asc(schema.centerLegalTexts.orderIndex),
			asc(schema.centerLegalTexts.createdAt),
		);
}

export async function replaceAdministrativeInstances(
	centerId: string,
	rows: Array<Omit<schema.NewCenterAdministrativeInstance, "centerId" | "id">>,
) {
	await db
		.delete(schema.centerAdministrativeInstances)
		.where(eq(schema.centerAdministrativeInstances.centerId, centerId));
	if (!rows.length) return [];
	return db
		.insert(schema.centerAdministrativeInstances)
		.values(
			rows.map((r, i) => ({ ...r, centerId, orderIndex: r.orderIndex ?? i })),
		)
		.returning();
}

export async function replaceLegalTexts(
	centerId: string,
	rows: Array<Omit<schema.NewCenterLegalText, "centerId" | "id">>,
) {
	await db
		.delete(schema.centerLegalTexts)
		.where(eq(schema.centerLegalTexts.centerId, centerId));
	if (!rows.length) return [];
	return db
		.insert(schema.centerLegalTexts)
		.values(
			rows.map((r, i) => ({ ...r, centerId, orderIndex: r.orderIndex ?? i })),
		)
		.returning();
}

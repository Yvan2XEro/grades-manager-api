import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { subjects, trackSubjectCoefficients, tracks } from "../../db/schema";

export async function findAll(
	institutionId: string,
	opts: {
		orderBy?: string;
		orderDir?: string;
		page?: number;
		pageSize?: number;
	} = {},
) {
	const { orderBy = "code", orderDir = "asc", page = 1, pageSize = 25 } = opts;
	const where = eq(tracks.institutionId, institutionId);
	const col = orderBy === "name" ? tracks.name : tracks.code;
	const order = orderDir === "desc" ? desc(col) : asc(col);
	const [items, totalRows] = await Promise.all([
		db
			.select()
			.from(tracks)
			.where(where)
			.orderBy(order)
			.limit(pageSize)
			.offset((page - 1) * pageSize),
		db.select({ count: count() }).from(tracks).where(where),
	]);
	return { items, total: Number(totalRows[0]?.count ?? 0) };
}

export async function findById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(tracks)
		.where(and(eq(tracks.id, id), eq(tracks.institutionId, institutionId)))
		.limit(1);
	return rows[0] ?? null;
}

export async function findByCode(code: string, institutionId: string) {
	const rows = await db
		.select()
		.from(tracks)
		.where(and(eq(tracks.code, code), eq(tracks.institutionId, institutionId)))
		.limit(1);
	return rows[0] ?? null;
}

export async function insert(data: typeof tracks.$inferInsert) {
	const [row] = await db.insert(tracks).values(data).returning();
	return row!;
}

export async function upsertCoefficient(data: {
	trackId: string;
	subjectId: string;
	coefficient: number;
	isOfficialExamSubject: boolean;
}) {
	const [row] = await db
		.insert(trackSubjectCoefficients)
		.values({
			trackId: data.trackId,
			subjectId: data.subjectId,
			coefficient: data.coefficient,
			isOfficialExamSubject: data.isOfficialExamSubject,
		})
		.onConflictDoUpdate({
			target: [
				trackSubjectCoefficients.trackId,
				trackSubjectCoefficients.subjectId,
			],
			set: {
				coefficient: data.coefficient,
				isOfficialExamSubject: data.isOfficialExamSubject,
				updatedAt: new Date(),
			},
		})
		.returning();
	return row!;
}

export async function bulkInsert(rows: (typeof tracks.$inferInsert)[]) {
	if (rows.length === 0) return [];
	return db.insert(tracks).values(rows).onConflictDoNothing().returning();
}

export async function bulkUpsertCoefficients(
	rows: (typeof trackSubjectCoefficients.$inferInsert)[],
) {
	if (rows.length === 0) return [];
	return db
		.insert(trackSubjectCoefficients)
		.values(rows)
		.onConflictDoUpdate({
			target: [
				trackSubjectCoefficients.trackId,
				trackSubjectCoefficients.subjectId,
			],
			set: {
				coefficient: trackSubjectCoefficients.coefficient,
				isOfficialExamSubject: trackSubjectCoefficients.isOfficialExamSubject,
				updatedAt: new Date(),
			},
		})
		.returning();
}

export async function getCoefficientsGrid(trackId: string) {
	return db
		.select({
			id: trackSubjectCoefficients.id,
			trackId: trackSubjectCoefficients.trackId,
			coefficient: trackSubjectCoefficients.coefficient,
			isOfficialExamSubject: trackSubjectCoefficients.isOfficialExamSubject,
			createdAt: trackSubjectCoefficients.createdAt,
			subject: {
				id: subjects.id,
				name: subjects.name,
				nameFr: subjects.nameFr,
				code: subjects.code,
				subjectGroup: subjects.subjectGroup,
			},
		})
		.from(trackSubjectCoefficients)
		.innerJoin(subjects, eq(trackSubjectCoefficients.subjectId, subjects.id))
		.where(eq(trackSubjectCoefficients.trackId, trackId))
		.orderBy(subjects.name);
}

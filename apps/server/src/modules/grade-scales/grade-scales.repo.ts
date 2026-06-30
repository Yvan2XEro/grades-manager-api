import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function findByInstitution(institutionId: string) {
	return db.query.gradeScales.findFirst({
		where: and(
			eq(schema.gradeScales.institutionId, institutionId),
			isNull(schema.gradeScales.programId),
		),
	});
}

export async function findByProgram(institutionId: string, programId: string) {
	return db.query.gradeScales.findFirst({
		where: and(
			eq(schema.gradeScales.institutionId, institutionId),
			eq(schema.gradeScales.programId, programId),
		),
	});
}

export async function upsert(
	institutionId: string,
	data: {
		passThreshold: number;
		compensationThreshold: number;
		mentionRanges: schema.MentionRange[];
		programId?: string | null;
	},
) {
	const isProgramLevel = !!data.programId;
	const values = {
		institutionId,
		programId: data.programId ?? null,
		passThreshold: String(data.passThreshold),
		compensationThreshold: String(data.compensationThreshold),
		mentionRanges: data.mentionRanges,
	};
	const set = {
		passThreshold: values.passThreshold,
		compensationThreshold: values.compensationThreshold,
		mentionRanges: values.mentionRanges,
		updatedAt: new Date(),
	};
	const [row] = await db
		.insert(schema.gradeScales)
		.values(values)
		.onConflictDoUpdate({
			target: isProgramLevel
				? [schema.gradeScales.institutionId, schema.gradeScales.programId]
				: [schema.gradeScales.institutionId],
			targetWhere: isProgramLevel
				? isNotNull(schema.gradeScales.programId)
				: isNull(schema.gradeScales.programId),
			set,
		})
		.returning();
	return row;
}

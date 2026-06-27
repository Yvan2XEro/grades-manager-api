import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function findByInstitution(institutionId: string) {
	return db.query.gradeScales.findFirst({
		where: eq(schema.gradeScales.institutionId, institutionId),
	});
}

export async function upsert(
	institutionId: string,
	data: {
		passThreshold: number;
		compensationThreshold: number;
		mentionRanges: schema.MentionRange[];
	},
) {
	const [row] = await db
		.insert(schema.gradeScales)
		.values({
			institutionId,
			passThreshold: String(data.passThreshold),
			compensationThreshold: String(data.compensationThreshold),
			mentionRanges: data.mentionRanges,
		})
		.onConflictDoUpdate({
			target: schema.gradeScales.institutionId,
			set: {
				passThreshold: String(data.passThreshold),
				compensationThreshold: String(data.compensationThreshold),
				mentionRanges: data.mentionRanges,
				updatedAt: new Date(),
			},
		})
		.returning();
	return row;
}

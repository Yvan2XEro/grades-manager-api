import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

type WindowRecord = typeof schema.enrollmentWindows.$inferSelect;

const withClassJoin = () =>
	db
		.select({
			window: schema.enrollmentWindows,
		})
		.from(schema.enrollmentWindows)
		.innerJoin(
			schema.classes,
			eq(schema.classes.id, schema.enrollmentWindows.classId),
		);

export async function findWindow(
	classId: string,
	academicYearId: string,
	institutionId: string,
) {
	const result = await withClassJoin()
		.where(
			and(
				eq(schema.enrollmentWindows.classId, classId),
				eq(schema.enrollmentWindows.academicYearId, academicYearId),
				eq(schema.classes.institutionId, institutionId),
			),
		)
		.limit(1);
	return result[0]?.window ?? null;
}

export async function upsertWindow(
	classId: string,
	academicYearId: string,
	status: schema.EnrollmentWindowStatus,
	institutionId: string,
) {
	const existing = await findWindow(classId, academicYearId, institutionId);
	if (existing) {
		const [updated] = await db
			.update(schema.enrollmentWindows)
			.set({
				status,
				openedAt: status === "open" ? new Date() : existing.openedAt,
				closedAt: status === "closed" ? new Date() : null,
			})
			.where(eq(schema.enrollmentWindows.id, existing.id))
			.returning();
		return updated;
	}
	const [created] = await db
		.insert(schema.enrollmentWindows)
		.values({ classId, academicYearId, status })
		.returning();
	return created;
}

export async function listWindows(institutionId: string) {
	const rows = await withClassJoin().where(
		eq(schema.classes.institutionId, institutionId),
	);
	rows.sort((a, b) => {
		const aTime = a.window.openedAt ? a.window.openedAt.getTime() : 0;
		const bTime = b.window.openedAt ? b.window.openedAt.getTime() : 0;
		return bTime - aTime;
	});
	return rows.map((row) => row.window as WindowRecord);
}

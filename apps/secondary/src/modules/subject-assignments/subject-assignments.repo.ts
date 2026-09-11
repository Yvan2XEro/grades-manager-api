import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { classes, staff, subjectAssignments, subjects } from "../../db/schema";

export async function findAll(
	institutionId: string,
	academicYearId: string,
	classId?: string,
	staffId?: string,
) {
	const conditions = [
		eq(subjectAssignments.institutionId, institutionId),
		eq(subjectAssignments.academicYearId, academicYearId),
	];
	if (classId) conditions.push(eq(subjectAssignments.classId, classId));
	if (staffId) conditions.push(eq(subjectAssignments.staffId, staffId));
	return db
		.select({
			assignment: {
				id: subjectAssignments.id,
				staffId: subjectAssignments.staffId,
				subjectId: subjectAssignments.subjectId,
				classId: subjectAssignments.classId,
				academicYearId: subjectAssignments.academicYearId,
				createdAt: subjectAssignments.createdAt,
			},
			staff: {
				id: staff.id,
				firstName: staff.firstName,
				lastName: staff.lastName,
				email: staff.email,
			},
			subject: {
				id: subjects.id,
				name: subjects.name,
				nameFr: subjects.nameFr,
				code: subjects.code,
			},
			class: {
				id: classes.id,
				name: classes.name,
				code: classes.code,
				level: classes.level,
			},
		})
		.from(subjectAssignments)
		.innerJoin(staff, eq(subjectAssignments.staffId, staff.id))
		.innerJoin(subjects, eq(subjectAssignments.subjectId, subjects.id))
		.innerJoin(classes, eq(subjectAssignments.classId, classes.id))
		.where(and(...conditions));
}

export async function findById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(subjectAssignments)
		.where(
			and(
				eq(subjectAssignments.id, id),
				eq(subjectAssignments.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function findDuplicate(
	staffId: string,
	subjectId: string,
	classId: string,
	academicYearId: string,
	institutionId: string,
) {
	const rows = await db
		.select()
		.from(subjectAssignments)
		.where(
			and(
				eq(subjectAssignments.staffId, staffId),
				eq(subjectAssignments.subjectId, subjectId),
				eq(subjectAssignments.classId, classId),
				eq(subjectAssignments.academicYearId, academicYearId),
				eq(subjectAssignments.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function insert(data: typeof subjectAssignments.$inferInsert) {
	const [row] = await db.insert(subjectAssignments).values(data).returning();
	return row!;
}

export async function remove(id: string, institutionId: string) {
	await db
		.delete(subjectAssignments)
		.where(
			and(
				eq(subjectAssignments.id, id),
				eq(subjectAssignments.institutionId, institutionId),
			),
		);
}

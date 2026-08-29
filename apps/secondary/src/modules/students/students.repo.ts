import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "../../db";
import { enrollments, students } from "../../db/schema";

export async function findAll(
	institutionId: string,
	opts: {
		search?: string;
		gender?: string;
		classId?: string;
		academicYearId?: string;
		orderBy?: "lastName" | "firstName" | "mnu";
		orderDir?: "asc" | "desc";
		page?: number;
		pageSize?: number;
	},
) {
	const {
		search,
		gender,
		classId,
		academicYearId,
		orderBy = "lastName",
		orderDir = "asc",
		page = 1,
		pageSize = 25,
	} = opts;

	// When filtering by class/year, pre-fetch matching student IDs via enrollments
	let enrolledStudentIds: string[] | undefined;
	if (classId || academicYearId) {
		const enrollmentConditions = [eq(enrollments.institutionId, institutionId)];
		if (classId) enrollmentConditions.push(eq(enrollments.classId, classId));
		if (academicYearId)
			enrollmentConditions.push(eq(enrollments.academicYearId, academicYearId));
		const rows = await db
			.select({ studentId: enrollments.studentId })
			.from(enrollments)
			.where(and(...enrollmentConditions));
		enrolledStudentIds = rows.map((r) => r.studentId);
		if (enrolledStudentIds.length === 0) {
			return { items: [], total: 0 };
		}
	}

	const conditions = [eq(students.institutionId, institutionId)];
	if (enrolledStudentIds)
		conditions.push(inArray(students.id, enrolledStudentIds));
	if (gender) conditions.push(eq(students.gender, gender));
	if (search) {
		conditions.push(
			or(
				ilike(students.firstName, `%${search}%`),
				ilike(students.lastName, `%${search}%`),
				ilike(students.mnu, `%${search}%`),
			)!,
		);
	}
	const where = and(...conditions);

	const sortCol =
		orderBy === "firstName"
			? students.firstName
			: orderBy === "mnu"
				? students.mnu
				: students.lastName;
	const sortExpr = orderDir === "desc" ? desc(sortCol) : asc(sortCol);

	const [items, totalRows] = await Promise.all([
		db
			.select()
			.from(students)
			.where(where)
			.orderBy(sortExpr)
			.limit(pageSize)
			.offset((page - 1) * pageSize),
		db.select({ count: count() }).from(students).where(where),
	]);
	return { items, total: Number(totalRows[0]?.count ?? 0) };
}

export async function findById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(students)
		.where(and(eq(students.id, id), eq(students.institutionId, institutionId)))
		.limit(1);
	return rows[0] ?? null;
}

export async function insert(data: typeof students.$inferInsert) {
	const [row] = await db.insert(students).values(data).returning();
	return row!;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<typeof students.$inferInsert>,
) {
	const [row] = await db
		.update(students)
		.set({ ...data, updatedAt: new Date() })
		.where(and(eq(students.id, id), eq(students.institutionId, institutionId)))
		.returning();
	return row ?? null;
}

export async function countAll(institutionId: string) {
	const rows = await db
		.select({ id: students.id })
		.from(students)
		.where(eq(students.institutionId, institutionId));
	return rows.length;
}

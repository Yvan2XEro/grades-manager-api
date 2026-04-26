import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";

export type StudentDocumentContext = NonNullable<
	Awaited<ReturnType<typeof loadStudentContext>>
>;

/**
 * Load every piece of information needed to render a diploma / transcript /
 * attestation for a given student. Returns null if the student doesn't belong
 * to the institution.
 */
export async function loadStudentContext(
	institutionId: string,
	studentId: string,
) {
	const student = await db.query.students.findFirst({
		where: and(
			eq(schema.students.id, studentId),
			eq(schema.students.institutionId, institutionId),
		),
		with: {
			profile: true,
			classRef: {
				with: {
					program: {
						with: {
							center: true,
						},
					},
					academicYear: true,
					cycleLevel: true,
					semester: true,
					programOption: true,
				},
			},
		},
	});

	if (!student) return null;

	// Walk up to two levels of tutelle so the export header can render the
	// full chain: Institut → Faculté → Université (e.g. ISSAM → FMSP → UDo).
	const institution = await db.query.institutions.findFirst({
		where: eq(schema.institutions.id, institutionId),
		with: {
			parentInstitution: {
				with: { parentInstitution: true },
			},
		},
	});

	return { student, institution };
}

export async function loadDeliberationResult(
	institutionId: string,
	studentId: string,
	deliberationId?: string,
) {
	if (!deliberationId) {
		// Fallback: pick the most recent annual deliberation for this student
		const result = await db
			.select({
				result: schema.deliberationStudentResults,
				deliberation: schema.deliberations,
			})
			.from(schema.deliberationStudentResults)
			.innerJoin(
				schema.deliberations,
				eq(
					schema.deliberations.id,
					schema.deliberationStudentResults.deliberationId,
				),
			)
			.where(
				and(
					eq(schema.deliberationStudentResults.studentId, studentId),
					eq(schema.deliberations.institutionId, institutionId),
				),
			)
			.orderBy(schema.deliberations.deliberationDate)
			.limit(1);
		return result[0] ?? null;
	}

	const result = await db
		.select({
			result: schema.deliberationStudentResults,
			deliberation: schema.deliberations,
		})
		.from(schema.deliberationStudentResults)
		.innerJoin(
			schema.deliberations,
			eq(
				schema.deliberations.id,
				schema.deliberationStudentResults.deliberationId,
			),
		)
		.where(
			and(
				eq(schema.deliberationStudentResults.studentId, studentId),
				eq(schema.deliberationStudentResults.deliberationId, deliberationId),
				eq(schema.deliberations.institutionId, institutionId),
			),
		)
		.limit(1);
	return result[0] ?? null;
}

export async function listStudentsByClass(
	institutionId: string,
	classId: string,
) {
	return await db.query.students.findMany({
		where: and(
			eq(schema.students.institutionId, institutionId),
			eq(schema.students.class, classId),
		),
		with: { profile: true },
	});
}

export async function listStudentsByDeliberation(deliberationId: string) {
	return await db.query.deliberationStudentResults.findMany({
		where: eq(schema.deliberationStudentResults.deliberationId, deliberationId),
	});
}

/**
 * Roster query: returns students filtered by any combination of classId,
 * programId (via classes.program), academicYearId (via classes.academicYear)
 * or explicit studentIds. All filters are AND-combined; an institutionId
 * filter is always applied.
 *
 * Includes profile and class context so the template can render names,
 * registration numbers, and per-row class/program columns.
 */
export async function listRosterStudents(
	institutionId: string,
	filters: {
		classId?: string;
		programId?: string;
		academicYearId?: string;
		studentIds?: string[];
	},
) {
	// Lazy import to avoid pulling drizzle helpers at module scope
	const { and, eq, inArray } = await import("drizzle-orm");
	const conditions = [eq(schema.students.institutionId, institutionId)];
	if (filters.classId) {
		conditions.push(eq(schema.students.class, filters.classId));
	}
	if (filters.studentIds && filters.studentIds.length > 0) {
		conditions.push(inArray(schema.students.id, filters.studentIds));
	}
	// program/year filter via classes is handled in-memory after the join.
	const rows = await db.query.students.findMany({
		where: and(...conditions),
		with: {
			profile: true,
			classRef: {
				with: {
					program: true,
					academicYear: true,
				},
			},
		},
	});
	return rows.filter((s) => {
		if (filters.programId && s.classRef?.program?.id !== filters.programId) {
			return false;
		}
		if (
			filters.academicYearId &&
			s.classRef?.academicYear?.id !== filters.academicYearId
		) {
			return false;
		}
		return true;
	});
}

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

	const institution = await db.query.institutions.findFirst({
		where: eq(schema.institutions.id, institutionId),
	});
	const tutelleChain = await loadTutelleChain(institutionId);

	return { student, institution, tutelleChain };
}

/**
 * Walk the `parent_institution_id` chain from the given institution up to the
 * root and return the parents top-down (the highest tutelle first, the direct
 * parent last). The institution itself is NOT included.
 *
 * Example: ISSAM → FMSP → UDo gives `[UDo, FMSP]` (rendered top to bottom in
 * the header so the highest authority appears first).
 *
 * Defensive against accidental cycles (caps depth at 10).
 */
export async function loadTutelleChain(
	institutionId: string,
): Promise<Array<schema.Institution>> {
	const seen = new Set<string>();
	const chain: schema.Institution[] = [];
	let currentId: string | null = institutionId;
	for (let depth = 0; depth < 10 && currentId; depth++) {
		if (seen.has(currentId)) break;
		seen.add(currentId);
		const inst: schema.Institution | undefined =
			await db.query.institutions.findFirst({
				where: eq(schema.institutions.id, currentId),
			});
		if (!inst) break;
		// Only the parents — skip the starting institution itself.
		if (inst.id !== institutionId) chain.push(inst);
		currentId = inst.parentInstitutionId ?? null;
	}
	// Top-down order (highest tutelle first).
	return chain.reverse();
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
 * Resolve the full center branding (incl. admin instances + legal texts) from
 * a class's parent program. Returns null when the program has no center.
 */
export async function loadCenterByClass(classId: string) {
	const [classRow] = await db
		.select({ programId: schema.classes.program })
		.from(schema.classes)
		.where(eq(schema.classes.id, classId))
		.limit(1);
	if (!classRow?.programId) return null;
	return await loadCenterByProgram(classRow.programId);
}

export async function loadCenterByProgram(programId: string) {
	const [programRow] = await db
		.select({ centerId: schema.programs.centerId })
		.from(schema.programs)
		.where(eq(schema.programs.id, programId))
		.limit(1);
	if (!programRow?.centerId) return null;
	const center = await db.query.centers.findFirst({
		where: eq(schema.centers.id, programRow.centerId),
	});
	if (!center) return null;
	const [adminInstances, legalTexts] = await Promise.all([
		db
			.select()
			.from(schema.centerAdministrativeInstances)
			.where(
				eq(schema.centerAdministrativeInstances.centerId, programRow.centerId),
			)
			.orderBy(schema.centerAdministrativeInstances.orderIndex),
		db
			.select()
			.from(schema.centerLegalTexts)
			.where(eq(schema.centerLegalTexts.centerId, programRow.centerId))
			.orderBy(schema.centerLegalTexts.orderIndex),
	]);
	return {
		id: center.id,
		code: center.code,
		name: center.name,
		nameEn: center.nameEn,
		shortName: center.shortName,
		logoUrl: center.logoUrl,
		logoSvg: center.logoSvg,
		adminInstanceLogoUrl: center.adminInstanceLogoUrl,
		adminInstanceLogoSvg: center.adminInstanceLogoSvg,
		watermarkLogoUrl: center.watermarkLogoUrl,
		watermarkLogoSvg: center.watermarkLogoSvg,
		authorizationOrderFr: center.authorizationOrderFr,
		authorizationOrderEn: center.authorizationOrderEn,
		postalBox: center.postalBox,
		contactEmail: center.contactEmail,
		contactPhone: center.contactPhone,
		city: center.city,
		country: center.country,
		administrativeInstances: adminInstances.map((i) => ({
			nameFr: i.nameFr,
			nameEn: i.nameEn,
			acronymFr: i.acronymFr,
			acronymEn: i.acronymEn,
			logoUrl: i.logoUrl,
			logoSvg: i.logoSvg,
			showOnTranscripts: i.showOnTranscripts,
			showOnCertificates: i.showOnCertificates,
		})),
		legalTexts: legalTexts.map((l) => ({
			textFr: l.textFr,
			textEn: l.textEn,
		})),
	};
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

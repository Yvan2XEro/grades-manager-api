import { and, desc, eq, inArray, sql } from "drizzle-orm";
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
	/**
	 * Class the document is about (e.g. the class of a past enrollment). When
	 * omitted, the student's current class is used.
	 */
	classId?: string | null,
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

	if (classId && classId !== student.class) {
		const classRef = await loadClassForDocument(institutionId, classId);
		if (classRef) {
			Object.assign(student, { class: classRef.id, classRef });
		}
	}

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
			.orderBy(
				sql`${schema.deliberations.deliberationDate} desc nulls last`,
				desc(schema.deliberations.createdAt),
			)
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
 * Resolve the academic year for a gate check.
 * When a deliberationId is provided, uses that deliberation's academic year
 * (for historical document generation). Otherwise falls back to the student's
 * currently assigned class year.
 */
export async function resolveAcademicYearIdForGate(
	studentId: string,
	institutionId: string,
	deliberationId?: string,
): Promise<string | null> {
	if (deliberationId) {
		const [row] = await db
			.select({ academicYearId: schema.deliberations.academicYearId })
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
		if (row?.academicYearId) return row.academicYearId;
	}
	const [row] = await db
		.select({ academicYearId: schema.classes.academicYear })
		.from(schema.students)
		.innerJoin(schema.classes, eq(schema.classes.id, schema.students.class))
		.where(
			and(
				eq(schema.students.id, studentId),
				eq(schema.students.institutionId, institutionId),
			),
		)
		.limit(1);
	return row?.academicYearId ?? null;
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

/** A class with the relations the document templates need. */
export async function loadClassForDocument(
	institutionId: string,
	classId: string,
) {
	return (
		(await db.query.classes.findFirst({
			where: and(
				eq(schema.classes.id, classId),
				eq(schema.classes.institutionId, institutionId),
			),
			with: {
				program: { with: { center: true } },
				academicYear: true,
				cycleLevel: true,
				semester: true,
				programOption: true,
			},
		})) ?? null
	);
}

/** Enrollments of one student, most recent first, with class + year names. */
export async function listStudentEnrollments(
	institutionId: string,
	studentId: string,
) {
	return await db
		.select({
			id: schema.enrollments.id,
			classId: schema.enrollments.classId,
			academicYearId: schema.enrollments.academicYearId,
			status: schema.enrollments.status,
			enrolledAt: schema.enrollments.enrolledAt,
			className: schema.classes.name,
			academicYearName: schema.academicYears.name,
		})
		.from(schema.enrollments)
		.innerJoin(
			schema.classes,
			eq(schema.classes.id, schema.enrollments.classId),
		)
		.innerJoin(
			schema.academicYears,
			eq(schema.academicYears.id, schema.enrollments.academicYearId),
		)
		.where(
			and(
				eq(schema.enrollments.institutionId, institutionId),
				eq(schema.enrollments.studentId, studentId),
			),
		)
		.orderBy(
			desc(schema.academicYears.startDate),
			desc(schema.enrollments.enrolledAt),
		);
}

/** Every enrollment of a class with the student identity (batch roster). */
export async function listClassEnrollments(
	institutionId: string,
	classId: string,
) {
	return await db
		.select({
			studentId: schema.students.id,
			registrationNumber: schema.students.registrationNumber,
			firstName: schema.domainUsers.firstName,
			lastName: schema.domainUsers.lastName,
			enrollmentStatus: schema.enrollments.status,
			academicYearId: schema.enrollments.academicYearId,
		})
		.from(schema.enrollments)
		.innerJoin(
			schema.students,
			eq(schema.students.id, schema.enrollments.studentId),
		)
		.innerJoin(
			schema.domainUsers,
			eq(schema.domainUsers.id, schema.students.domainUserId),
		)
		.where(
			and(
				eq(schema.enrollments.institutionId, institutionId),
				eq(schema.enrollments.classId, classId),
			),
		)
		.orderBy(schema.domainUsers.lastName, schema.domainUsers.firstName);
}

/**
 * Year-end jury results (annual and retake deliberations) of the given
 * students, most recent first. Used to decide whether a pass certificate or
 * a diploma may be issued.
 */
export async function listFinalDeliberationResults(
	institutionId: string,
	studentIds: string[],
	academicYearId?: string | null,
) {
	if (studentIds.length === 0) return [];
	const conditions = [
		eq(schema.deliberations.institutionId, institutionId),
		inArray(schema.deliberations.type, ["annual", "retake"]),
		inArray(schema.deliberationStudentResults.studentId, studentIds),
	];
	if (academicYearId) {
		conditions.push(eq(schema.deliberations.academicYearId, academicYearId));
	}
	return await db
		.select({
			studentId: schema.deliberationStudentResults.studentId,
			finalDecision: schema.deliberationStudentResults.finalDecision,
			autoDecision: schema.deliberationStudentResults.autoDecision,
			deliberationId: schema.deliberations.id,
			deliberationStatus: schema.deliberations.status,
			classId: schema.deliberations.classId,
			academicYearId: schema.deliberations.academicYearId,
		})
		.from(schema.deliberationStudentResults)
		.innerJoin(
			schema.deliberations,
			eq(
				schema.deliberations.id,
				schema.deliberationStudentResults.deliberationId,
			),
		)
		.where(and(...conditions))
		.orderBy(
			sql`${schema.deliberations.deliberationDate} desc nulls last`,
			desc(schema.deliberations.createdAt),
		);
}

/**
 * Registers an issued document and returns its sequence: the next number of
 * its (institution, kind, issue year). Retries when a concurrent issue took
 * the same number (unique constraint).
 */
export async function registerIssuedDocument(args: {
	institutionId: string;
	studentId: string;
	kind: string;
	classId?: string | null;
	academicYearId?: string | null;
	issuedBy?: string | null;
	formatReference: (sequence: number, year: number) => string;
}) {
	const year = new Date().getFullYear();
	for (let attempt = 0; attempt < 5; attempt++) {
		const [row] = await db
			.select({
				max: sql<number>`coalesce(max(${schema.issuedDocuments.sequence}), 0)`,
			})
			.from(schema.issuedDocuments)
			.where(
				and(
					eq(schema.issuedDocuments.institutionId, args.institutionId),
					eq(schema.issuedDocuments.kind, args.kind),
					eq(schema.issuedDocuments.issueYear, year),
				),
			);
		const sequence = Number(row?.max ?? 0) + 1;
		const referenceNumber = args.formatReference(sequence, year);
		try {
			const [issued] = await db
				.insert(schema.issuedDocuments)
				.values({
					institutionId: args.institutionId,
					studentId: args.studentId,
					kind: args.kind,
					issueYear: year,
					sequence,
					referenceNumber,
					classId: args.classId ?? null,
					academicYearId: args.academicYearId ?? null,
					issuedBy: args.issuedBy ?? null,
				})
				.returning();
			return issued;
		} catch (err) {
			if (attempt === 4) throw err;
		}
	}
	throw new Error("Could not allocate a document reference number");
}

/** Removes a register entry whose document could not be produced. */
export async function deleteIssuedDocument(id: string) {
	await db
		.delete(schema.issuedDocuments)
		.where(eq(schema.issuedDocuments.id, id));
}

import {
	and,
	count,
	desc,
	eq,
	ilike,
	inArray,
	isNull,
	or,
	type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import {
	type AdmissionApplicationStatus,
	type AdmissionDocumentStatus,
	academicYears,
	admissionApplicationDocuments,
	admissionApplications,
	admissionDocumentRequirements,
	applicants,
	classes,
	type NewAdmissionApplication,
	type NewAdmissionApplicationDocument,
	type NewApplicant,
	programs,
} from "@/db/schema/app-schema";

export async function createApplicant(data: NewApplicant) {
	const [row] = await db.insert(applicants).values(data).returning();
	return row!;
}

export async function createApplication(data: NewAdmissionApplication) {
	const [row] = await db.insert(admissionApplications).values(data).returning();
	return row!;
}

export async function findByReferenceCode(
	institutionId: string,
	referenceCode: string,
) {
	return db.query.applicants.findFirst({
		where: and(
			eq(applicants.institutionId, institutionId),
			eq(applicants.referenceCode, referenceCode),
		),
		with: {
			applications: {
				with: {
					program: true,
					class: true,
					academicYear: true,
				},
				orderBy: [desc(admissionApplications.createdAt)],
			},
		},
	});
}

export async function findApplicationById(
	institutionId: string,
	applicationId: string,
) {
	return db.query.admissionApplications.findFirst({
		where: and(
			eq(admissionApplications.institutionId, institutionId),
			eq(admissionApplications.id, applicationId),
		),
		with: {
			applicant: true,
			program: true,
			class: true,
			academicYear: true,
			reviewedBy: true,
			convertedStudent: true,
			documents: {
				with: {
					reviewedBy: true,
				},
				orderBy: [desc(admissionApplicationDocuments.createdAt)],
			},
		},
	});
}

export async function listApplications(
	institutionId: string,
	filters: {
		status?: AdmissionApplicationStatus | null;
		programId?: string | null;
		academicYearId?: string | null;
		search?: string | null;
		limit: number;
		offset: number;
	},
) {
	const conditions: SQL[] = [
		eq(admissionApplications.institutionId, institutionId),
	];

	if (filters.status)
		conditions.push(eq(admissionApplications.status, filters.status));
	if (filters.programId)
		conditions.push(eq(admissionApplications.programId, filters.programId));
	if (filters.academicYearId)
		conditions.push(
			eq(admissionApplications.academicYearId, filters.academicYearId),
		);

	// Search must be resolved against the applicants table first — the relational
	// query API does not join applicants in the WHERE clause of the root query.
	if (filters.search?.trim()) {
		const q = `%${filters.search.trim()}%`;
		const matched = await db
			.select({ id: applicants.id })
			.from(applicants)
			.where(
				and(
					eq(applicants.institutionId, institutionId),
					or(
						ilike(applicants.firstName, q),
						ilike(applicants.lastName, q),
						ilike(applicants.email, q),
						ilike(applicants.referenceCode, q),
					),
				),
			);
		if (matched.length === 0) return { rows: [], total: 0 };
		conditions.push(
			inArray(
				admissionApplications.applicantId,
				matched.map((r) => r.id),
			),
		);
	}

	const where = and(...conditions);

	const [rows, [{ total }]] = await Promise.all([
		db.query.admissionApplications.findMany({
			where,
			with: {
				applicant: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						phone: true,
						referenceCode: true,
						gender: true,
						nationality: true,
						dateOfBirth: true,
					},
				},
				program: { columns: { id: true, name: true, code: true } },
				academicYear: { columns: { id: true, name: true } },
				reviewedBy: { columns: { id: true, firstName: true, lastName: true } },
			},
			orderBy: [desc(admissionApplications.submittedAt)],
			limit: filters.limit,
			offset: filters.offset,
		}),
		db.select({ total: count() }).from(admissionApplications).where(where),
	]);

	return { rows, total };
}

export async function updateApplicationStatus(
	institutionId: string,
	applicationId: string,
	data: {
		status: AdmissionApplicationStatus;
		reviewNotes?: string | null;
		reviewedById?: string;
		reviewedAt?: Date;
		submittedAt?: Date;
		convertedStudentId?: string;
	},
) {
	const [row] = await db
		.update(admissionApplications)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(admissionApplications.institutionId, institutionId),
				eq(admissionApplications.id, applicationId),
			),
		)
		.returning();
	return row!;
}

export async function setConvertedStudentId(
	tx: Pick<typeof db, "update">,
	institutionId: string,
	applicationId: string,
	studentId: string,
) {
	const [row] = await tx
		.update(admissionApplications)
		.set({ convertedStudentId: studentId, updatedAt: new Date() })
		.where(
			and(
				eq(admissionApplications.institutionId, institutionId),
				eq(admissionApplications.id, applicationId),
				isNull(admissionApplications.convertedStudentId),
			),
		)
		.returning();
	return row ?? null;
}

export async function findProgramsForInstitution(institutionId: string) {
	return db.query.programs.findMany({
		where: eq(programs.institutionId, institutionId),
		columns: { id: true, name: true, code: true },
	});
}

export async function findAcademicYearsForInstitution(institutionId: string) {
	return db.query.academicYears.findMany({
		where: eq(academicYears.institutionId, institutionId),
		columns: { id: true, name: true, startDate: true, endDate: true },
		orderBy: [desc(academicYears.createdAt)],
	});
}

export async function findClassesForInstitution(institutionId: string) {
	return db.query.classes.findMany({
		where: eq(classes.institutionId, institutionId),
		columns: {
			id: true,
			name: true,
			code: true,
			program: true,
			academicYear: true,
			cycleLevelId: true,
		},
		with: {
			cycleLevel: { columns: { code: true, name: true } },
		},
		orderBy: [desc(classes.createdAt)],
	});
}

export async function listDocumentRequirements(
	institutionId: string,
	opts: { programId?: string | null; includeInactive?: boolean },
) {
	const conditions = [
		eq(admissionDocumentRequirements.institutionId, institutionId),
		opts.programId
			? or(
					isNull(admissionDocumentRequirements.programId),
					eq(admissionDocumentRequirements.programId, opts.programId),
				)
			: isNull(admissionDocumentRequirements.programId),
	];
	if (!opts.includeInactive) {
		conditions.push(eq(admissionDocumentRequirements.isActive, true));
	}
	return db.query.admissionDocumentRequirements.findMany({
		where: and(...conditions),
		orderBy: [desc(admissionDocumentRequirements.isRequired)],
	});
}

export async function upsertDocumentRequirement(
	institutionId: string,
	data: {
		id?: string | null;
		programId?: string | null;
		code: string;
		label: string;
		description?: string | null;
		isRequired?: boolean;
		allowedMimeTypes?: string[] | null;
		maxSizeBytes?: number | null;
		isActive?: boolean;
	},
) {
	if (data.id) {
		const [row] = await db
			.update(admissionDocumentRequirements)
			.set({
				programId: data.programId ?? null,
				code: data.code,
				label: data.label,
				description: data.description ?? null,
				isRequired: data.isRequired ?? true,
				allowedMimeTypes: data.allowedMimeTypes ?? [],
				maxSizeBytes: data.maxSizeBytes ?? null,
				isActive: data.isActive ?? true,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(admissionDocumentRequirements.institutionId, institutionId),
					eq(admissionDocumentRequirements.id, data.id),
				),
			)
			.returning();
		return row ?? null;
	}

	const [row] = await db
		.insert(admissionDocumentRequirements)
		.values({
			programId: data.programId ?? null,
			code: data.code,
			label: data.label,
			description: data.description ?? null,
			isRequired: data.isRequired ?? true,
			allowedMimeTypes: data.allowedMimeTypes ?? [],
			maxSizeBytes: data.maxSizeBytes ?? null,
			isActive: data.isActive ?? true,
			institutionId,
		})
		.onConflictDoUpdate({
			target: [
				admissionDocumentRequirements.institutionId,
				admissionDocumentRequirements.programId,
				admissionDocumentRequirements.code,
			],
			set: {
				label: data.label,
				description: data.description ?? null,
				isRequired: data.isRequired ?? true,
				allowedMimeTypes: data.allowedMimeTypes ?? [],
				maxSizeBytes: data.maxSizeBytes ?? null,
				isActive: data.isActive ?? true,
				updatedAt: new Date(),
			},
		})
		.returning();
	return row!;
}

export async function findRequirementById(
	institutionId: string,
	requirementId: string,
) {
	return db.query.admissionDocumentRequirements.findFirst({
		where: and(
			eq(admissionDocumentRequirements.institutionId, institutionId),
			eq(admissionDocumentRequirements.id, requirementId),
		),
	});
}

export async function listApplicationDocuments(
	institutionId: string,
	applicationId: string,
) {
	return db.query.admissionApplicationDocuments.findMany({
		where: and(
			eq(admissionApplicationDocuments.institutionId, institutionId),
			eq(admissionApplicationDocuments.applicationId, applicationId),
		),
		with: { reviewedBy: true, requirement: true },
		orderBy: [desc(admissionApplicationDocuments.createdAt)],
	});
}

export async function upsertApplicationDocument(
	institutionId: string,
	data: Omit<NewAdmissionApplicationDocument, "institutionId" | "status">,
) {
	const [row] = await db
		.insert(admissionApplicationDocuments)
		.values({
			...data,
			requirementId: data.requirementId ?? null,
			mimeType: data.mimeType ?? null,
			sizeBytes: data.sizeBytes ?? null,
			institutionId,
			status: "pending",
		})
		.onConflictDoUpdate({
			target: [
				admissionApplicationDocuments.applicationId,
				admissionApplicationDocuments.code,
			],
			set: {
				requirementId: data.requirementId ?? null,
				label: data.label,
				fileName: data.fileName,
				fileUrl: data.fileUrl,
				mimeType: data.mimeType ?? null,
				sizeBytes: data.sizeBytes ?? null,
				status: "pending",
				reviewNotes: null,
				reviewedById: null,
				reviewedAt: null,
				updatedAt: new Date(),
			},
		})
		.returning();
	return row!;
}

export async function reviewApplicationDocument(
	institutionId: string,
	documentId: string,
	data: {
		status: AdmissionDocumentStatus;
		reviewNotes?: string | null;
		reviewedById: string;
	},
) {
	const [row] = await db
		.update(admissionApplicationDocuments)
		.set({
			status: data.status,
			reviewNotes: data.reviewNotes ?? null,
			reviewedById: data.reviewedById,
			reviewedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(admissionApplicationDocuments.institutionId, institutionId),
				eq(admissionApplicationDocuments.id, documentId),
			),
		)
		.returning();
	return row ?? null;
}

/** Returns the program only if it belongs to `institutionId`. */
export async function requireProgramForInstitution(
	institutionId: string,
	programId: string,
) {
	return db.query.programs.findFirst({
		where: and(
			eq(programs.id, programId),
			eq(programs.institutionId, institutionId),
		),
		columns: { id: true },
	});
}

/** Returns the academic year only if it belongs to `institutionId`. */
export async function requireAcademicYearForInstitution(
	institutionId: string,
	academicYearId: string,
) {
	return db.query.academicYears.findFirst({
		where: and(
			eq(academicYears.id, academicYearId),
			eq(academicYears.institutionId, institutionId),
		),
		columns: { id: true },
	});
}

/** Returns the class only if it belongs to `institutionId`, the given `programId`, and `academicYearId`. */
export async function requireClassForInstitution(
	institutionId: string,
	classId: string,
	programId: string,
	academicYearId: string,
) {
	return db.query.classes.findFirst({
		where: and(
			eq(classes.id, classId),
			eq(classes.institutionId, institutionId),
			eq(classes.program, programId),
			eq(classes.academicYear, academicYearId),
		),
		columns: { id: true },
	});
}

/** Returns the class only if it belongs to `institutionId`. */
export async function requireClassByIdForInstitution(
	institutionId: string,
	classId: string,
) {
	return db.query.classes.findFirst({
		where: and(
			eq(classes.id, classId),
			eq(classes.institutionId, institutionId),
		),
	});
}

export async function findExistingApplicant(
	institutionId: string,
	email: string,
) {
	return db.query.applicants.findFirst({
		where: and(
			eq(applicants.institutionId, institutionId),
			eq(applicants.email, email),
		),
	});
}

export async function findPendingApplicationForApplicant(
	institutionId: string,
	applicantId: string,
	academicYearId: string,
) {
	return db.query.admissionApplications.findFirst({
		where: and(
			eq(admissionApplications.institutionId, institutionId),
			eq(admissionApplications.applicantId, applicantId),
			eq(admissionApplications.academicYearId, academicYearId),
			isNull(admissionApplications.convertedStudentId),
		),
	});
}

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
	type AdmissionApplicationStatus,
	academicYears,
	admissionApplications,
	applicants,
	classes,
	type NewAdmissionApplication,
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
		},
	});
}

export async function listApplications(
	institutionId: string,
	filters: {
		status?: AdmissionApplicationStatus | null;
		programId?: string | null;
		academicYearId?: string | null;
		limit: number;
		offset: number;
	},
) {
	const conditions = [eq(admissionApplications.institutionId, institutionId)];

	if (filters.status) {
		conditions.push(eq(admissionApplications.status, filters.status));
	}
	if (filters.programId) {
		conditions.push(eq(admissionApplications.programId, filters.programId));
	}
	if (filters.academicYearId) {
		conditions.push(
			eq(admissionApplications.academicYearId, filters.academicYearId),
		);
	}

	return db.query.admissionApplications.findMany({
		where: and(...conditions),
		with: {
			applicant: true,
			program: { columns: { id: true, name: true, code: true } },
			academicYear: { columns: { id: true, name: true } },
			reviewedBy: { columns: { id: true, firstName: true, lastName: true } },
		},
		orderBy: [desc(admissionApplications.createdAt)],
		limit: filters.limit,
		offset: filters.offset,
	});
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

export async function findProgramsForInstitution(institutionId: string) {
	return db.query.programs.findMany({
		where: eq(programs.institutionId, institutionId),
		columns: { id: true, name: true, code: true },
	});
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

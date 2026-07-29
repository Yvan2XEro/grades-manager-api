import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import type {
	AdmissionApplicationStatus,
	Gender,
} from "@/db/schema/app-schema";
import * as schema from "@/db/schema/app-schema";
import { transaction } from "../_shared/db-transaction";
import { conflict, notFound } from "../_shared/errors";
import * as classesRepo from "../classes/classes.repo";
import * as registrationNumbersService from "../registration-numbers/registration-numbers.service";
import * as repo from "./admissions.repo";
import type {
	convertApplicationSchema,
	listRequirementsSchema,
	reviewDocumentSchema,
	submitApplicationSchema,
	submitDocumentSchema,
	upsertRequirementSchema,
} from "./admissions.zod";

function mapApplicantGender(raw: string | null | undefined): Gender | null {
	if (!raw) return null;
	if (raw === "masculin" || raw === "male") return "male";
	if (raw === "feminin" || raw === "female") return "female";
	return "other";
}

// Statuses from which an admin can render a final decision.
const REVIEWABLE_STATUSES: AdmissionApplicationStatus[] = [
	"submitted",
	"under_review",
];
// Statuses that cannot transition further (terminal states).
const TERMINAL_STATUSES: AdmissionApplicationStatus[] = [
	"accepted",
	"rejected",
	"waitlisted",
];

function generateReferenceCode(year: number): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let suffix = "";
	for (let i = 0; i < 8; i++) {
		suffix += chars[Math.floor(Math.random() * chars.length)];
	}
	return `APP-${year}-${suffix.slice(0, 4)}-${suffix.slice(4)}`;
}

export async function submitApplication(
	institutionId: string,
	input: z.infer<typeof submitApplicationSchema>,
) {
	const year = new Date().getFullYear();

	// Validate that programId and academicYearId belong to this institution
	// (prevents cross-tenant UUID injection).
	const [program, academicYear] = await Promise.all([
		repo.requireProgramForInstitution(institutionId, input.programId),
		repo.requireAcademicYearForInstitution(institutionId, input.academicYearId),
	]);
	if (!program) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Program not found for this institution",
		});
	}
	if (!academicYear) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Academic year not found for this institution",
		});
	}
	if (input.classId) {
		const cls = await repo.requireClassForInstitution(
			institutionId,
			input.classId,
			input.programId,
			input.academicYearId,
		);
		if (!cls) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message:
					"Class not found or does not match the program/year for this institution",
			});
		}
	}

	// Re-use existing applicant record if same email in same institution.
	// On concurrent submission the unique constraint on (institution_id, email)
	// ensures only one row is created; we re-fetch on violation.
	let applicant = await repo.findExistingApplicant(
		institutionId,
		input.applicant.email,
	);

	if (!applicant) {
		// Retry up to 5 times on the (extremely unlikely) reference-code collision.
		for (let attempt = 0; attempt < 5; attempt++) {
			const referenceCode = generateReferenceCode(year);
			try {
				applicant = await repo.createApplicant({
					institutionId,
					...input.applicant,
					referenceCode,
				});
				break;
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);
				if (msg.includes("uq_applicants_institution_email")) {
					// Concurrent request created the applicant first — re-fetch.
					applicant = await repo.findExistingApplicant(
						institutionId,
						input.applicant.email,
					);
					if (applicant) break;
				}
				if (attempt === 4)
					throw new Error("Failed to generate unique reference code");
			}
		}
	}

	// Prevent duplicate open applications for the same year.
	const existing = await repo.findPendingApplicationForApplicant(
		institutionId,
		applicant!.id,
		input.academicYearId,
	);
	if (existing) {
		throw conflict(
			"An active application already exists for this applicant and academic year",
		);
	}

	const application = await repo.createApplication({
		institutionId,
		applicantId: applicant!.id,
		programId: input.programId,
		secondChoiceProgramId: input.secondChoiceProgramId ?? null,
		thirdChoiceProgramId: input.thirdChoiceProgramId ?? null,
		classId: input.classId ?? null,
		academicYearId: input.academicYearId,
		academicLevel: input.academicLevel ?? null,
		trainingType: input.trainingType ?? null,
		personalStatement: input.personalStatement ?? null,
		status: "submitted",
		submittedAt: new Date(),
	});

	return { application, referenceCode: applicant!.referenceCode };
}

export async function getByReferenceCode(
	institutionId: string,
	referenceCode: string,
) {
	const applicant = await repo.findByReferenceCode(
		institutionId,
		referenceCode.toUpperCase(),
	);
	if (!applicant)
		throw notFound("No application found for this reference code");
	return applicant;
}

export async function getStatus(institutionId: string, referenceCode: string) {
	const applicant = await getByReferenceCode(institutionId, referenceCode);
	const application = applicant.applications[0];
	if (!application) {
		throw notFound("No application found for this reference code");
	}
	const checklist = await getApplicationChecklist(
		institutionId,
		application.id,
	);

	return {
		applicant: {
			id: applicant.id,
			referenceCode: applicant.referenceCode,
			firstName: applicant.firstName,
			lastName: applicant.lastName,
			email: applicant.email,
			phone: applicant.phone,
		},
		application,
		checklist,
	};
}

export async function listApplications(
	institutionId: string,
	filters: {
		status?: string | null;
		programId?: string | null;
		academicYearId?: string | null;
		search?: string | null;
		limit: number;
		offset: number;
	},
) {
	return repo.listApplications(institutionId, {
		...filters,
		status: filters.status as AdmissionApplicationStatus | null,
	});
}

export async function getPublicOptions(institutionId: string) {
	const [programs, academicYears, classes] = await Promise.all([
		repo.findProgramsForInstitution(institutionId),
		repo.findAcademicYearsForInstitution(institutionId),
		repo.findClassesForInstitution(institutionId),
	]);

	return {
		programs,
		academicYears,
		classes,
	};
}

export async function getApplication(institutionId: string, id: string) {
	const app = await repo.findApplicationById(institutionId, id);
	if (!app) throw notFound("Application not found");
	return app;
}

export async function reviewApplication(
	institutionId: string,
	reviewerId: string,
	input: {
		id: string;
		status: "accepted" | "rejected" | "waitlisted";
		reviewNotes?: string | null;
	},
) {
	const app = await repo.findApplicationById(institutionId, input.id);
	if (!app) throw notFound("Application not found");

	if ((TERMINAL_STATUSES as string[]).includes(app.status)) {
		throw conflict(
			`Application is already in a terminal state (${app.status}) and cannot be re-decided`,
		);
	}
	if (!(REVIEWABLE_STATUSES as string[]).includes(app.status)) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: `Application cannot be reviewed from status "${app.status}"`,
		});
	}

	return repo.updateApplicationStatus(institutionId, input.id, {
		status: input.status,
		reviewNotes: input.reviewNotes ?? null,
		reviewedById: reviewerId,
		reviewedAt: new Date(),
	});
}

export async function setUnderReview(
	institutionId: string,
	id: string,
	reviewerId: string,
) {
	const app = await repo.findApplicationById(institutionId, id);
	if (!app) throw notFound("Application not found");

	if (app.status !== "submitted") {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "Only submitted applications can be moved to under review",
		});
	}

	return repo.updateApplicationStatus(institutionId, id, {
		status: "under_review",
		reviewedById: reviewerId,
		reviewedAt: new Date(),
	});
}

export async function convertAcceptedApplication(
	institutionId: string,
	input: z.infer<typeof convertApplicationSchema>,
) {
	const app = await repo.findApplicationById(institutionId, input.id);
	if (!app) throw notFound("Application not found");

	if (app.status !== "accepted") {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "Only accepted applications can be converted to students",
		});
	}
	if (app.convertedStudentId) {
		throw conflict("Application has already been converted to a student");
	}

	const classId = input.classId ?? app.classId;
	if (!classId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "A target class is required to convert this application",
		});
	}

	const klass = await classesRepo.findById(classId, institutionId);
	if (!klass) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Target class not found for this institution",
		});
	}
	if (
		klass.program !== app.programId ||
		klass.academicYear !== app.academicYearId
	) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message:
				"Target class must match the accepted application program and academic year",
		});
	}

	const studentId = await transaction(async (tx) => {
		const registrationNumber =
			input.registrationNumber ??
			(await registrationNumbersService.issueRegistrationNumber({
				klass,
				profile: {
					firstName: app.applicant.firstName,
					lastName: app.applicant.lastName,
					nationality: app.applicant.nationality,
				},
				tx,
				formatId: input.registrationFormatId ?? undefined,
			}));

		const [profile] = await tx
			.insert(schema.domainUsers)
			.values({
				firstName: app.applicant.firstName,
				lastName: app.applicant.lastName,
				primaryEmail: app.applicant.email,
				phone: app.applicant.phone ?? null,
				dateOfBirth: app.applicant.dateOfBirth ?? null,
				placeOfBirth: app.applicant.placeOfBirth ?? null,
				gender: mapApplicantGender(app.applicant.gender),
				nationality: app.applicant.nationality ?? null,
				status: "active",
			})
			.returning();

		const [student] = await tx
			.insert(schema.students)
			.values({
				class: classId,
				registrationNumber,
				domainUserId: profile!.id,
				institutionId,
			})
			.returning();

		await tx.insert(schema.enrollments).values({
			studentId: student!.id,
			classId,
			academicYearId: app.academicYearId,
			institutionId,
			status: "active",
			admissionType: "normal",
			admissionDate: new Date(),
			admissionJustification: app.reviewNotes ?? null,
			admissionMetadata: {
				source: "admission_application",
				applicationId: app.id,
				applicantId: app.applicantId,
				referenceCode: app.applicant.referenceCode,
			},
		});

		const converted = await repo.setConvertedStudentId(
			tx,
			institutionId,
			app.id,
			student!.id,
		);
		if (!converted) {
			throw conflict("Application has already been converted to a student");
		}

		return student!.id;
	});

	const converted = await repo.findApplicationById(institutionId, input.id);
	return {
		application: converted,
		studentId,
	};
}

export async function listDocumentRequirements(
	institutionId: string,
	input: z.infer<typeof listRequirementsSchema>,
) {
	return repo.listDocumentRequirements(institutionId, input);
}

export async function upsertDocumentRequirement(
	institutionId: string,
	input: z.infer<typeof upsertRequirementSchema>,
) {
	if (input.programId) {
		const program = await repo.requireProgramForInstitution(
			institutionId,
			input.programId,
		);
		if (!program) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Program not found for this institution",
			});
		}
	}
	const requirement = await repo.upsertDocumentRequirement(institutionId, {
		id: input.id ?? null,
		programId: input.programId ?? null,
		code: input.code.trim().toLowerCase(),
		label: input.label.trim(),
		description: input.description ?? null,
		isRequired: input.isRequired,
		allowedMimeTypes: input.allowedMimeTypes,
		maxSizeBytes: input.maxSizeBytes ?? null,
		isActive: input.isActive,
	});
	if (!requirement) throw notFound("Document requirement not found");
	return requirement;
}

export async function getApplicationChecklist(
	institutionId: string,
	applicationId: string,
) {
	const application = await repo.findApplicationById(
		institutionId,
		applicationId,
	);
	if (!application) throw notFound("Application not found");
	const [requirements, documents] = await Promise.all([
		repo.listDocumentRequirements(institutionId, {
			programId: application.programId,
			includeInactive: false,
		}),
		repo.listApplicationDocuments(institutionId, applicationId),
	]);
	const documentsByCode = new Map(documents.map((doc) => [doc.code, doc]));
	const items = requirements.map((requirement) => {
		const document = documentsByCode.get(requirement.code) ?? null;
		return {
			requirement,
			document,
			missing: requirement.isRequired && !document,
			valid: document?.status === "valid",
		};
	});
	return {
		applicationId,
		items,
		missingRequiredCount: items.filter((item) => item.missing).length,
		invalidCount: items.filter((item) => item.document?.status === "invalid")
			.length,
	};
}

export async function submitApplicationDocument(
	institutionId: string,
	input: z.infer<typeof submitDocumentSchema>,
) {
	const application = await repo.findApplicationById(
		institutionId,
		input.applicationId,
	);
	if (!application) throw notFound("Application not found");

	let requirement = null;
	if (input.requirementId) {
		requirement = await repo.findRequirementById(
			institutionId,
			input.requirementId,
		);
		if (!requirement) throw notFound("Document requirement not found");
		if (
			requirement.programId &&
			requirement.programId !== application.programId
		) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Document requirement does not apply to this application",
			});
		}
		if (
			requirement.allowedMimeTypes?.length &&
			input.mimeType &&
			!requirement.allowedMimeTypes.includes(input.mimeType)
		) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Document file type is not allowed for this requirement",
			});
		}
		if (
			requirement.maxSizeBytes &&
			input.sizeBytes &&
			input.sizeBytes > requirement.maxSizeBytes
		) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Document file is larger than the configured limit",
			});
		}
	}

	return repo.upsertApplicationDocument(institutionId, {
		applicationId: input.applicationId,
		requirementId: requirement?.id ?? input.requirementId ?? null,
		code: (requirement?.code ?? input.code).trim().toLowerCase(),
		label: requirement?.label ?? input.label.trim(),
		fileName: input.fileName,
		fileUrl: input.fileUrl,
		mimeType: input.mimeType ?? null,
		sizeBytes: input.sizeBytes ?? null,
	});
}

export async function reviewApplicationDocument(
	institutionId: string,
	reviewerId: string,
	input: z.infer<typeof reviewDocumentSchema>,
) {
	const document = await repo.reviewApplicationDocument(
		institutionId,
		input.id,
		{
			status: input.status,
			reviewNotes: input.reviewNotes ?? null,
			reviewedById: reviewerId,
		},
	);
	if (!document) throw notFound("Application document not found");
	return document;
}

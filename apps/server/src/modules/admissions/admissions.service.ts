import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import type { AdmissionApplicationStatus } from "@/db/schema/app-schema";
import { conflict, notFound } from "../_shared/errors";
import * as repo from "./admissions.repo";
import type { submitApplicationSchema } from "./admissions.zod";

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

	// Re-use existing applicant record if same email in same institution
	let applicant = await repo.findExistingApplicant(
		institutionId,
		input.applicant.email,
	);

	if (!applicant) {
		let referenceCode: string;
		// Retry up to 5 times on the extremely unlikely collision
		for (let attempt = 0; attempt < 5; attempt++) {
			referenceCode = generateReferenceCode(year);
			try {
				applicant = await repo.createApplicant({
					institutionId,
					...input.applicant,
					referenceCode,
				});
				break;
			} catch {
				if (attempt === 4)
					throw new Error("Failed to generate unique reference code");
			}
		}
	}

	// Prevent duplicate open applications for the same year
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
		classId: input.classId ?? null,
		academicYearId: input.academicYearId,
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

export async function listApplications(
	institutionId: string,
	filters: {
		status?: string | null;
		programId?: string | null;
		academicYearId?: string | null;
		limit: number;
		offset: number;
	},
) {
	return repo.listApplications(institutionId, {
		...filters,
		status: filters.status as AdmissionApplicationStatus | null,
	});
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

	if (app.status === "accepted" || app.status === "rejected") {
		throw conflict("Application has already been decided");
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

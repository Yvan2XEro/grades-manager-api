import { beforeEach, describe, expect, it, setDefaultTimeout } from "bun:test";
import type { Context } from "@/lib/context";
import {
	createAcademicYear,
	createClass,
	createDomainUser,
	createProgram,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

setDefaultTimeout(60_000);

const caller = (ctx: Context) => appRouter.createCaller(ctx);

// Recreated after each global reset
let programId: string;
let academicYearId: string;
let reviewerProfileId: string;

beforeEach(async () => {
	const program = await createProgram({ name: "Informatique", code: "INFO" });
	const year = await createAcademicYear({ name: "2026-2027" });
	const reviewer = await createDomainUser();
	programId = program.id;
	academicYearId = year.id;
	reviewerProfileId = reviewer!.id;
});

/** Admin context with a real domain_user profile in DB (required for FK on reviewed_by_id). */
function asRealAdmin() {
	return makeTestContext({
		role: "administrator",
		profileOverrides: { id: reviewerProfileId },
	});
}

const baseApplicant = {
	firstName: "Alice",
	lastName: "Martin",
	email: "alice.martin@example.com",
	phone: "+237600000001",
	dateOfBirth: "2000-05-15",
	nationality: "Camerounaise",
	previousDiploma: "Baccalauréat Série D",
	previousInstitution: "Lycée de la Cité",
};

describe("admissions.submit", () => {
	it("creates applicant + application and returns a reference code", async () => {
		const ctx = makeTestContext(); // public — no auth
		const result = await caller(ctx).admissions.submit({
			applicant: baseApplicant,
			programId,
			academicYearId,
			personalStatement: "Je souhaite intégrer ce programme.",
		});

		expect(result.referenceCode).toMatch(/^APP-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
		expect(result.application.status).toBe("submitted");
		expect(result.application.programId).toBe(programId);
		expect(result.application.submittedAt).toBeTruthy();
	});

	it("re-uses existing applicant on duplicate email for a different year", async () => {
		const ctx = makeTestContext();
		const year2 = await createAcademicYear({ name: "2027-2028" });
		const email = "repeat@example.com";

		const first = await caller(ctx).admissions.submit({
			applicant: { ...baseApplicant, email },
			programId,
			academicYearId,
		});
		const second = await caller(ctx).admissions.submit({
			applicant: { ...baseApplicant, email, firstName: "Alicia" },
			programId,
			academicYearId: year2.id,
		});

		// Same applicant → same reference code
		expect(second.referenceCode).toBe(first.referenceCode);
	});

	it("rejects duplicate application for same applicant + year", async () => {
		const ctx = makeTestContext();
		const email = "dup@example.com";

		await caller(ctx).admissions.submit({
			applicant: { ...baseApplicant, email },
			programId,
			academicYearId,
		});

		await expect(
			caller(ctx).admissions.submit({
				applicant: { ...baseApplicant, email },
				programId,
				academicYearId,
			}),
		).rejects.toThrow();
	});
});

describe("admissions.getByReferenceCode", () => {
	it("returns applicant with applications for a valid reference code", async () => {
		const ctx = makeTestContext();
		const { referenceCode } = await caller(ctx).admissions.submit({
			applicant: { ...baseApplicant, email: "ref-lookup@example.com" },
			programId,
			academicYearId,
		});

		const found = await caller(ctx).admissions.getByReferenceCode({
			referenceCode,
		});

		expect(found.referenceCode).toBe(referenceCode);
		expect(found.applications.length).toBe(1);
		expect(found.applications[0]?.status).toBe("submitted");
	});

	it("throws NOT_FOUND for an unknown reference code", async () => {
		const ctx = makeTestContext();
		await expect(
			caller(ctx).admissions.getByReferenceCode({
				referenceCode: "APP-2026-ZZZZ-ZZZZ",
			}),
		).rejects.toThrow();
	});
});

describe("admissions.list (admin)", () => {
	it("returns applications filtered by status", async () => {
		const ctx = makeTestContext();
		await caller(ctx).admissions.submit({
			applicant: { ...baseApplicant, email: "list-test@example.com" },
			programId,
			academicYearId,
		});

		const adminCtx = asRealAdmin();
		const submitted = await caller(adminCtx).admissions.list({
			status: "submitted",
			limit: 50,
			offset: 0,
		});
		expect(submitted.length).toBeGreaterThan(0);
		expect(submitted.every((a) => a.status === "submitted")).toBe(true);
	});

	it("requires admin role", async () => {
		const ctx = makeTestContext(); // no role
		await expect(
			caller(ctx).admissions.list({ limit: 10, offset: 0 }),
		).rejects.toThrow();
	});
});

describe("admissions.submit — cross-tenant validation", () => {
	it("rejects programId that does not belong to this institution", async () => {
		const ctx = makeTestContext();
		await expect(
			caller(ctx).admissions.submit({
				applicant: { ...baseApplicant, email: "cross-tenant-prog@example.com" },
				programId: "00000000-0000-0000-0000-000000000001",
				academicYearId,
			}),
		).rejects.toThrow();
	});

	it("rejects academicYearId that does not belong to this institution", async () => {
		const ctx = makeTestContext();
		await expect(
			caller(ctx).admissions.submit({
				applicant: { ...baseApplicant, email: "cross-tenant-year@example.com" },
				programId,
				academicYearId: "00000000-0000-0000-0000-000000000002",
			}),
		).rejects.toThrow();
	});
});

describe("admissions.review — state machine", () => {
	it("cannot re-decide a waitlisted application (terminal state)", async () => {
		const publicCtx = makeTestContext();
		const { application } = await caller(publicCtx).admissions.submit({
			applicant: { ...baseApplicant, email: "waitlist-lock@example.com" },
			programId,
			academicYearId,
		});

		const adminCtx = asRealAdmin();
		await caller(adminCtx).admissions.review({
			id: application.id,
			status: "waitlisted",
		});

		await expect(
			caller(adminCtx).admissions.review({
				id: application.id,
				status: "accepted",
			}),
		).rejects.toThrow();
	});
});

describe("admissions.review", () => {
	it("admin can accept an application", async () => {
		const publicCtx = makeTestContext();
		const { application } = await caller(publicCtx).admissions.submit({
			applicant: { ...baseApplicant, email: "accept-test@example.com" },
			programId,
			academicYearId,
		});

		const adminCtx = asRealAdmin();
		const reviewed = await caller(adminCtx).admissions.review({
			id: application.id,
			status: "accepted",
			reviewNotes: "Excellent dossier",
		});

		expect(reviewed.status).toBe("accepted");
		expect(reviewed.reviewNotes).toBe("Excellent dossier");
		expect(reviewed.reviewedAt).toBeTruthy();
	});

	it("admin can reject an application", async () => {
		const publicCtx = makeTestContext();
		const { application } = await caller(publicCtx).admissions.submit({
			applicant: { ...baseApplicant, email: "reject-test@example.com" },
			programId,
			academicYearId,
		});

		const adminCtx = asRealAdmin();
		const reviewed = await caller(adminCtx).admissions.review({
			id: application.id,
			status: "rejected",
			reviewNotes: "Dossier incomplet",
		});
		expect(reviewed.status).toBe("rejected");
	});

	it("cannot re-decide an already accepted application", async () => {
		const publicCtx = makeTestContext();
		const { application } = await caller(publicCtx).admissions.submit({
			applicant: { ...baseApplicant, email: "double-review@example.com" },
			programId,
			academicYearId,
		});

		const adminCtx = asRealAdmin();
		await caller(adminCtx).admissions.review({
			id: application.id,
			status: "accepted",
		});

		await expect(
			caller(adminCtx).admissions.review({
				id: application.id,
				status: "rejected",
			}),
		).rejects.toThrow();
	});

	it("requires admin role", async () => {
		const ctx = makeTestContext();
		await expect(
			caller(ctx).admissions.review({
				id: "00000000-0000-0000-0000-000000000000",
				status: "accepted",
			}),
		).rejects.toThrow();
	});
});

describe("admissions.setUnderReview", () => {
	it("moves a submitted application to under_review", async () => {
		const publicCtx = makeTestContext();
		const { application } = await caller(publicCtx).admissions.submit({
			applicant: { ...baseApplicant, email: "under-review@example.com" },
			programId,
			academicYearId,
		});

		const adminCtx = asRealAdmin();
		const updated = await caller(adminCtx).admissions.setUnderReview({
			id: application.id,
		});

		expect(updated.status).toBe("under_review");
	});

	it("requires admin role", async () => {
		const ctx = makeTestContext();
		await expect(
			caller(ctx).admissions.setUnderReview({
				id: "00000000-0000-0000-0000-000000000000",
			}),
		).rejects.toThrow();
	});
});

describe("admissions.convert", () => {
	it("converts an accepted application into a student and active enrollment", async () => {
		const klass = await createClass({
			program: programId,
			academicYear: academicYearId,
		});
		const publicCtx = makeTestContext();
		const { application } = await caller(publicCtx).admissions.submit({
			applicant: { ...baseApplicant, email: "convert-ok@example.com" },
			programId,
			academicYearId,
			classId: klass.id,
		});

		const adminCtx = asRealAdmin();
		await caller(adminCtx).admissions.review({
			id: application.id,
			status: "accepted",
			reviewNotes: "Accepted for intake",
		});

		const converted = await caller(adminCtx).admissions.convert({
			id: application.id,
			registrationNumber: "ADM-2026-001",
		});

		expect(converted.studentId).toBeTruthy();
		expect(converted.application?.convertedStudentId).toBe(converted.studentId);

		const student = await caller(adminCtx).students.getById({
			id: converted.studentId,
		});
		expect(student.registrationNumber).toBe("ADM-2026-001");
		expect(student.class).toBe(klass.id);
		expect(student.profile.primaryEmail).toBe("convert-ok@example.com");
	});

	it("rejects conversion before the application is accepted", async () => {
		const klass = await createClass({
			program: programId,
			academicYear: academicYearId,
		});
		const publicCtx = makeTestContext();
		const { application } = await caller(publicCtx).admissions.submit({
			applicant: {
				...baseApplicant,
				email: "convert-not-accepted@example.com",
			},
			programId,
			academicYearId,
			classId: klass.id,
		});

		await expect(
			caller(asRealAdmin()).admissions.convert({ id: application.id }),
		).rejects.toThrow();
	});

	it("rejects duplicate conversion of the same accepted application", async () => {
		const klass = await createClass({
			program: programId,
			academicYear: academicYearId,
		});
		const publicCtx = makeTestContext();
		const { application } = await caller(publicCtx).admissions.submit({
			applicant: { ...baseApplicant, email: "convert-once@example.com" },
			programId,
			academicYearId,
			classId: klass.id,
		});

		const adminCtx = asRealAdmin();
		await caller(adminCtx).admissions.review({
			id: application.id,
			status: "accepted",
		});
		await caller(adminCtx).admissions.convert({
			id: application.id,
			registrationNumber: "ADM-2026-002",
		});

		await expect(
			caller(adminCtx).admissions.convert({
				id: application.id,
				registrationNumber: "ADM-2026-003",
			}),
		).rejects.toThrow();
	});
});

describe("admissions document checklist", () => {
	it("reports missing required documents and validates submitted documents", async () => {
		const publicCtx = makeTestContext();
		const { application } = await caller(publicCtx).admissions.submit({
			applicant: { ...baseApplicant, email: "docs-ok@example.com" },
			programId,
			academicYearId,
		});
		const adminCtx = asRealAdmin();

		const requirement = await caller(adminCtx).admissions.upsertRequirement({
			programId,
			code: "identity",
			label: "Identity document",
			isRequired: true,
			allowedMimeTypes: ["application/pdf"],
			maxSizeBytes: 1_000_000,
			isActive: true,
		});

		const before = await caller(adminCtx).admissions.getChecklist({
			applicationId: application.id,
		});
		expect(before.missingRequiredCount).toBe(1);

		const document = await caller(publicCtx).admissions.submitDocument({
			applicationId: application.id,
			requirementId: requirement.id,
			code: "identity",
			label: "Identity document",
			fileName: "identity.pdf",
			fileUrl: "https://example.com/identity.pdf",
			mimeType: "application/pdf",
			sizeBytes: 500_000,
		});
		expect(document.status).toBe("pending");

		const reviewed = await caller(adminCtx).admissions.reviewDocument({
			id: document.id,
			status: "valid",
			reviewNotes: "Readable",
		});
		expect(reviewed.status).toBe("valid");

		const after = await caller(adminCtx).admissions.getChecklist({
			applicationId: application.id,
		});
		expect(after.missingRequiredCount).toBe(0);
		expect(after.items[0]?.valid).toBe(true);
	});

	it("rejects a submitted document with a disallowed MIME type", async () => {
		const publicCtx = makeTestContext();
		const { application } = await caller(publicCtx).admissions.submit({
			applicant: { ...baseApplicant, email: "docs-mime@example.com" },
			programId,
			academicYearId,
		});
		const requirement = await caller(
			asRealAdmin(),
		).admissions.upsertRequirement({
			programId,
			code: "photo",
			label: "Photo",
			isRequired: true,
			allowedMimeTypes: ["image/png"],
			isActive: true,
		});

		await expect(
			caller(publicCtx).admissions.submitDocument({
				applicationId: application.id,
				requirementId: requirement.id,
				code: "photo",
				label: "Photo",
				fileName: "photo.exe",
				fileUrl: "https://example.com/photo.exe",
				mimeType: "application/x-msdownload",
			}),
		).rejects.toThrow();
	});
});

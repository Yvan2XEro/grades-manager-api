import { beforeEach, describe, expect, it, setDefaultTimeout } from "bun:test";
import type { Context } from "@/lib/context";
import {
	createAcademicYear,
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

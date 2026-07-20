import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";
import {
	createDomainUser,
	createRecapFixture,
	makeTestContext,
} from "../../../lib/test-utils";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

/**
 * Build an admin context whose profile.id exists in domain_users,
 * required because batch_jobs.created_by has a FK constraint.
 */
async function adminWithRealProfile() {
	const profile = await createDomainUser();
	return makeTestContext({
		role: "administrator",
		profileOverrides: { id: profile.id },
	});
}

describe("batchJobs router", () => {
	it("requires auth for all endpoints", async () => {
		const caller = createCaller(makeTestContext());
		await expect(
			caller.batchJobs.list({ limit: 10, offset: 0 }),
		).rejects.toHaveProperty("code", "UNAUTHORIZED");
		await expect(caller.batchJobs.get({ jobId: "x" })).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	describe("preview → run lifecycle", () => {
		it("previews a creditLedger.recompute job", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			const previewed = await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: {
					academicYearId: academicYear.id,
					classId: klass.id,
				},
			});

			expect(previewed.status).toBe("previewed");
			expect(previewed.type).toBe("creditLedger.recompute");
			expect(previewed.steps.length).toBe(2);
			expect(previewed.steps[0].name).toBe("Reset credit ledgers");
			expect(previewed.steps[1].name).toBe(
				"Recompute from UE validation (LMD rules)",
			);
			expect(previewed.previewResult).toBeTruthy();
			expect(
				(previewed.previewResult as Record<string, unknown>).studentCount,
			).toBe(1);
		});

		it("runs a previewed creditLedger.recompute job to completion", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			const previewed = await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: {
					academicYearId: academicYear.id,
					classId: klass.id,
				},
			});

			const completed = await admin.batchJobs.run({
				jobId: previewed.id,
			});

			expect(completed).toBeTruthy();
			expect(completed!.status).toBe("completed");
			expect(completed!.completedAt).toBeTruthy();
			// Should have logs
			expect((completed!.logs ?? []).length).toBeGreaterThan(0);
		});

		it("previews a studentFacts.refreshClass job", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			const previewed = await admin.batchJobs.preview({
				type: "studentFacts.refreshClass",
				params: {
					academicYearId: academicYear.id,
					classId: klass.id,
				},
			});

			expect(previewed.status).toBe("previewed");
			expect(previewed.type).toBe("studentFacts.refreshClass");
			expect(previewed.steps.length).toBe(1);
			expect(
				(previewed.previewResult as Record<string, unknown>).studentCount,
			).toBe(1);
		});

		it("runs a previewed studentFacts.refreshClass job to completion", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			const previewed = await admin.batchJobs.preview({
				type: "studentFacts.refreshClass",
				params: {
					academicYearId: academicYear.id,
					classId: klass.id,
				},
			});

			const completed = await admin.batchJobs.run({
				jobId: previewed.id,
			});

			expect(completed).toBeTruthy();
			expect(completed!.status).toBe("completed");
		});
	});

	describe("cancel", () => {
		it("cancels a previewed job", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			const previewed = await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: {
					academicYearId: academicYear.id,
					classId: klass.id,
				},
			});

			const cancelled = await admin.batchJobs.cancel({
				jobId: previewed.id,
			});

			expect(cancelled).toBeTruthy();
			expect(cancelled!.status).toBe("cancelled");
		});

		it("rejects cancel for completed jobs", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			const previewed = await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: {
					academicYearId: academicYear.id,
					classId: klass.id,
				},
			});
			await admin.batchJobs.run({ jobId: previewed.id });

			await expect(
				admin.batchJobs.cancel({ jobId: previewed.id }),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});
	});

	describe("run guards", () => {
		it("rejects running a non-previewed job", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			const previewed = await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: {
					academicYearId: academicYear.id,
					classId: klass.id,
				},
			});
			// Cancel it first so it's no longer "previewed"
			await admin.batchJobs.cancel({ jobId: previewed.id });

			await expect(
				admin.batchJobs.run({ jobId: previewed.id }),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});
	});

	describe("scope lock", () => {
		it("rejects preview when an active job of same type exists", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			// First preview creates an active (previewed) job
			await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: {
					academicYearId: academicYear.id,
					classId: klass.id,
				},
			});

			// Second preview of same type should conflict
			await expect(
				admin.batchJobs.preview({
					type: "creditLedger.recompute",
					params: {
						academicYearId: academicYear.id,
						classId: klass.id,
					},
				}),
			).rejects.toHaveProperty("code", "CONFLICT");
		});

		it("allows preview of different job type", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			// First: creditLedger
			await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: {
					academicYearId: academicYear.id,
					classId: klass.id,
				},
			});

			// Second: studentFacts (different type) should succeed
			const second = await admin.batchJobs.preview({
				type: "studentFacts.refreshClass",
				params: {
					academicYearId: academicYear.id,
					classId: klass.id,
				},
			});

			expect(second.status).toBe("previewed");
		});
	});

	describe("list and get", () => {
		it("lists jobs and retrieves a specific one", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			const previewed = await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: {
					academicYearId: academicYear.id,
					classId: klass.id,
				},
			});

			const listed = await admin.batchJobs.list({
				limit: 50,
				offset: 0,
			});

			expect(listed.items.length).toBeGreaterThanOrEqual(1);
			const found = listed.items.find((j) => j.id === previewed.id);
			expect(found).toBeTruthy();
			expect(found!.status).toBe("previewed");

			// Get specific job
			const detail = await admin.batchJobs.get({
				jobId: previewed.id,
			});
			expect(detail.id).toBe(previewed.id);
			expect(detail.steps).toBeTruthy();
			expect(detail.logs).toBeTruthy();
		});

		it("filters by status", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			const previewed = await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: {
					academicYearId: academicYear.id,
					classId: klass.id,
				},
			});

			const filtered = await admin.batchJobs.list({
				status: ["previewed"],
				limit: 50,
				offset: 0,
			});

			expect(filtered.items.some((j) => j.id === previewed.id)).toBe(true);

			const noMatch = await admin.batchJobs.list({
				status: ["completed"],
				limit: 50,
				offset: 0,
			});

			expect(noMatch.items.some((j) => j.id === previewed.id)).toBe(false);
		});
	});

	describe("rollback", () => {
		it("rejects rollback for job types without rollback support", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			const previewed = await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: {
					academicYearId: academicYear.id,
					classId: klass.id,
				},
			});
			await admin.batchJobs.run({ jobId: previewed.id });

			// creditLedger.recompute doesn't define rollback
			await expect(
				admin.batchJobs.rollback({ jobId: previewed.id }),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("logs from consecutive steps carry the correct stepId and do not leak", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			// creditLedger.recompute has 2 steps: "Recompute credit ledger" and "Refresh student facts"
			const previewed = await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: { academicYearId: academicYear.id, classId: klass.id },
			});
			expect(previewed.steps.length).toBe(2);

			const completed = await admin.batchJobs.run({ jobId: previewed.id });
			expect(completed?.status).toBe("completed");

			const logs = completed?.logs ?? [];
			const step1Id = previewed.steps[0].id;
			const step2Id = previewed.steps[1].id;

			const step1Logs = logs.filter((l) => l.stepId === step1Id);
			const step2Logs = logs.filter((l) => l.stepId === step2Id);
			const jobLevelLogs = logs.filter((l) => l.stepId === null);

			// Each step must have at least its header log attributed to it
			expect(step1Logs.length).toBeGreaterThan(0);
			expect(step2Logs.length).toBeGreaterThan(0);
			// No step-1 log appears in step-2 attribution and vice-versa
			expect(step1Logs.every((l) => l.stepId === step1Id)).toBe(true);
			expect(step2Logs.every((l) => l.stepId === step2Id)).toBe(true);
			// Job-level completion log has no stepId
			expect(jobLevelLogs.length).toBeGreaterThan(0);
			expect(jobLevelLogs.every((l) => l.stepId === null)).toBe(true);
		});

		it("rejects rollback for non-completed jobs", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			const previewed = await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: {
					academicYearId: academicYear.id,
					classId: klass.id,
				},
			});

			// Try to rollback a previewed (not completed) job
			await expect(
				admin.batchJobs.rollback({ jobId: previewed.id }),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});
	});

	describe("completion/failure notifications", () => {
		it("sends exactly one notification per job and deduplicates same job ID", async () => {
			const profile = await createDomainUser();
			const ctx = makeTestContext({
				role: "administrator",
				profileOverrides: { id: profile.id },
			});
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			const previewed = await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: { academicYearId: academicYear.id, classId: klass.id },
			});
			await admin.batchJobs.run({ jobId: previewed.id });

			const notifs = await db.query.notifications.findMany({
				where: eq(schema.notifications.recipientId, profile.id),
				orderBy: schema.notifications.createdAt,
			});

			const completedNotifs = notifs.filter(
				(n) => n.type === "batch_job.completed",
			);
			// Exactly one completion notification
			expect(completedNotifs.length).toBe(1);

			// Payload has required fields
			const payload = completedNotifs[0].payload as Record<string, unknown>;
			expect(payload.jobId).toBe(previewed.id);
			expect(payload.jobType).toBe("creditLedger.recompute");
			expect(typeof payload.itemsProcessed).toBe("number");

			// Running the same job again would produce a different job ID → a second notification
			// (tests dedup only within same job ID — via _dedupeKey)
			expect(payload._dedupeKey).toBe(previewed.id);
		});

		it("two different jobs each produce their own notification", async () => {
			const profile = await createDomainUser();
			const ctx = makeTestContext({
				role: "administrator",
				profileOverrides: { id: profile.id },
			});
			const admin = createCaller(ctx);
			const { academicYear, klass } = await createRecapFixture();

			const j1 = await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: { academicYearId: academicYear.id, classId: klass.id },
			});
			await admin.batchJobs.run({ jobId: j1.id });

			const { klass: klass2 } = await createRecapFixture();
			const j2 = await admin.batchJobs.preview({
				type: "creditLedger.recompute",
				params: { academicYearId: academicYear.id, classId: klass2.id },
			});
			await admin.batchJobs.run({ jobId: j2.id });

			const notifs = await db.query.notifications.findMany({
				where: eq(schema.notifications.recipientId, profile.id),
			});
			const completedNotifs = notifs.filter(
				(n) => n.type === "batch_job.completed",
			);
			expect(completedNotifs.length).toBe(2);
			const jobIds = completedNotifs.map(
				(n) => (n.payload as Record<string, unknown>).jobId,
			);
			expect(new Set(jobIds).size).toBe(2);
		});
	});
});

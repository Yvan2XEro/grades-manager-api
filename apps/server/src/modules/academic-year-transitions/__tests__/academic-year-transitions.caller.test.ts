import { describe, expect, it, setDefaultTimeout } from "bun:test";

setDefaultTimeout(30_000);

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import {
	createAcademicYear,
	createClass,
	createCycleLevel,
	createDomainUser,
	createProgram,
	createStudent,
	createStudyCycle,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

const caller = (ctx: Context) => appRouter.createCaller(ctx);

async function adminContext() {
	const profile = await createDomainUser();
	return makeTestContext({
		role: "administrator",
		profileOverrides: { id: profile.id },
	});
}

async function createSignedDeliberation(
	classId: string,
	academicYearId: string,
	actorId: string,
	decisions: Array<{
		studentId: string;
		decision: schema.DeliberationDecision;
	}>,
) {
	const klass = await db.query.classes.findFirst({
		where: eq(schema.classes.id, classId),
	});
	if (!klass) throw new Error("Class not found");
	const [deliberation] = await db
		.insert(schema.deliberations)
		.values({
			institutionId: klass.institutionId,
			classId,
			academicYearId,
			type: "annual",
			status: "signed",
			createdBy: actorId,
			signedBy: actorId,
			signedAt: new Date(),
		})
		.returning();
	await db.insert(schema.deliberationStudentResults).values(
		decisions.map(({ studentId, decision }) => ({
			deliberationId: deliberation.id,
			studentId,
			autoDecision: decision,
			finalDecision: decision,
		})),
	);
	return deliberation;
}

async function setupTwoLevelTransition() {
	const suffix = Math.random().toString(36).slice(2, 8);
	const admin = await adminContext();
	const institutionId = admin.institution.id;
	const cycle = await createStudyCycle({ institutionId });
	const l1 = await createCycleLevel({
		cycleId: cycle.id,
		orderIndex: 1,
		code: "L1",
	});
	const l2 = await createCycleLevel({
		cycleId: cycle.id,
		orderIndex: 2,
		code: "L2",
	});
	const program = await createProgram({ institutionId, cycleId: cycle.id });
	const sourceYear = await createAcademicYear({
		institutionId,
		name: `2024-2025-${suffix}`,
		startDate: "2024-09-01",
		endDate: "2025-07-31",
	});
	const targetYear = await createAcademicYear({
		institutionId,
		name: `2025-2026-${suffix}`,
		startDate: "2025-09-01",
		endDate: "2026-07-31",
	});
	const sourceClass = await createClass({
		program: program.id,
		academicYear: sourceYear.id,
		cycleLevelId: l1.id,
	});
	const promotionClass = await createClass({
		program: program.id,
		academicYear: targetYear.id,
		cycleLevelId: l2.id,
		programOptionId: sourceClass.programOptionId,
	});
	const repeatClass = await createClass({
		program: program.id,
		academicYear: targetYear.id,
		cycleLevelId: l1.id,
		programOptionId: sourceClass.programOptionId,
	});
	return {
		admin,
		l1,
		l2,
		program,
		sourceYear,
		targetYear,
		sourceClass,
		promotionClass,
		repeatClass,
	};
}

describe("academicYearTransitions", () => {
	it("enforces one active plan per institution and academic-year pair at the database boundary", async () => {
		const fixture = await setupTwoLevelTransition();
		const values = {
			institutionId: fixture.admin.institution.id,
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			generatedBy: fixture.admin.profile!.id,
		} satisfies schema.NewAcademicYearTransition;

		const results = await Promise.allSettled([
			db.insert(schema.academicYearTransitions).values(values).returning(),
			db.insert(schema.academicYearTransitions).values(values).returning(),
		]);

		expect(
			results.filter((result) => result.status === "fulfilled"),
		).toHaveLength(1);
		expect(
			results.filter((result) => result.status === "rejected"),
		).toHaveLength(1);
	});

	it("plans and executes promotion and repeat outcomes for every student", async () => {
		const fixture = await setupTwoLevelTransition();
		const promoted = await createStudent({ class: fixture.sourceClass.id });
		const repeating = await createStudent({ class: fixture.sourceClass.id });
		await createSignedDeliberation(
			fixture.sourceClass.id,
			fixture.sourceYear.id,
			fixture.admin.profile!.id,
			[
				{ studentId: promoted.id, decision: "admitted" },
				{ studentId: repeating.id, decision: "repeat" },
			],
		);

		const draft = await caller(
			fixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});
		expect(draft.status).toBe("ready");
		expect(draft.summary).toMatchObject({
			total: 2,
			promote: 1,
			repeat: 1,
			blocked: 0,
		});

		const planned = await caller(
			fixture.admin,
		).academicYearTransitions.listItems({
			transitionId: draft.id,
			limit: 50,
		});
		expect(planned.items).toHaveLength(2);
		expect(
			planned.items.find((item) => item.student.id === promoted.id)?.targetClass
				?.id,
		).toBe(fixture.promotionClass.id);
		expect(
			planned.items.find((item) => item.student.id === repeating.id)
				?.targetClass?.id,
		).toBe(fixture.repeatClass.id);

		await caller(fixture.admin).academicYearTransitions.submit({
			id: draft.id,
		});
		await caller(fixture.admin).academicYearTransitions.approve({
			id: draft.id,
		});
		const completed = await caller(
			fixture.admin,
		).academicYearTransitions.execute({
			id: draft.id,
		});
		expect(completed.status).toBe("completed");

		const targetEnrollments = await db.query.enrollments.findMany({
			where: eq(schema.enrollments.academicYearId, fixture.targetYear.id),
		});
		expect(targetEnrollments).toHaveLength(2);
		expect(targetEnrollments.map((row) => row.classId).sort()).toEqual(
			[fixture.promotionClass.id, fixture.repeatClass.id].sort(),
		);
		const sourceEnrollments = await db.query.enrollments.findMany({
			where: and(
				eq(schema.enrollments.academicYearId, fixture.sourceYear.id),
				eq(schema.enrollments.classId, fixture.sourceClass.id),
			),
		});
		expect(sourceEnrollments.every((row) => row.status === "completed")).toBe(
			true,
		);
	});

	it("blocks a repeater when the equivalent target-year class is missing", async () => {
		const fixture = await setupTwoLevelTransition();
		await db
			.delete(schema.classes)
			.where(eq(schema.classes.id, fixture.repeatClass.id));
		const student = await createStudent({ class: fixture.sourceClass.id });
		await createSignedDeliberation(
			fixture.sourceClass.id,
			fixture.sourceYear.id,
			fixture.admin.profile!.id,
			[{ studentId: student.id, decision: "repeat" }],
		);

		const draft = await caller(
			fixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});
		expect(draft.status).toBe("draft");
		expect(draft.summary).toMatchObject({ total: 1, blocked: 1, review: 1 });
		const items = await caller(fixture.admin).academicYearTransitions.listItems(
			{
				transitionId: draft.id,
				status: "blocked",
				limit: 50,
			},
		);
		expect(items.items[0]?.blockerCode).toBe("missing_repeat_target");
	});

	it("classifies an admitted student at the final level as graduated", async () => {
		const admin = await adminContext();
		const institutionId = admin.institution.id;
		const cycle = await createStudyCycle({ institutionId });
		const finalLevel = await createCycleLevel({
			cycleId: cycle.id,
			orderIndex: 1,
			code: "FINAL",
		});
		const program = await createProgram({ institutionId, cycleId: cycle.id });
		const sourceYear = await createAcademicYear({
			institutionId,
			name: "2024-2025-final",
			startDate: "2024-09-01",
			endDate: "2025-07-31",
		});
		const targetYear = await createAcademicYear({
			institutionId,
			name: "2025-2026-final",
			startDate: "2025-09-01",
			endDate: "2026-07-31",
		});
		const sourceClass = await createClass({
			program: program.id,
			academicYear: sourceYear.id,
			cycleLevelId: finalLevel.id,
		});
		const student = await createStudent({ class: sourceClass.id });
		await createSignedDeliberation(
			sourceClass.id,
			sourceYear.id,
			admin.profile!.id,
			[{ studentId: student.id, decision: "admitted" }],
		);

		const draft = await caller(admin).academicYearTransitions.createDraft({
			sourceAcademicYearId: sourceYear.id,
			targetAcademicYearId: targetYear.id,
			classIds: [sourceClass.id],
			deferredOutcome: "review",
		});
		expect(draft.summary).toMatchObject({ graduate: 1, blocked: 0 });
	});

	it("reports readiness and rejects invalid year pairs", async () => {
		const fixture = await setupTwoLevelTransition();
		await createStudent({ class: fixture.sourceClass.id });

		const readiness = await caller(
			fixture.admin,
		).academicYearTransitions.readiness({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});
		expect(readiness).toMatchObject({
			enrollmentCount: 1,
			classCount: 1,
			signedDeliberationCount: 0,
			missingDeliberationClassCount: 1,
			canGenerate: true,
		});

		await expect(
			caller(fixture.admin).academicYearTransitions.readiness({
				sourceAcademicYearId: fixture.sourceYear.id,
				targetAcademicYearId: fixture.sourceYear.id,
				classIds: [fixture.sourceClass.id],
				deferredOutcome: "review",
			}),
		).rejects.toThrow("Source and target academic years must be different");
		await expect(
			caller(fixture.admin).academicYearTransitions.readiness({
				sourceAcademicYearId: fixture.targetYear.id,
				targetAcademicYearId: fixture.sourceYear.id,
				classIds: [fixture.sourceClass.id],
				deferredOutcome: "review",
			}),
		).rejects.toThrow(
			"Target academic year must be after the source academic year",
		);
	});

	it("blocks students when signed deliberation or individual decision is missing", async () => {
		const fixture = await setupTwoLevelTransition();
		const withoutDeliberation = await createStudent({
			class: fixture.sourceClass.id,
		});

		const missingDeliberationDraft = await caller(
			fixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});
		let blocked = await caller(fixture.admin).academicYearTransitions.listItems(
			{
				transitionId: missingDeliberationDraft.id,
				status: "blocked",
				limit: 10,
			},
		);
		expect(blocked.items).toHaveLength(1);
		expect(blocked.items[0]?.student.id).toBe(withoutDeliberation.id);
		expect(blocked.items[0]?.blockerCode).toBe("missing_signed_deliberation");

		// Cancel the first draft before creating another for the same year pair
		await caller(fixture.admin).academicYearTransitions.cancel({
			id: missingDeliberationDraft.id,
		});

		const decided = await createStudent({ class: fixture.sourceClass.id });
		const undecided = await createStudent({ class: fixture.sourceClass.id });
		await createSignedDeliberation(
			fixture.sourceClass.id,
			fixture.sourceYear.id,
			fixture.admin.profile!.id,
			[{ studentId: decided.id, decision: "admitted" }],
		);

		const missingDecisionDraft = await caller(
			fixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});
		blocked = await caller(fixture.admin).academicYearTransitions.listItems({
			transitionId: missingDecisionDraft.id,
			status: "blocked",
			limit: 10,
		});
		expect(blocked.items.some((item) => item.student.id === undecided.id)).toBe(
			true,
		);
		expect(
			blocked.items.find((item) => item.student.id === undecided.id)
				?.blockerCode,
		).toBe("missing_student_decision");
	});

	it("blocks a student who already has a target-year enrollment", async () => {
		const fixture = await setupTwoLevelTransition();
		const student = await createStudent({ class: fixture.sourceClass.id });
		await db.insert(schema.enrollments).values({
			institutionId: fixture.admin.institution.id,
			studentId: student.id,
			classId: fixture.promotionClass.id,
			academicYearId: fixture.targetYear.id,
			status: "active",
		});
		await createSignedDeliberation(
			fixture.sourceClass.id,
			fixture.sourceYear.id,
			fixture.admin.profile!.id,
			[{ studentId: student.id, decision: "admitted" }],
		);

		const draft = await caller(
			fixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});
		const items = await caller(fixture.admin).academicYearTransitions.listItems(
			{
				transitionId: draft.id,
				status: "blocked",
				limit: 10,
			},
		);
		expect(items.items[0]?.blockerCode).toBe("existing_target_enrollment");
	});

	it("handles deferred decisions according to the selected policy", async () => {
		const reviewFixture = await setupTwoLevelTransition();
		const reviewStudent = await createStudent({
			class: reviewFixture.sourceClass.id,
		});
		await createSignedDeliberation(
			reviewFixture.sourceClass.id,
			reviewFixture.sourceYear.id,
			reviewFixture.admin.profile!.id,
			[{ studentId: reviewStudent.id, decision: "deferred" }],
		);
		const reviewDraft = await caller(
			reviewFixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: reviewFixture.sourceYear.id,
			targetAcademicYearId: reviewFixture.targetYear.id,
			classIds: [reviewFixture.sourceClass.id],
			deferredOutcome: "review",
		});
		expect(reviewDraft.summary).toMatchObject({ blocked: 1, review: 1 });

		const repeatFixture = await setupTwoLevelTransition();
		const repeatStudent = await createStudent({
			class: repeatFixture.sourceClass.id,
		});
		await createSignedDeliberation(
			repeatFixture.sourceClass.id,
			repeatFixture.sourceYear.id,
			repeatFixture.admin.profile!.id,
			[{ studentId: repeatStudent.id, decision: "deferred" }],
		);
		const repeatDraft = await caller(
			repeatFixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: repeatFixture.sourceYear.id,
			targetAcademicYearId: repeatFixture.targetYear.id,
			classIds: [repeatFixture.sourceClass.id],
			deferredOutcome: "repeat",
		});
		expect(repeatDraft.summary).toMatchObject({ blocked: 0, repeat: 1 });
	});

	it("limits draft generation to the selected class scope", async () => {
		const fixture = await setupTwoLevelTransition();
		const secondSourceClass = await createClass({
			program: fixture.program.id,
			academicYear: fixture.sourceYear.id,
			cycleLevelId: fixture.l1.id,
			programOptionId: fixture.sourceClass.programOptionId,
		});
		const scopedStudent = await createStudent({
			class: fixture.sourceClass.id,
		});
		const outOfScopeStudent = await createStudent({
			class: secondSourceClass.id,
		});
		await createSignedDeliberation(
			fixture.sourceClass.id,
			fixture.sourceYear.id,
			fixture.admin.profile!.id,
			[{ studentId: scopedStudent.id, decision: "admitted" }],
		);
		await createSignedDeliberation(
			secondSourceClass.id,
			fixture.sourceYear.id,
			fixture.admin.profile!.id,
			[{ studentId: outOfScopeStudent.id, decision: "admitted" }],
		);

		const draft = await caller(
			fixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});
		const items = await caller(fixture.admin).academicYearTransitions.listItems(
			{
				transitionId: draft.id,
				limit: 10,
			},
		);
		expect(items.items.map((item) => item.student.id)).toEqual([
			scopedStudent.id,
		]);
	});

	it("requires blocking items to be resolved before submission", async () => {
		const fixture = await setupTwoLevelTransition();
		await db
			.delete(schema.classes)
			.where(eq(schema.classes.id, fixture.repeatClass.id));
		const student = await createStudent({ class: fixture.sourceClass.id });
		await createSignedDeliberation(
			fixture.sourceClass.id,
			fixture.sourceYear.id,
			fixture.admin.profile!.id,
			[{ studentId: student.id, decision: "repeat" }],
		);
		const draft = await caller(
			fixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});
		await expect(
			caller(fixture.admin).academicYearTransitions.submit({ id: draft.id }),
		).rejects.toThrow("Resolve all blocking items before submission");
	});

	it("allows manual resolution of a blocked item and records the override", async () => {
		const fixture = await setupTwoLevelTransition();
		await db
			.delete(schema.classes)
			.where(eq(schema.classes.id, fixture.repeatClass.id));
		const student = await createStudent({ class: fixture.sourceClass.id });
		await createSignedDeliberation(
			fixture.sourceClass.id,
			fixture.sourceYear.id,
			fixture.admin.profile!.id,
			[{ studentId: student.id, decision: "repeat" }],
		);
		const draft = await caller(
			fixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});
		const blocked = await caller(
			fixture.admin,
		).academicYearTransitions.listItems({
			transitionId: draft.id,
			status: "blocked",
			limit: 10,
		});
		const item = blocked.items[0]!;
		const replacementRepeatClass = await createClass({
			program: fixture.program.id,
			academicYear: fixture.targetYear.id,
			cycleLevelId: fixture.l1.id,
			programOptionId: fixture.sourceClass.programOptionId,
		});

		const resolved = await caller(
			fixture.admin,
		).academicYearTransitions.resolveItem({
			transitionId: draft.id,
			itemId: item.id,
			outcome: "repeat",
			targetClassId: replacementRepeatClass.id,
			reason: "Validated manually by academic office",
		});
		expect(resolved.status).toBe("ready");
		expect(resolved.summary).toMatchObject({
			blocked: 0,
			repeat: 1,
			overridden: 1,
		});

		const items = await caller(fixture.admin).academicYearTransitions.listItems(
			{
				transitionId: draft.id,
				limit: 10,
			},
		);
		expect(items.items[0]).toMatchObject({
			status: "ready",
			isOverridden: true,
			blockerCode: null,
		});
		expect(items.items[0]?.targetClass?.id).toBe(replacementRepeatClass.id);
	});

	it("validates manual resolution target class rules", async () => {
		const fixture = await setupTwoLevelTransition();
		await db
			.delete(schema.classes)
			.where(eq(schema.classes.id, fixture.repeatClass.id));
		const wrongYear = await createAcademicYear({
			institutionId: fixture.admin.institution.id,
			name: "2026-2027-wrong-target",
			startDate: "2026-09-01",
			endDate: "2027-07-31",
		});
		const wrongYearClass = await createClass({
			program: fixture.program.id,
			academicYear: wrongYear.id,
			cycleLevelId: fixture.l1.id,
			programOptionId: fixture.sourceClass.programOptionId,
		});
		const student = await createStudent({ class: fixture.sourceClass.id });
		await createSignedDeliberation(
			fixture.sourceClass.id,
			fixture.sourceYear.id,
			fixture.admin.profile!.id,
			[{ studentId: student.id, decision: "repeat" }],
		);
		const draft = await caller(
			fixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});
		const item = (
			await caller(fixture.admin).academicYearTransitions.listItems({
				transitionId: draft.id,
				status: "blocked",
				limit: 10,
			})
		).items[0]!;

		await expect(
			caller(fixture.admin).academicYearTransitions.resolveItem({
				transitionId: draft.id,
				itemId: item.id,
				outcome: "repeat",
				reason: "Missing target intentionally",
			}),
		).rejects.toThrow("A target class is required for this outcome");
		await expect(
			caller(fixture.admin).academicYearTransitions.resolveItem({
				transitionId: draft.id,
				itemId: item.id,
				outcome: "graduate",
				targetClassId: fixture.promotionClass.id,
				reason: "Target not allowed for graduation",
			}),
		).rejects.toThrow("This outcome does not accept a target class");
		await expect(
			caller(fixture.admin).academicYearTransitions.resolveItem({
				transitionId: draft.id,
				itemId: item.id,
				outcome: "repeat",
				targetClassId: wrongYearClass.id,
				reason: "Wrong target year",
			}),
		).rejects.toThrow("Target class does not belong to the target year");
	});

	it("enforces the transition approval workflow and prevents cancellation after execution", async () => {
		const fixture = await setupTwoLevelTransition();
		const student = await createStudent({ class: fixture.sourceClass.id });
		await createSignedDeliberation(
			fixture.sourceClass.id,
			fixture.sourceYear.id,
			fixture.admin.profile!.id,
			[{ studentId: student.id, decision: "admitted" }],
		);
		const draft = await caller(
			fixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});

		await expect(
			caller(fixture.admin).academicYearTransitions.approve({ id: draft.id }),
		).rejects.toThrow("Transition must be pending approval");
		await expect(
			caller(fixture.admin).academicYearTransitions.execute({ id: draft.id }),
		).rejects.toThrow("Transition must be approved before execution");

		const submitted = await caller(
			fixture.admin,
		).academicYearTransitions.submit({
			id: draft.id,
		});
		expect(submitted.status).toBe("pending_approval");
		const approved = await caller(
			fixture.admin,
		).academicYearTransitions.approve({
			id: draft.id,
		});
		expect(approved.status).toBe("approved");
		const completed = await caller(
			fixture.admin,
		).academicYearTransitions.execute({
			id: draft.id,
		});
		expect(completed.status).toBe("completed");
		await expect(
			caller(fixture.admin).academicYearTransitions.execute({ id: draft.id }),
		).rejects.toThrow("Transition must be approved before execution");
		await expect(
			caller(fixture.admin).academicYearTransitions.cancel({ id: draft.id }),
		).rejects.toThrow("An executed transition cannot be cancelled");
	});

	it("closes excluded students without creating a target enrollment", async () => {
		const fixture = await setupTwoLevelTransition();
		const student = await createStudent({ class: fixture.sourceClass.id });
		await createSignedDeliberation(
			fixture.sourceClass.id,
			fixture.sourceYear.id,
			fixture.admin.profile!.id,
			[{ studentId: student.id, decision: "excluded" }],
		);
		const draft = await caller(
			fixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});
		expect(draft.summary).toMatchObject({ exclude: 1, blocked: 0 });
		await caller(fixture.admin).academicYearTransitions.submit({
			id: draft.id,
		});
		await caller(fixture.admin).academicYearTransitions.approve({
			id: draft.id,
		});
		await caller(fixture.admin).academicYearTransitions.execute({
			id: draft.id,
		});

		const sourceEnrollment = await db.query.enrollments.findFirst({
			where: and(
				eq(schema.enrollments.studentId, student.id),
				eq(schema.enrollments.academicYearId, fixture.sourceYear.id),
			),
		});
		expect(sourceEnrollment?.status).toBe("withdrawn");
		const targetEnrollment = await db.query.enrollments.findFirst({
			where: and(
				eq(schema.enrollments.studentId, student.id),
				eq(schema.enrollments.academicYearId, fixture.targetYear.id),
			),
		});
		expect(targetEnrollment).toBeUndefined();
	});

	it("getTransitionAudit returns created event immediately after draft creation", async () => {
		const fixture = await setupTwoLevelTransition();
		const student = await createStudent({ class: fixture.sourceClass.id });
		await createSignedDeliberation(
			fixture.sourceClass.id,
			fixture.sourceYear.id,
			fixture.admin.profile!.id,
			[{ studentId: student.id, decision: "admitted" }],
		);

		const draft = await caller(
			fixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});

		const audit = await caller(
			fixture.admin,
		).academicYearTransitions.getTransitionAudit({ id: draft.id });

		expect(audit.events).toHaveLength(1);
		expect(audit.events[0]).toMatchObject({
			action: "created",
			actorName: expect.any(String),
		});
	});

	it("getTransitionAudit includes override events with student name and reason", async () => {
		const fixture = await setupTwoLevelTransition();

		// Student with no deliberation → will be blocked
		await db
			.delete(schema.classes)
			.where(eq(schema.classes.id, fixture.repeatClass.id));
		const student = await createStudent({ class: fixture.sourceClass.id });
		// No deliberation → student is blocked

		const draft = await caller(
			fixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});

		const items = await caller(fixture.admin).academicYearTransitions.listItems(
			{
				transitionId: draft.id,
				limit: 10,
			},
		);
		const blockedItem = items.items.find((i) => i.studentId === student.id);
		expect(blockedItem).toBeDefined();

		const newRepeatClass = await createClass({
			program: fixture.program.id,
			academicYear: fixture.targetYear.id,
			cycleLevelId: fixture.l1.id,
			programOptionId: fixture.sourceClass.programOptionId,
		});

		await caller(fixture.admin).academicYearTransitions.resolveItem({
			transitionId: draft.id,
			itemId: blockedItem!.id,
			outcome: "repeat",
			targetClassId: newRepeatClass.id,
			reason: "Approved by academic committee",
		});

		const audit = await caller(
			fixture.admin,
		).academicYearTransitions.getTransitionAudit({ id: draft.id });

		const overrideEvent = audit.events.find((e) => e.action === "override");
		expect(overrideEvent).toBeDefined();
		expect(overrideEvent?.studentName).toBeTruthy();
		expect(overrideEvent?.overrideReason).toBe(
			"Approved by academic committee",
		);
		expect(overrideEvent?.actorName).toBeTruthy();
		expect(overrideEvent?.finalOutcome).toBe("repeat");
	});

	it("getTransitionAudit records submitted and approved events in order", async () => {
		const fixture = await setupTwoLevelTransition();
		const student = await createStudent({ class: fixture.sourceClass.id });
		await createSignedDeliberation(
			fixture.sourceClass.id,
			fixture.sourceYear.id,
			fixture.admin.profile!.id,
			[{ studentId: student.id, decision: "admitted" }],
		);

		const draft = await caller(
			fixture.admin,
		).academicYearTransitions.createDraft({
			sourceAcademicYearId: fixture.sourceYear.id,
			targetAcademicYearId: fixture.targetYear.id,
			classIds: [fixture.sourceClass.id],
			deferredOutcome: "review",
		});

		await caller(fixture.admin).academicYearTransitions.submit({
			id: draft.id,
		});
		await caller(fixture.admin).academicYearTransitions.approve({
			id: draft.id,
		});

		const audit = await caller(
			fixture.admin,
		).academicYearTransitions.getTransitionAudit({ id: draft.id });

		const actions = audit.events.map((e) => e.action);
		expect(actions).toContain("created");
		expect(actions).toContain("submitted");
		expect(actions).toContain("approved");
		// Chronological order
		expect(actions.indexOf("created")).toBeLessThan(
			actions.indexOf("submitted"),
		);
		expect(actions.indexOf("submitted")).toBeLessThan(
			actions.indexOf("approved"),
		);
	});
});

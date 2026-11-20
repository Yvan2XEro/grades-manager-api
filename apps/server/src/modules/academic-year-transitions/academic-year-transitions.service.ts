import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gt,
	ilike,
	inArray,
	notInArray,
	or,
	sql,
} from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as courseEnrollments from "../student-course-enrollments/student-course-enrollments.service";
import type {
	CreateTransitionInput,
	ListTransitionItemsInput,
	ListTransitionsInput,
	ResolveTransitionItemInput,
	ResolveTransitionItemsInput,
} from "./academic-year-transitions.zod";

type PlannedItem = schema.NewAcademicYearTransitionItem;

type TransitionSummary = {
	total: number;
	ready: number;
	blocked: number;
	promote: number;
	repeat: number;
	graduate: number;
	exclude: number;
	transfer: number;
	suspend: number;
	review: number;
	overridden: number;
	succeeded: number;
	failed: number;
};

const emptySummary = (): TransitionSummary => ({
	total: 0,
	ready: 0,
	blocked: 0,
	promote: 0,
	repeat: 0,
	graduate: 0,
	exclude: 0,
	transfer: 0,
	suspend: 0,
	review: 0,
	overridden: 0,
	succeeded: 0,
	failed: 0,
});

function summarize(
	items: Array<{
		finalOutcome: schema.AcademicYearTransitionOutcome;
		status: schema.AcademicYearTransitionItemStatus;
		isOverridden?: boolean;
	}>,
): TransitionSummary {
	const summary = emptySummary();
	for (const item of items) {
		summary.total += 1;
		summary[item.finalOutcome] += 1;
		if (item.status === "ready") summary.ready += 1;
		if (item.status === "blocked") summary.blocked += 1;
		if (item.status === "succeeded") summary.succeeded += 1;
		if (item.status === "failed") summary.failed += 1;
		if (item.isOverridden) summary.overridden += 1;
	}
	return summary;
}

function notFound(message: string): never {
	throw new TRPCError({ code: "NOT_FOUND", message });
}

function invalid(message: string): never {
	throw new TRPCError({ code: "BAD_REQUEST", message });
}

async function findTransition(id: string, institutionId: string) {
	return db.query.academicYearTransitions.findFirst({
		where: and(
			eq(schema.academicYearTransitions.id, id),
			eq(schema.academicYearTransitions.institutionId, institutionId),
		),
	});
}

async function refreshSummary(transitionId: string) {
	const items = await db
		.select({
			finalOutcome: schema.academicYearTransitionItems.finalOutcome,
			status: schema.academicYearTransitionItems.status,
			isOverridden: schema.academicYearTransitionItems.isOverridden,
		})
		.from(schema.academicYearTransitionItems)
		.where(eq(schema.academicYearTransitionItems.transitionId, transitionId));
	const summary = summarize(items);
	await db
		.update(schema.academicYearTransitions)
		.set({
			summary,
			status: summary.blocked === 0 ? "ready" : "draft",
			updatedAt: new Date(),
		})
		.where(eq(schema.academicYearTransitions.id, transitionId));
	return summary;
}

export async function readiness(
	input: CreateTransitionInput,
	institutionId: string,
) {
	if (input.sourceAcademicYearId === input.targetAcademicYearId) {
		invalid("Source and target academic years must be different");
	}
	const years = await db.query.academicYears.findMany({
		where: and(
			eq(schema.academicYears.institutionId, institutionId),
			inArray(schema.academicYears.id, [
				input.sourceAcademicYearId,
				input.targetAcademicYearId,
			]),
		),
	});
	if (years.length !== 2) invalid("Academic year not found");
	const source = years.find((year) => year.id === input.sourceAcademicYearId);
	const target = years.find((year) => year.id === input.targetAcademicYearId);
	if (!source || !target) invalid("Academic year not found");
	if (target.startDate <= source.startDate) {
		invalid("Target academic year must be after the source academic year");
	}

	const scopeCondition =
		input.classIds.length > 0
			? inArray(schema.enrollments.classId, input.classIds)
			: undefined;
	// Every enrollment of the source year, whatever its status: a class whose
	// jury was already applied (students promoted or graduated) still counts.
	const sourceEnrollments = await db
		.select({
			id: schema.enrollments.id,
			classId: schema.enrollments.classId,
			status: schema.enrollments.status,
		})
		.from(schema.enrollments)
		.where(
			and(
				eq(schema.enrollments.institutionId, institutionId),
				eq(schema.enrollments.academicYearId, input.sourceAcademicYearId),
				scopeCondition,
			),
		);
	const activeEnrollmentCount = sourceEnrollments.filter(
		(row) => row.status === "active",
	).length;
	const classIds = [...new Set(sourceEnrollments.map((row) => row.classId))];
	const signedDeliberations =
		classIds.length === 0
			? []
			: await db.query.deliberations.findMany({
					where: and(
						eq(schema.deliberations.institutionId, institutionId),
						eq(schema.deliberations.academicYearId, input.sourceAcademicYearId),
						eq(schema.deliberations.type, "annual"),
						eq(schema.deliberations.status, "signed"),
						inArray(schema.deliberations.classId, classIds),
					),
				});
	const signedClasses = new Set(signedDeliberations.map((row) => row.classId));

	// Fetch classCourse IDs for the classes in scope (needed for exam check)
	const classCourseRows =
		classIds.length === 0
			? []
			: await db
					.select({ id: schema.classCourses.id })
					.from(schema.classCourses)
					.where(inArray(schema.classCourses.class, classIds));
	const classCourseIds = classCourseRows.map((r) => r.id);

	// Count approved-but-not-locked exams for these classCourses
	const [examRow] =
		classCourseIds.length === 0
			? [{ total: 0 }]
			: await db
					.select({ total: count() })
					.from(schema.exams)
					.where(
						and(
							eq(schema.exams.institutionId, institutionId),
							inArray(schema.exams.classCourse, classCourseIds),
							eq(schema.exams.status, "approved"),
							eq(schema.exams.isLocked, false),
						),
					);
	const unlockedApprovedExamCount = Number(examRow?.total ?? 0);

	// Count student course enrollments still in-progress for source year + classes
	const [sceRow] =
		classIds.length === 0
			? [{ total: 0 }]
			: await db
					.select({ total: count() })
					.from(schema.studentCourseEnrollments)
					.where(
						and(
							eq(
								schema.studentCourseEnrollments.academicYearId,
								input.sourceAcademicYearId,
							),
							inArray(schema.studentCourseEnrollments.sourceClassId, classIds),
							inArray(schema.studentCourseEnrollments.status, [
								"planned",
								"active",
							]),
						),
					);
	const incompleteStudentCourseCount = Number(sceRow?.total ?? 0);

	const overlappingPlans = await findOverlappingPlans(
		institutionId,
		input.sourceAcademicYearId,
		input.targetAcademicYearId,
		classIds,
	);

	return {
		sourceYear: source,
		targetYear: target,
		enrollmentCount: sourceEnrollments.length,
		/** Students still to move (active enrollment in the source year). */
		activeEnrollmentCount,
		classCount: classIds.length,
		signedDeliberationCount: signedClasses.size,
		missingDeliberationClassCount: classIds.filter(
			(classId) => !signedClasses.has(classId),
		).length,
		unlockedApprovedExamCount,
		incompleteStudentCourseCount,
		/** Plans in progress for the same years sharing classes with this scope. */
		overlappingPlans,
		canGenerate: activeEnrollmentCount > 0 && overlappingPlans.length === 0,
	};
}

/**
 * Plans in progress for the same year pair that already cover some of
 * `classIds`, with the shared classes. Several plans may run for one year
 * pair as long as their classes don't overlap.
 */
async function findOverlappingPlans(
	institutionId: string,
	sourceAcademicYearId: string,
	targetAcademicYearId: string,
	classIds: string[],
	executor: Pick<typeof db, "query" | "selectDistinct"> = db,
) {
	if (classIds.length === 0) return [];
	const activePlans = await executor.query.academicYearTransitions.findMany({
		where: and(
			eq(schema.academicYearTransitions.institutionId, institutionId),
			eq(
				schema.academicYearTransitions.sourceAcademicYearId,
				sourceAcademicYearId,
			),
			eq(
				schema.academicYearTransitions.targetAcademicYearId,
				targetAcademicYearId,
			),
			notInArray(schema.academicYearTransitions.status, TERMINAL_STATUSES),
		),
		columns: { id: true, status: true, generatedAt: true },
	});
	if (activePlans.length === 0) return [];
	const planClasses = await executor
		.selectDistinct({
			transitionId: schema.academicYearTransitionItems.transitionId,
			classId: schema.classes.id,
			classCode: schema.classes.code,
			className: schema.classes.name,
		})
		.from(schema.academicYearTransitionItems)
		.innerJoin(
			schema.enrollments,
			eq(
				schema.enrollments.id,
				schema.academicYearTransitionItems.sourceEnrollmentId,
			),
		)
		.innerJoin(
			schema.classes,
			eq(schema.classes.id, schema.enrollments.classId),
		)
		.where(
			and(
				inArray(
					schema.academicYearTransitionItems.transitionId,
					activePlans.map((p) => p.id),
				),
				inArray(schema.classes.id, classIds),
			),
		);
	return activePlans
		.map((plan) => ({
			id: plan.id,
			status: plan.status,
			generatedAt: plan.generatedAt,
			classes: planClasses
				.filter((row) => row.transitionId === plan.id)
				.map((row) => ({
					id: row.classId,
					code: row.classCode,
					name: row.className,
				})),
		}))
		.filter((plan) => plan.classes.length > 0);
}

/**
 * Error message prefix when a new plan shares classes with a plan in
 * progress: `TRANSITION_PLAN_OVERLAP:<planId>:<class codes>`.
 */
export const TRANSITION_PLAN_OVERLAP = "TRANSITION_PLAN_OVERLAP";

const TERMINAL_STATUSES: schema.AcademicYearTransitionStatus[] = [
	"completed",
	"completed_with_errors",
	"stale",
	"cancelled",
];

export async function createDraft(
	input: CreateTransitionInput,
	institutionId: string,
	actorId: string,
) {
	await readiness(input, institutionId);

	const scopeCondition =
		input.classIds.length > 0
			? inArray(schema.enrollments.classId, input.classIds)
			: undefined;
	const population = await db
		.select({
			enrollmentId: schema.enrollments.id,
			studentId: schema.students.id,
			classId: schema.classes.id,
			programId: schema.classes.program,
			programOptionId: schema.classes.programOptionId,
			cycleLevelId: schema.classes.cycleLevelId,
			cycleId: schema.cycleLevels.cycleId,
			levelOrder: schema.cycleLevels.orderIndex,
		})
		.from(schema.enrollments)
		.innerJoin(
			schema.students,
			eq(schema.students.id, schema.enrollments.studentId),
		)
		.innerJoin(
			schema.classes,
			eq(schema.classes.id, schema.enrollments.classId),
		)
		.innerJoin(
			schema.cycleLevels,
			eq(schema.cycleLevels.id, schema.classes.cycleLevelId),
		)
		.where(
			and(
				eq(schema.enrollments.institutionId, institutionId),
				eq(schema.enrollments.academicYearId, input.sourceAcademicYearId),
				eq(schema.enrollments.status, "active"),
				scopeCondition,
			),
		);
	if (population.length === 0) invalid("No active source enrollments found");

	const classIds = [...new Set(population.map((row) => row.classId))];
	const studentIds = population.map((row) => row.studentId);
	const cycleIds = [...new Set(population.map((row) => row.cycleId))];

	const [yearEndJuries, targetClasses, levels, existingTargets] =
		await Promise.all([
			db.query.deliberations.findMany({
				where: and(
					eq(schema.deliberations.institutionId, institutionId),
					eq(schema.deliberations.academicYearId, input.sourceAcademicYearId),
					inArray(schema.deliberations.type, ["annual", "retake"]),
					inArray(schema.deliberations.classId, classIds),
				),
			}),
			db.query.classes.findMany({
				where: and(
					eq(schema.classes.institutionId, institutionId),
					eq(schema.classes.academicYear, input.targetAcademicYearId),
				),
			}),
			db.query.cycleLevels.findMany({
				where: inArray(schema.cycleLevels.cycleId, cycleIds),
			}),
			db
				.select({ studentId: schema.enrollments.studentId })
				.from(schema.enrollments)
				.where(
					and(
						eq(schema.enrollments.institutionId, institutionId),
						eq(schema.enrollments.academicYearId, input.targetAcademicYearId),
						inArray(schema.enrollments.studentId, studentIds),
					),
				),
		]);

	const deliberations = yearEndJuries.filter(
		(row) => row.type === "annual" && row.status === "signed",
	);
	const deliberationByClass = new Map(
		deliberations.map((deliberation) => [deliberation.classId, deliberation]),
	);
	// The retake jury of a class decides for the students the annual jury
	// sent to the retake session.
	const retakeByClass = new Map(
		yearEndJuries
			.filter((row) => row.type === "retake")
			.map((row) => [row.classId, row]),
	);
	const deliberationIds = [
		...deliberations.map((row) => row.id),
		...[...retakeByClass.values()]
			.filter((row) => row.status === "signed")
			.map((row) => row.id),
	];
	const results =
		deliberationIds.length === 0
			? []
			: await db.query.deliberationStudentResults.findMany({
					where: inArray(
						schema.deliberationStudentResults.deliberationId,
						deliberationIds,
					),
				});
	const resultByKey = new Map(
		results.map((result) => [
			`${result.deliberationId}:${result.studentId}`,
			result,
		]),
	);
	const levelByCycleOrder = new Map(
		levels.map((level) => [`${level.cycleId}:${level.orderIndex}`, level]),
	);
	const existingTargetStudents = new Set(
		existingTargets.map((row) => row.studentId),
	);

	function resolveTarget(row: (typeof population)[number], levelId: string) {
		return targetClasses.filter(
			(target) =>
				target.program === row.programId &&
				target.programOptionId === row.programOptionId &&
				target.cycleLevelId === levelId,
		);
	}

	const transition = await db.transaction(async (tx) => {
		// One plan per class: another plan in progress for these years must
		// not cover the same classes. The lock serialises concurrent creations
		// for the year pair so two plans can't both claim a class.
		await tx.execute(
			sql`select pg_advisory_xact_lock(hashtext(${`${institutionId}:${input.sourceAcademicYearId}:${input.targetAcademicYearId}`}))`,
		);
		const [overlap] = await findOverlappingPlans(
			institutionId,
			input.sourceAcademicYearId,
			input.targetAcademicYearId,
			classIds,
			tx,
		);
		if (overlap) {
			throw new TRPCError({
				code: "CONFLICT",
				message: `${TRANSITION_PLAN_OVERLAP}:${overlap.id}:${overlap.classes
					.map((c) => c.code)
					.join(", ")}`,
			});
		}
		const [created] = await tx
			.insert(schema.academicYearTransitions)
			.values({
				institutionId,
				sourceAcademicYearId: input.sourceAcademicYearId,
				targetAcademicYearId: input.targetAcademicYearId,
				scopeClassIds: input.classIds,
				deferredOutcome: input.deferredOutcome,
				generatedBy: actorId,
			})
			.returning();

		const items: PlannedItem[] = population.map((row) => {
			const deliberation = deliberationByClass.get(row.classId);
			let result = deliberation
				? resultByKey.get(`${deliberation.id}:${row.studentId}`)
				: undefined;
			const retake = retakeByClass.get(row.classId);
			const retakeResult = retake
				? resultByKey.get(`${retake.id}:${row.studentId}`)
				: undefined;
			const sentToRetake =
				!!retake &&
				(result?.finalDecision === "deferred" ||
					result?.finalDecision === "pending");
			if (sentToRetake && retakeResult) result = retakeResult;
			let outcome: schema.AcademicYearTransitionOutcome = "review";
			let targetClassId: string | null = null;
			let blockerCode: string | null = null;
			let blockerDetails: Record<string, unknown> = {};

			if (!deliberation) {
				blockerCode = "missing_signed_deliberation";
			} else if (sentToRetake && !retakeResult) {
				// The retake jury is not signed yet (or did not deliberate them)
				blockerCode = "retake_jury_pending";
				blockerDetails = { retakeDeliberationId: retake.id };
			} else if (!result?.finalDecision) {
				blockerCode = "missing_student_decision";
			} else if (existingTargetStudents.has(row.studentId)) {
				blockerCode = "existing_target_enrollment";
				blockerDetails = { targetAcademicYearId: input.targetAcademicYearId };
			} else if (
				result.finalDecision === "admitted" ||
				result.finalDecision === "compensated"
			) {
				const nextLevel = levelByCycleOrder.get(
					`${row.cycleId}:${row.levelOrder + 1}`,
				);
				if (!nextLevel) {
					outcome = "graduate";
				} else {
					outcome = "promote";
					const candidates = resolveTarget(row, nextLevel.id);
					if (candidates.length === 1) targetClassId = candidates[0].id;
					else {
						outcome = "review";
						blockerCode =
							candidates.length === 0
								? "missing_promotion_target"
								: "ambiguous_promotion_target";
						blockerDetails = {
							candidateIds: candidates.map((item) => item.id),
						};
					}
				}
			} else if (
				result.finalDecision === "repeat" ||
				(result.finalDecision === "deferred" &&
					input.deferredOutcome === "repeat")
			) {
				outcome = "repeat";
				const candidates = resolveTarget(row, row.cycleLevelId);
				if (candidates.length === 1) targetClassId = candidates[0].id;
				else {
					outcome = "review";
					blockerCode =
						candidates.length === 0
							? "missing_repeat_target"
							: "ambiguous_repeat_target";
					blockerDetails = {
						candidateIds: candidates.map((item) => item.id),
					};
				}
			} else if (result.finalDecision === "excluded") {
				outcome = "exclude";
			} else {
				blockerCode =
					result.finalDecision === "deferred"
						? "deferred_requires_review"
						: "pending_decision";
			}

			return {
				institutionId,
				transitionId: created.id,
				studentId: row.studentId,
				sourceEnrollmentId: row.enrollmentId,
				deliberationId: deliberation?.id ?? null,
				deliberationStudentResultId: result?.id ?? null,
				decision: result?.finalDecision ?? null,
				proposedOutcome: outcome,
				finalOutcome: outcome,
				proposedTargetClassId: targetClassId,
				finalTargetClassId: targetClassId,
				status: blockerCode ? "blocked" : "ready",
				blockerCode,
				blockerDetails,
			};
		});
		await tx.insert(schema.academicYearTransitionItems).values(items);
		const summary = summarize(items);
		const [updated] = await tx
			.update(schema.academicYearTransitions)
			.set({
				summary,
				status: summary.blocked === 0 ? "ready" : "draft",
				updatedAt: new Date(),
			})
			.where(eq(schema.academicYearTransitions.id, created.id))
			.returning();
		return updated;
	});

	return getById(transition.id, institutionId);
}

export async function list(input: ListTransitionsInput, institutionId: string) {
	const rows = await db.query.academicYearTransitions.findMany({
		where: and(
			eq(schema.academicYearTransitions.institutionId, institutionId),
			input.status
				? eq(schema.academicYearTransitions.status, input.status)
				: undefined,
			input.cursor
				? gt(schema.academicYearTransitions.id, input.cursor)
				: undefined,
		),
		orderBy: desc(schema.academicYearTransitions.createdAt),
		limit: input.limit + 1,
	});
	const items = rows.slice(0, input.limit);
	const yearIds = [
		...new Set(
			items.flatMap((row) => [
				row.sourceAcademicYearId,
				row.targetAcademicYearId,
			]),
		),
	];
	const years =
		yearIds.length === 0
			? []
			: await db.query.academicYears.findMany({
					where: inArray(schema.academicYears.id, yearIds),
				});
	const yearById = new Map(years.map((year) => [year.id, year]));
	return {
		items: items.map((row) => ({
			...row,
			sourceYear: yearById.get(row.sourceAcademicYearId) ?? null,
			targetYear: yearById.get(row.targetAcademicYearId) ?? null,
		})),
		nextCursor: rows.length > input.limit ? items.at(-1)?.id : undefined,
	};
}

export async function getById(id: string, institutionId: string) {
	const transition = await findTransition(id, institutionId);
	if (!transition) notFound("Academic year transition not found");
	const years = await db.query.academicYears.findMany({
		where: inArray(schema.academicYears.id, [
			transition.sourceAcademicYearId,
			transition.targetAcademicYearId,
		]),
	});
	return {
		...transition,
		sourceYear:
			years.find((year) => year.id === transition.sourceAcademicYearId) ?? null,
		targetYear:
			years.find((year) => year.id === transition.targetAcademicYearId) ?? null,
	};
}

export async function listItems(
	input: ListTransitionItemsInput,
	institutionId: string,
) {
	const transition = await findTransition(input.transitionId, institutionId);
	if (!transition) notFound("Academic year transition not found");
	const search = input.query ? `%${input.query}%` : undefined;
	const rows = await db
		.select({
			item: schema.academicYearTransitionItems,
			registrationNumber: schema.students.registrationNumber,
			firstName: schema.domainUsers.firstName,
			lastName: schema.domainUsers.lastName,
			sourceClassId: schema.classes.id,
			sourceClassName: schema.classes.name,
			sourceClassCode: schema.classes.code,
		})
		.from(schema.academicYearTransitionItems)
		.innerJoin(
			schema.students,
			eq(schema.students.id, schema.academicYearTransitionItems.studentId),
		)
		.innerJoin(
			schema.domainUsers,
			eq(schema.domainUsers.id, schema.students.domainUserId),
		)
		.innerJoin(
			schema.enrollments,
			eq(
				schema.enrollments.id,
				schema.academicYearTransitionItems.sourceEnrollmentId,
			),
		)
		.innerJoin(
			schema.classes,
			eq(schema.classes.id, schema.enrollments.classId),
		)
		.where(
			and(
				eq(schema.academicYearTransitionItems.transitionId, input.transitionId),
				eq(schema.academicYearTransitionItems.institutionId, institutionId),
				input.outcome
					? eq(schema.academicYearTransitionItems.finalOutcome, input.outcome)
					: undefined,
				input.status
					? eq(schema.academicYearTransitionItems.status, input.status)
					: undefined,
				input.cursor
					? gt(schema.academicYearTransitionItems.id, input.cursor)
					: undefined,
				search
					? or(
							ilike(schema.students.registrationNumber, search),
							ilike(schema.domainUsers.firstName, search),
							ilike(schema.domainUsers.lastName, search),
						)
					: undefined,
			),
		)
		.orderBy(asc(schema.academicYearTransitionItems.id))
		.limit(input.limit + 1);
	const page = rows.slice(0, input.limit);
	const targetIds = [
		...new Set(
			page
				.map((row) => row.item.finalTargetClassId)
				.filter((id): id is string => Boolean(id)),
		),
	];
	const targetClasses =
		targetIds.length === 0
			? []
			: await db.query.classes.findMany({
					where: inArray(schema.classes.id, targetIds),
				});
	const targetById = new Map(targetClasses.map((klass) => [klass.id, klass]));
	return {
		items: page.map((row) => ({
			...row.item,
			student: {
				id: row.item.studentId,
				registrationNumber: row.registrationNumber,
				firstName: row.firstName,
				lastName: row.lastName,
			},
			sourceClass: {
				id: row.sourceClassId,
				name: row.sourceClassName,
				code: row.sourceClassCode,
			},
			targetClass: row.item.finalTargetClassId
				? (targetById.get(row.item.finalTargetClassId) ?? null)
				: null,
		})),
		nextCursor: rows.length > input.limit ? page.at(-1)?.item.id : undefined,
	};
}

export async function resolveItem(
	input: ResolveTransitionItemInput,
	institutionId: string,
	actorId: string,
) {
	const { itemId, ...rest } = input;
	return resolveItems({ ...rest, itemIds: [itemId] }, institutionId, actorId);
}

/**
 * Gives several items of a draft plan the same outcome (and destination
 * class), with one reason: how the jury's pending or incomplete students are
 * decided in bulk.
 */
export async function resolveItems(
	input: ResolveTransitionItemsInput,
	institutionId: string,
	actorId: string,
) {
	const transition = await findTransition(input.transitionId, institutionId);
	if (!transition) notFound("Academic year transition not found");
	if (!["draft", "ready"].includes(transition.status)) {
		invalid("Only a draft transition can be changed");
	}
	const itemIds = [...new Set(input.itemIds)];
	const items = await db.query.academicYearTransitionItems.findMany({
		where: and(
			inArray(schema.academicYearTransitionItems.id, itemIds),
			eq(schema.academicYearTransitionItems.transitionId, input.transitionId),
			eq(schema.academicYearTransitionItems.institutionId, institutionId),
		),
		columns: { id: true },
	});
	if (items.length !== itemIds.length) notFound("Transition item not found");

	const requiresTarget =
		input.outcome === "promote" || input.outcome === "repeat";
	if (requiresTarget && !input.targetClassId) {
		invalid("A target class is required for this outcome");
	}
	// A graduate may go on to the first level of another cycle (Licence →
	// Master 1): the target class is optional for that outcome only.
	const acceptsTarget = requiresTarget || input.outcome === "graduate";
	if (!acceptsTarget && input.targetClassId) {
		invalid("This outcome does not accept a target class");
	}
	if (input.targetClassId) {
		const target = await db.query.classes.findFirst({
			where: and(
				eq(schema.classes.id, input.targetClassId),
				eq(schema.classes.institutionId, institutionId),
				eq(schema.classes.academicYear, transition.targetAcademicYearId),
			),
		});
		if (!target) invalid("Target class does not belong to the target year");
	}

	await db
		.update(schema.academicYearTransitionItems)
		.set({
			finalOutcome: input.outcome,
			finalTargetClassId: input.targetClassId ?? null,
			status: "ready",
			blockerCode: null,
			blockerDetails: {},
			isOverridden: true,
			overrideReason: input.reason,
			overriddenBy: actorId,
			overriddenAt: new Date(),
			updatedAt: new Date(),
		})
		.where(inArray(schema.academicYearTransitionItems.id, itemIds));
	await refreshSummary(input.transitionId);
	return getById(input.transitionId, institutionId);
}

export async function submit(
	id: string,
	institutionId: string,
	actorId: string,
) {
	const transition = await findTransition(id, institutionId);
	if (!transition) notFound("Academic year transition not found");
	const summary = await refreshSummary(id);
	if (summary.blocked > 0)
		invalid("Resolve all blocking items before submission");
	const [updated] = await db
		.update(schema.academicYearTransitions)
		.set({
			status: "pending_approval",
			submittedBy: actorId,
			submittedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(schema.academicYearTransitions.id, id))
		.returning();
	return updated;
}

export async function approve(
	id: string,
	institutionId: string,
	actorId: string,
) {
	const transition = await findTransition(id, institutionId);
	if (!transition) notFound("Academic year transition not found");
	if (transition.status !== "pending_approval") {
		invalid("Transition must be pending approval");
	}
	const [updated] = await db
		.update(schema.academicYearTransitions)
		.set({
			status: "approved",
			approvedBy: actorId,
			approvedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(schema.academicYearTransitions.id, id))
		.returning();
	return updated;
}

export async function execute(
	id: string,
	institutionId: string,
	actorId: string,
) {
	const transition = await findTransition(id, institutionId);
	if (!transition) notFound("Academic year transition not found");
	if (transition.status !== "approved") {
		invalid("Transition must be approved before execution");
	}
	const items = await db.query.academicYearTransitionItems.findMany({
		where: and(
			eq(schema.academicYearTransitionItems.transitionId, id),
			eq(schema.academicYearTransitionItems.institutionId, institutionId),
		),
	});
	if (items.some((item) => item.status !== "ready")) {
		invalid("All transition items must be ready before execution");
	}

	await db.transaction(async (tx) => {
		await tx
			.update(schema.academicYearTransitions)
			.set({ status: "running", startedAt: new Date(), executedBy: actorId })
			.where(eq(schema.academicYearTransitions.id, id));

		for (const item of items) {
			let targetEnrollmentId: string | null = null;
			const enrollsInTarget =
				item.finalOutcome === "promote" ||
				item.finalOutcome === "repeat" ||
				(item.finalOutcome === "graduate" && item.finalTargetClassId);
			if (enrollsInTarget) {
				if (!item.finalTargetClassId) {
					throw new Error(
						`Missing target class for transition item ${item.id}`,
					);
				}
				const duplicate = await tx.query.enrollments.findFirst({
					where: and(
						eq(schema.enrollments.studentId, item.studentId),
						eq(
							schema.enrollments.academicYearId,
							transition.targetAcademicYearId,
						),
					),
				});
				if (duplicate) {
					// The student was placed in the target year since the plan was
					// drafted (promotion from the jury page, or by hand): keep that
					// placement instead of failing the whole plan.
					if (item.finalOutcome === "graduate") {
						await tx
							.update(schema.enrollments)
							.set({ status: "graduated", exitedAt: new Date() })
							.where(
								and(
									eq(schema.enrollments.id, item.sourceEnrollmentId),
									eq(schema.enrollments.status, "active"),
								),
							);
					}
					await tx
						.update(schema.academicYearTransitionItems)
						.set({
							status: "succeeded",
							targetEnrollmentId: duplicate.id,
							finalTargetClassId: duplicate.classId,
							processedAt: new Date(),
							updatedAt: new Date(),
						})
						.where(eq(schema.academicYearTransitionItems.id, item.id));
					continue;
				}
				await tx
					.update(schema.enrollments)
					.set({
						// A graduate going on to the next cycle keeps the record of
						// having completed the previous one.
						status:
							item.finalOutcome === "graduate" ? "graduated" : "completed",
						exitedAt: new Date(),
					})
					.where(eq(schema.enrollments.id, item.sourceEnrollmentId));
				const [createdEnrollment] = await tx
					.insert(schema.enrollments)
					.values({
						institutionId,
						studentId: item.studentId,
						classId: item.finalTargetClassId,
						academicYearId: transition.targetAcademicYearId,
						status: "active",
					})
					.returning({ id: schema.enrollments.id });
				targetEnrollmentId = createdEnrollment.id;
				await tx
					.update(schema.students)
					.set({ class: item.finalTargetClassId })
					.where(eq(schema.students.id, item.studentId));
			} else if (item.finalOutcome === "graduate") {
				await tx
					.update(schema.enrollments)
					.set({ status: "graduated", exitedAt: new Date() })
					.where(eq(schema.enrollments.id, item.sourceEnrollmentId));
			} else {
				await tx
					.update(schema.enrollments)
					.set({ status: "withdrawn", exitedAt: new Date() })
					.where(eq(schema.enrollments.id, item.sourceEnrollmentId));
			}
			await tx
				.update(schema.academicYearTransitionItems)
				.set({
					status: "succeeded",
					targetEnrollmentId,
					processedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(schema.academicYearTransitionItems.id, item.id));
		}
		const completedSummary = summarize(
			items.map((item) => ({ ...item, status: "succeeded" as const })),
		);
		await tx
			.update(schema.academicYearTransitions)
			.set({
				status: "completed",
				summary: completedSummary,
				completedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(schema.academicYearTransitions.id, id));
	});
	// Students placed in a class take its courses (so exams can be created).
	const placed = await db.query.academicYearTransitionItems.findMany({
		where: and(
			eq(schema.academicYearTransitionItems.transitionId, id),
			eq(schema.academicYearTransitionItems.status, "succeeded"),
		),
		columns: { studentId: true, finalTargetClassId: true },
	});
	const byClass = new Map<string, string[]>();
	for (const item of placed) {
		if (!item.finalTargetClassId) continue;
		const list = byClass.get(item.finalTargetClassId) ?? [];
		list.push(item.studentId);
		byClass.set(item.finalTargetClassId, list);
	}
	for (const [classId, studentIds] of byClass) {
		await courseEnrollments.syncClassRosters({
			classIds: [classId],
			studentIds,
		});
	}
	return getById(id, institutionId);
}

export async function getTransitionReadiness(
	id: string,
	institutionId: string,
) {
	const transition = await findTransition(id, institutionId);
	if (!transition) notFound("Academic year transition not found");

	// Aggregate items by source class
	const rows = await db
		.select({
			classId: schema.classes.id,
			className: schema.classes.name,
			classCode: schema.classes.code,
			itemStatus: schema.academicYearTransitionItems.status,
			blockerCode: schema.academicYearTransitionItems.blockerCode,
		})
		.from(schema.academicYearTransitionItems)
		.innerJoin(
			schema.enrollments,
			eq(
				schema.enrollments.id,
				schema.academicYearTransitionItems.sourceEnrollmentId,
			),
		)
		.innerJoin(
			schema.classes,
			eq(schema.classes.id, schema.enrollments.classId),
		)
		.where(
			and(
				eq(schema.academicYearTransitionItems.transitionId, id),
				eq(schema.academicYearTransitionItems.institutionId, institutionId),
			),
		);

	const classIds = [...new Set(rows.map((r) => r.classId))];

	// Check which classes have a signed annual deliberation in the source year
	const signedDeliberations =
		classIds.length === 0
			? []
			: await db.query.deliberations.findMany({
					where: and(
						eq(schema.deliberations.institutionId, institutionId),
						eq(
							schema.deliberations.academicYearId,
							transition.sourceAcademicYearId,
						),
						eq(schema.deliberations.type, "annual"),
						eq(schema.deliberations.status, "signed"),
						inArray(schema.deliberations.classId, classIds),
					),
					columns: { classId: true },
				});
	const signedSet = new Set(signedDeliberations.map((d) => d.classId));

	// Group rows by class
	const byClass = new Map<
		string,
		{
			classId: string;
			className: string;
			classCode: string;
			ready: number;
			blocked: number;
			succeeded: number;
			failed: number;
			blockerCodes: Set<string>;
		}
	>();
	for (const row of rows) {
		let entry = byClass.get(row.classId);
		if (!entry) {
			entry = {
				classId: row.classId,
				className: row.className,
				classCode: row.classCode,
				ready: 0,
				blocked: 0,
				succeeded: 0,
				failed: 0,
				blockerCodes: new Set(),
			};
			byClass.set(row.classId, entry);
		}
		if (row.itemStatus === "ready") entry.ready++;
		else if (row.itemStatus === "blocked") entry.blocked++;
		else if (row.itemStatus === "succeeded") entry.succeeded++;
		else if (row.itemStatus === "failed") entry.failed++;
		if (row.blockerCode) entry.blockerCodes.add(row.blockerCode);
	}

	const classes = [...byClass.values()].map((entry) => ({
		classId: entry.classId,
		className: entry.className,
		classCode: entry.classCode,
		hasSignedDeliberation: signedSet.has(entry.classId),
		studentCounts: {
			ready: entry.ready,
			blocked: entry.blocked,
			succeeded: entry.succeeded,
			failed: entry.failed,
			total: entry.ready + entry.blocked + entry.succeeded + entry.failed,
		},
		blockerCodes: [...entry.blockerCodes],
	}));

	return {
		classes,
		summary: {
			classCount: classes.length,
			readyClasses: classes.filter(
				(c) => c.hasSignedDeliberation && c.studentCounts.blocked === 0,
			).length,
			missingDeliberationCount: classes.filter((c) => !c.hasSignedDeliberation)
				.length,
			blockedStudentCount: classes.reduce(
				(acc, c) => acc + c.studentCounts.blocked,
				0,
			),
		},
	};
}

export async function getTransitionAudit(id: string, institutionId: string) {
	const transition = await findTransition(id, institutionId);
	if (!transition) notFound("Academic year transition not found");

	// Fetch overridden items with student names for per-student override events
	const overriddenItems = await db
		.select({
			id: schema.academicYearTransitionItems.id,
			overriddenBy: schema.academicYearTransitionItems.overriddenBy,
			overriddenAt: schema.academicYearTransitionItems.overriddenAt,
			overrideReason: schema.academicYearTransitionItems.overrideReason,
			finalOutcome: schema.academicYearTransitionItems.finalOutcome,
			studentRegistrationNumber: schema.students.registrationNumber,
			studentFirstName: schema.domainUsers.firstName,
			studentLastName: schema.domainUsers.lastName,
		})
		.from(schema.academicYearTransitionItems)
		.innerJoin(
			schema.students,
			eq(schema.students.id, schema.academicYearTransitionItems.studentId),
		)
		.innerJoin(
			schema.domainUsers,
			eq(schema.domainUsers.id, schema.students.domainUserId),
		)
		.where(
			and(
				eq(schema.academicYearTransitionItems.transitionId, id),
				eq(schema.academicYearTransitionItems.isOverridden, true),
			),
		)
		.orderBy(asc(schema.academicYearTransitionItems.overriddenAt));

	const actorIds = [
		transition.generatedBy,
		transition.submittedBy,
		transition.approvedBy,
		transition.executedBy,
		...overriddenItems.map((i) => i.overriddenBy),
	].filter((actorId): actorId is string => Boolean(actorId));

	const uniqueIds = [...new Set(actorIds)];
	const actors =
		uniqueIds.length === 0
			? []
			: await db.query.domainUsers.findMany({
					where: inArray(schema.domainUsers.id, uniqueIds),
					columns: { id: true, firstName: true, lastName: true },
				});
	const actorById = new Map(actors.map((a) => [a.id, a]));

	function actorName(actorId: string | null | undefined) {
		if (!actorId) return null;
		const actor = actorById.get(actorId);
		if (!actor) return null;
		return `${actor.firstName} ${actor.lastName}`.trim() || null;
	}

	type AuditAction =
		| "created"
		| "submitted"
		| "approved"
		| "executed"
		| "completed"
		| "completed_with_errors"
		| "cancelled"
		| "stale"
		| "override";

	const events: Array<{
		action: AuditAction;
		actorId: string | null;
		actorName: string | null;
		at: Date | null;
		studentName?: string | null;
		studentRegistrationNumber?: string | null;
		overrideReason?: string | null;
		finalOutcome?: string | null;
	}> = [];

	events.push({
		action: "created",
		actorId: transition.generatedBy,
		actorName: actorName(transition.generatedBy),
		at: transition.generatedAt,
	});
	if (transition.submittedAt) {
		events.push({
			action: "submitted",
			actorId: transition.submittedBy ?? null,
			actorName: actorName(transition.submittedBy),
			at: transition.submittedAt,
		});
	}
	if (transition.approvedAt) {
		events.push({
			action: "approved",
			actorId: transition.approvedBy ?? null,
			actorName: actorName(transition.approvedBy),
			at: transition.approvedAt,
		});
	}
	if (transition.startedAt) {
		events.push({
			action: "executed",
			actorId: transition.executedBy ?? null,
			actorName: actorName(transition.executedBy),
			at: transition.startedAt,
		});
	}
	if (
		transition.completedAt &&
		["completed", "completed_with_errors"].includes(transition.status)
	) {
		events.push({
			action: transition.status as "completed" | "completed_with_errors",
			actorId: null,
			actorName: null,
			at: transition.completedAt,
		});
	}
	if (transition.status === "cancelled") {
		events.push({
			action: "cancelled",
			actorId: null,
			actorName: null,
			at: transition.updatedAt,
		});
	}
	if (transition.status === "stale") {
		events.push({
			action: "stale",
			actorId: null,
			actorName: null,
			at: transition.updatedAt,
		});
	}

	// Per-student override events, interleaved by timestamp
	for (const item of overriddenItems) {
		events.push({
			action: "override",
			actorId: item.overriddenBy ?? null,
			actorName: actorName(item.overriddenBy),
			at: item.overriddenAt ?? null,
			studentName:
				`${item.studentLastName} ${item.studentFirstName}`.trim() || null,
			studentRegistrationNumber: item.studentRegistrationNumber ?? null,
			overrideReason: item.overrideReason ?? null,
			finalOutcome: item.finalOutcome ?? null,
		});
	}

	// Sort all events chronologically
	events.sort((a, b) => {
		const ta = a.at ? new Date(a.at).getTime() : 0;
		const tb = b.at ? new Date(b.at).getTime() : 0;
		return ta - tb;
	});

	return {
		events,
		summary: transition.summary as Record<string, number> | null,
	};
}

export async function cancel(id: string, institutionId: string) {
	const transition = await findTransition(id, institutionId);
	if (!transition) notFound("Academic year transition not found");
	if (
		["running", "completed", "completed_with_errors"].includes(
			transition.status,
		)
	) {
		invalid("An executed transition cannot be cancelled");
	}
	await db
		.update(schema.academicYearTransitions)
		.set({ status: "cancelled", updatedAt: new Date() })
		.where(eq(schema.academicYearTransitions.id, id));
	return getById(id, institutionId);
}

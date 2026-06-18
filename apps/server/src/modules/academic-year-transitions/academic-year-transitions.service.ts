import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type {
	CreateTransitionInput,
	ListTransitionItemsInput,
	ListTransitionsInput,
	ResolveTransitionItemInput,
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
	const sourceEnrollments = await db
		.select({
			id: schema.enrollments.id,
			classId: schema.enrollments.classId,
		})
		.from(schema.enrollments)
		.where(
			and(
				eq(schema.enrollments.institutionId, institutionId),
				eq(schema.enrollments.academicYearId, input.sourceAcademicYearId),
				eq(schema.enrollments.status, "active"),
				scopeCondition,
			),
		);
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

	return {
		sourceYear: source,
		targetYear: target,
		enrollmentCount: sourceEnrollments.length,
		classCount: classIds.length,
		signedDeliberationCount: signedClasses.size,
		missingDeliberationClassCount: classIds.filter(
			(classId) => !signedClasses.has(classId),
		).length,
		canGenerate: sourceEnrollments.length > 0,
	};
}

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

	const [deliberations, targetClasses, levels, existingTargets] =
		await Promise.all([
			db.query.deliberations.findMany({
				where: and(
					eq(schema.deliberations.institutionId, institutionId),
					eq(schema.deliberations.academicYearId, input.sourceAcademicYearId),
					eq(schema.deliberations.type, "annual"),
					eq(schema.deliberations.status, "signed"),
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

	const deliberationByClass = new Map(
		deliberations.map((deliberation) => [deliberation.classId, deliberation]),
	);
	const deliberationIds = deliberations.map((row) => row.id);
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
			const result = deliberation
				? resultByKey.get(`${deliberation.id}:${row.studentId}`)
				: undefined;
			let outcome: schema.AcademicYearTransitionOutcome = "review";
			let targetClassId: string | null = null;
			let blockerCode: string | null = null;
			let blockerDetails: Record<string, unknown> = {};

			if (!deliberation) {
				blockerCode = "missing_signed_deliberation";
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
					blockerDetails = { candidateIds: candidates.map((item) => item.id) };
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
	const transition = await findTransition(input.transitionId, institutionId);
	if (!transition) notFound("Academic year transition not found");
	if (!["draft", "ready"].includes(transition.status)) {
		invalid("Only a draft transition can be changed");
	}
	const item = await db.query.academicYearTransitionItems.findFirst({
		where: and(
			eq(schema.academicYearTransitionItems.id, input.itemId),
			eq(schema.academicYearTransitionItems.transitionId, input.transitionId),
			eq(schema.academicYearTransitionItems.institutionId, institutionId),
		),
	});
	if (!item) notFound("Transition item not found");

	const requiresTarget =
		input.outcome === "promote" || input.outcome === "repeat";
	if (requiresTarget && !input.targetClassId) {
		invalid("A target class is required for this outcome");
	}
	if (!requiresTarget && input.targetClassId) {
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
		.where(eq(schema.academicYearTransitionItems.id, input.itemId));
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
			if (item.finalOutcome === "promote" || item.finalOutcome === "repeat") {
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
					throw new Error(
						`Student ${item.studentId} already has a target-year enrollment`,
					);
				}
				await tx
					.update(schema.enrollments)
					.set({ status: "completed", exitedAt: new Date() })
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
	return getById(id, institutionId);
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

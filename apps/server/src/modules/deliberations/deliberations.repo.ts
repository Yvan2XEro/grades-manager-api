import { and, asc, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

// ---------------------------------------------------------------------------
// Deliberations CRUD
// ---------------------------------------------------------------------------

export async function createDeliberation(data: schema.NewDeliberation) {
	const [row] = await db.insert(schema.deliberations).values(data).returning();
	return row;
}

export async function findDeliberationById(id: string, institutionId?: string) {
	return db.query.deliberations.findFirst({
		where: institutionId
			? and(
					eq(schema.deliberations.id, id),
					eq(schema.deliberations.institutionId, institutionId),
				)
			: eq(schema.deliberations.id, id),
		with: {
			classRef: {
				with: {
					program: true,
					cycleLevel: true,
					academicYear: true,
				},
			},
			semester: true,
			academicYear: true,
			president: true,
			creator: true,
			signer: true,
		},
	});
}

export async function updateDeliberation(
	id: string,
	institutionId: string,
	data: Partial<schema.NewDeliberation>,
) {
	const [row] = await db
		.update(schema.deliberations)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(schema.deliberations.id, id),
				eq(schema.deliberations.institutionId, institutionId),
			),
		)
		.returning();
	return row;
}

export async function deleteDeliberation(id: string, institutionId: string) {
	await db
		.delete(schema.deliberations)
		.where(
			and(
				eq(schema.deliberations.id, id),
				eq(schema.deliberations.institutionId, institutionId),
			),
		);
}

export async function listDeliberations(opts: {
	institutionId: string;
	classId?: string;
	academicYearId?: string;
	type?: string;
	status?: string;
	cursor?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 50;
	const conditions = [
		eq(schema.deliberations.institutionId, opts.institutionId),
		opts.classId ? eq(schema.deliberations.classId, opts.classId) : undefined,
		opts.academicYearId
			? eq(schema.deliberations.academicYearId, opts.academicYearId)
			: undefined,
		opts.type
			? eq(schema.deliberations.type, opts.type as schema.DeliberationType)
			: undefined,
		opts.status
			? eq(
					schema.deliberations.status,
					opts.status as schema.DeliberationStatus,
				)
			: undefined,
		opts.cursor ? gt(schema.deliberations.id, opts.cursor) : undefined,
	].filter(Boolean);

	const items = await db.query.deliberations.findMany({
		where: conditions.length > 0 ? and(...conditions) : undefined,
		orderBy: desc(schema.deliberations.createdAt),
		limit,
		with: {
			classRef: {
				with: { program: true, academicYear: true },
			},
			semester: true,
			academicYear: true,
		},
	});

	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;

	return { items, nextCursor };
}

// ---------------------------------------------------------------------------
// Student Results
// ---------------------------------------------------------------------------

export async function upsertStudentResults(
	results: schema.NewDeliberationStudentResult[],
) {
	if (results.length === 0) return [];
	return db
		.insert(schema.deliberationStudentResults)
		.values(results)
		.onConflictDoUpdate({
			target: [
				schema.deliberationStudentResults.deliberationId,
				schema.deliberationStudentResults.studentId,
			],
			set: {
				generalAverage: sql`excluded.general_average`,
				totalCreditsEarned: sql`excluded.total_credits_earned`,
				totalCreditsPossible: sql`excluded.total_credits_possible`,
				ueResults: sql`excluded.ue_results`,
				autoDecision: sql`excluded.auto_decision`,
				finalDecision: sql`excluded.final_decision`,
				isOverridden: sql`excluded.is_overridden`,
				rank: sql`excluded.rank`,
				mention: sql`excluded.mention`,
				rulesEvaluated: sql`excluded.rules_evaluated`,
				factsSnapshot: sql`excluded.facts_snapshot`,
				updatedAt: new Date(),
			},
		})
		.returning();
}

export async function findStudentResultsByDeliberationId(
	deliberationId: string,
) {
	return db.query.deliberationStudentResults.findMany({
		where: eq(schema.deliberationStudentResults.deliberationId, deliberationId),
		with: {
			student: {
				with: {
					profile: true,
				},
			},
		},
		orderBy: asc(schema.deliberationStudentResults.rank),
	});
}

export async function updateStudentResult(
	id: string,
	data: Partial<schema.NewDeliberationStudentResult>,
) {
	const [row] = await db
		.update(schema.deliberationStudentResults)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(schema.deliberationStudentResults.id, id))
		.returning();
	return row;
}

export async function findStudentResultById(id: string) {
	return db.query.deliberationStudentResults.findFirst({
		where: eq(schema.deliberationStudentResults.id, id),
		with: {
			deliberation: true,
			student: { with: { profile: true } },
		},
	});
}

// ---------------------------------------------------------------------------
// Deliberation Rules CRUD
// ---------------------------------------------------------------------------

export async function createRule(data: schema.NewDeliberationRule) {
	const [row] = await db
		.insert(schema.deliberationRules)
		.values(data)
		.returning();
	return row;
}

export async function findRuleById(id: string, institutionId?: string) {
	return db.query.deliberationRules.findFirst({
		where: institutionId
			? and(
					eq(schema.deliberationRules.id, id),
					eq(schema.deliberationRules.institutionId, institutionId),
				)
			: eq(schema.deliberationRules.id, id),
	});
}

export async function updateRule(
	id: string,
	institutionId: string,
	data: Partial<schema.NewDeliberationRule>,
) {
	const [row] = await db
		.update(schema.deliberationRules)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(schema.deliberationRules.id, id),
				eq(schema.deliberationRules.institutionId, institutionId),
			),
		)
		.returning();
	return row;
}

export async function deleteRule(id: string, institutionId: string) {
	await db
		.delete(schema.deliberationRules)
		.where(
			and(
				eq(schema.deliberationRules.id, id),
				eq(schema.deliberationRules.institutionId, institutionId),
			),
		);
}

export async function listRules(opts: {
	institutionId: string;
	category?: string;
	programId?: string;
	cycleLevelId?: string;
	deliberationType?: string;
	isActive?: boolean;
	cursor?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 50;
	const conditions = [
		eq(schema.deliberationRules.institutionId, opts.institutionId),
		opts.category
			? eq(
					schema.deliberationRules.category,
					opts.category as schema.DeliberationRuleCategory,
				)
			: undefined,
		opts.programId
			? eq(schema.deliberationRules.programId, opts.programId)
			: undefined,
		opts.cycleLevelId
			? eq(schema.deliberationRules.cycleLevelId, opts.cycleLevelId)
			: undefined,
		opts.deliberationType
			? eq(
					schema.deliberationRules.deliberationType,
					opts.deliberationType as schema.DeliberationType,
				)
			: undefined,
		opts.isActive !== undefined
			? eq(schema.deliberationRules.isActive, opts.isActive)
			: undefined,
		opts.cursor ? gt(schema.deliberationRules.id, opts.cursor) : undefined,
	].filter(Boolean);

	const items = await db
		.select()
		.from(schema.deliberationRules)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(
			asc(schema.deliberationRules.category),
			asc(schema.deliberationRules.priority),
		)
		.limit(limit);

	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;

	return { items, nextCursor };
}

/** Find applicable rules matching the given scope, sorted for cascade evaluation. */
export async function findApplicableRules(
	institutionId: string,
	programId: string | null,
	cycleLevelId: string | null,
	deliberationType: string,
) {
	const rules = await db
		.select()
		.from(schema.deliberationRules)
		.where(
			and(
				eq(schema.deliberationRules.institutionId, institutionId),
				eq(schema.deliberationRules.isActive, true),
			),
		)
		.orderBy(
			asc(schema.deliberationRules.category),
			asc(schema.deliberationRules.priority),
		);

	// Filter to rules that match scope (null = applies to all)
	return rules.filter((rule) => {
		if (rule.programId && rule.programId !== programId) return false;
		if (rule.cycleLevelId && rule.cycleLevelId !== cycleLevelId) return false;
		if (rule.deliberationType && rule.deliberationType !== deliberationType)
			return false;
		return true;
	});
}

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

export async function createLog(data: schema.NewDeliberationLog) {
	const [row] = await db
		.insert(schema.deliberationLogs)
		.values(data)
		.returning();
	return row;
}

export async function listLogs(opts: {
	deliberationId: string;
	cursor?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 50;
	const conditions = [
		eq(schema.deliberationLogs.deliberationId, opts.deliberationId),
		opts.cursor ? gt(schema.deliberationLogs.id, opts.cursor) : undefined,
	].filter(Boolean);

	const items = await db.query.deliberationLogs.findMany({
		where: conditions.length > 0 ? and(...conditions) : undefined,
		orderBy: desc(schema.deliberationLogs.createdAt),
		limit,
		with: {
			actor: true,
			student: { with: { profile: true } },
		},
	});

	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;

	return { items, nextCursor };
}

// Need sql import for excluded references in onConflictDoUpdate
import { sql } from "drizzle-orm";

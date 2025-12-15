import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

// Promotion Rules CRUD
export async function createRule(data: schema.NewPromotionRule) {
	const [rule] = await db
		.insert(schema.promotionRules)
		.values(data)
		.returning();
	return rule;
}

export async function findRuleById(id: string) {
	return db.query.promotionRules.findFirst({
		where: eq(schema.promotionRules.id, id),
	});
}

export async function updateRule(
	id: string,
	data: Partial<schema.NewPromotionRule>,
) {
	const [rule] = await db
		.update(schema.promotionRules)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(schema.promotionRules.id, id))
		.returning();
	return rule;
}

export async function deleteRule(id: string) {
	await db
		.delete(schema.promotionRules)
		.where(eq(schema.promotionRules.id, id));
}

export async function listRules(opts: {
	institutionId: string;
	programId?: string;
	sourceClassId?: string;
	cycleLevelId?: string;
	isActive?: boolean;
	cursor?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 50;
	const conditions = [
		eq(schema.promotionRules.institutionId, opts.institutionId),
		opts.programId
			? eq(schema.promotionRules.programId, opts.programId)
			: undefined,
		opts.sourceClassId
			? eq(schema.promotionRules.sourceClassId, opts.sourceClassId)
			: undefined,
		opts.cycleLevelId
			? eq(schema.promotionRules.cycleLevelId, opts.cycleLevelId)
			: undefined,
		opts.isActive !== undefined
			? eq(schema.promotionRules.isActive, opts.isActive)
			: undefined,
		opts.cursor ? gt(schema.promotionRules.id, opts.cursor) : undefined,
	].filter(Boolean);

	const items = await db
		.select()
		.from(schema.promotionRules)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(schema.promotionRules.id)
		.limit(limit);

	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;

	return { items, nextCursor };
}

// Promotion Executions
export async function createExecution(data: schema.NewPromotionExecution) {
	const [execution] = await db
		.insert(schema.promotionExecutions)
		.values(data)
		.returning();
	return execution;
}

export async function findExecutionById(id: string) {
	return db.query.promotionExecutions.findFirst({
		where: eq(schema.promotionExecutions.id, id),
		with: {
			rule: true,
			sourceClass: true,
			targetClass: true,
			academicYear: true,
			executor: true,
		},
	});
}

export async function listExecutions(opts: {
	ruleId?: string;
	sourceClassId?: string;
	targetClassId?: string;
	academicYearId?: string;
	executedBy?: string;
	cursor?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 50;
	const conditions = [
		opts.ruleId
			? eq(schema.promotionExecutions.ruleId, opts.ruleId)
			: undefined,
		opts.sourceClassId
			? eq(schema.promotionExecutions.sourceClassId, opts.sourceClassId)
			: undefined,
		opts.targetClassId
			? eq(schema.promotionExecutions.targetClassId, opts.targetClassId)
			: undefined,
		opts.academicYearId
			? eq(schema.promotionExecutions.academicYearId, opts.academicYearId)
			: undefined,
		opts.executedBy
			? eq(schema.promotionExecutions.executedBy, opts.executedBy)
			: undefined,
		opts.cursor ? gt(schema.promotionExecutions.id, opts.cursor) : undefined,
	].filter(Boolean);

	const items = await db
		.select()
		.from(schema.promotionExecutions)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(schema.promotionExecutions.executedAt))
		.limit(limit);

	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;

	return { items, nextCursor };
}

// Promotion Execution Results
export async function createExecutionResult(
	data: schema.NewPromotionExecutionResult,
) {
	const [result] = await db
		.insert(schema.promotionExecutionResults)
		.values(data)
		.returning();
	return result;
}

export async function createExecutionResults(
	data: schema.NewPromotionExecutionResult[],
) {
	if (data.length === 0) return [];
	return db.insert(schema.promotionExecutionResults).values(data).returning();
}

export async function findExecutionResultsByExecutionId(executionId: string) {
	return db
		.select()
		.from(schema.promotionExecutionResults)
		.where(eq(schema.promotionExecutionResults.executionId, executionId))
		.orderBy(schema.promotionExecutionResults.wasPromoted);
}

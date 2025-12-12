import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { Engine } from "json-rules-engine";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as enrollmentsService from "../enrollments/enrollments.service";
import * as repo from "./promotion-rules.repo";
import type {
	ClassPromotionEvaluation,
	StudentEvaluationResult,
	StudentPromotionFacts,
} from "./promotion-rules.types";
import type {
	ApplyPromotionInput,
	CreateRuleInput,
	EvaluateClassInput,
	ListExecutionsInput,
	ListRulesInput,
	UpdateRuleInput,
} from "./promotion-rules.zod";
import { computeStudentFacts } from "./student-facts.service";

// ========== Rule Management ==========

export async function createRule(data: CreateRuleInput) {
	// Validate ruleset format
	try {
		const engine = new Engine([data.ruleset as never], {
			allowUndefinedFacts: true,
		});
		await engine.run({} as never); // Test run with empty facts
	} catch (error) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid ruleset format",
			cause: error,
		});
	}

	return repo.createRule(data);
}

export async function updateRule(data: UpdateRuleInput) {
	const existing = await repo.findRuleById(data.id);
	if (!existing) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found" });
	}

	// Validate ruleset if provided
	if (data.ruleset) {
		try {
			const engine = new Engine([data.ruleset as never], {
				allowUndefinedFacts: true,
			});
			await engine.run({} as never);
		} catch (error) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Invalid ruleset format",
				cause: error,
			});
		}
	}

	return repo.updateRule(data.id, data);
}

export async function deleteRule(id: string) {
	const existing = await repo.findRuleById(id);
	if (!existing) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found" });
	}

	// Check if rule has executions
	const executions = await repo.listExecutions({ ruleId: id, limit: 1 });
	if (executions.items.length > 0) {
		throw new TRPCError({
			code: "CONFLICT",
			message: "Cannot delete rule with existing executions",
		});
	}

	return repo.deleteRule(id);
}

export async function getRuleById(id: string) {
	const rule = await repo.findRuleById(id);
	if (!rule) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found" });
	}
	return rule;
}

export async function listRules(opts: ListRulesInput) {
	return repo.listRules(opts);
}

// ========== Evaluation ==========

/**
 * Evaluate all students in a class against a promotion rule.
 * Returns eligible and non-eligible students with evaluation details.
 */
export async function evaluateClassForPromotion(
	opts: EvaluateClassInput,
): Promise<ClassPromotionEvaluation> {
	// Fetch the rule
	const rule = await repo.findRuleById(opts.ruleId);
	if (!rule) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found" });
	}

	// Fetch the source class
	const sourceClass = await db.query.classes.findFirst({
		where: eq(schema.classes.id, opts.sourceClassId),
	});
	if (!sourceClass) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Source class not found",
		});
	}

	// Get all students in the class
	const students = await db
		.select({
			id: schema.students.id,
			registrationNumber: schema.students.registrationNumber,
			firstName: schema.domainUsers.firstName,
			lastName: schema.domainUsers.lastName,
		})
		.from(schema.students)
		.innerJoin(
			schema.domainUsers,
			eq(schema.students.domainUserId, schema.domainUsers.id),
		)
		.where(eq(schema.students.class, opts.sourceClassId));

	if (students.length === 0) {
		return {
			ruleId: rule.id,
			ruleName: rule.name,
			sourceClassId: sourceClass.id,
			sourceClassName: sourceClass.name,
			academicYearId: opts.academicYearId,
			totalStudents: 0,
			eligible: [],
			notEligible: [],
			evaluatedAt: new Date(),
		};
	}

	// Evaluate each student
	const evaluations = await Promise.all(
		students.map(async (student) => {
			try {
				const facts = await computeStudentFacts(
					student.id,
					opts.academicYearId,
				);
				const result = await evaluateStudentAgainstRule(rule.ruleset, facts);

				return {
					student: {
						id: student.id,
						registrationNumber: student.registrationNumber,
						name: `${student.firstName} ${student.lastName}`,
					},
					facts,
					eligible: result.eligible,
					matchedRules: result.matchedRules,
					failedRules: result.failedRules,
					reasons: result.reasons,
				} as StudentEvaluationResult;
			} catch (error) {
				console.error(`Failed to evaluate student ${student.id}:`, error);
				return {
					student: {
						id: student.id,
						registrationNumber: student.registrationNumber,
						name: `${student.firstName} ${student.lastName}`,
					},
					facts: {} as StudentPromotionFacts,
					eligible: false,
					matchedRules: [],
					failedRules: [],
					reasons: [`Evaluation error: ${error}`],
				} as StudentEvaluationResult;
			}
		}),
	);

	// Separate eligible and non-eligible
	const eligible = evaluations.filter((e) => e.eligible);
	const notEligible = evaluations.filter((e) => !e.eligible);

	return {
		ruleId: rule.id,
		ruleName: rule.name,
		sourceClassId: sourceClass.id,
		sourceClassName: sourceClass.name,
		academicYearId: opts.academicYearId,
		totalStudents: students.length,
		eligible,
		notEligible,
		evaluatedAt: new Date(),
	};
}

/**
 * Evaluate a student's facts against a ruleset using json-rules-engine.
 */
async function evaluateStudentAgainstRule(
	ruleset: Record<string, unknown>,
	facts: StudentPromotionFacts,
): Promise<{
	eligible: boolean;
	matchedRules: string[];
	failedRules: string[];
	reasons: string[];
}> {
	const engine = new Engine([ruleset as never], { allowUndefinedFacts: true });

	try {
		const result = await engine.run(facts as never);

		const eligible = result.events.length > 0;
		const matchedRules = result.events.map((e) => e.type);
		const failedRules = result.failureEvents?.map((e) => e.type) ?? [];
		const reasons = result.events.map(
			(e) => e.params?.message || e.type,
		) as string[];

		return {
			eligible,
			matchedRules,
			failedRules,
			reasons,
		};
	} catch (error) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Rule evaluation failed",
			cause: error,
		});
	}
}

// ========== Execution ==========

/**
 * Apply promotion: move selected students to target class and record execution.
 */
export async function applyPromotion(
	opts: ApplyPromotionInput,
	executedBy: string,
) {
	// Validate inputs
	const rule = await repo.findRuleById(opts.ruleId);
	if (!rule) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found" });
	}

	const sourceClass = await db.query.classes.findFirst({
		where: eq(schema.classes.id, opts.sourceClassId),
	});
	if (!sourceClass) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Source class not found",
		});
	}

	const targetClass = await db.query.classes.findFirst({
		where: eq(schema.classes.id, opts.targetClassId),
	});
	if (!targetClass) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Target class not found",
		});
	}

	// Re-evaluate selected students to get their facts
	const studentEvaluations = await Promise.all(
		opts.studentIds.map(async (studentId) => {
			const facts = await computeStudentFacts(studentId, opts.academicYearId);
			const evaluation = await evaluateStudentAgainstRule(rule.ruleset, facts);
			return { studentId, facts, evaluation };
		}),
	);

	// Use a transaction to ensure atomicity
	return db.transaction(async (tx) => {
		// Create promotion execution record
		const execution = await tx
			.insert(schema.promotionExecutions)
			.values({
				ruleId: opts.ruleId,
				sourceClassId: opts.sourceClassId,
				targetClassId: opts.targetClassId,
				academicYearId: opts.academicYearId,
				executedBy,
				studentsEvaluated: opts.studentIds.length,
				studentsPromoted: opts.studentIds.length,
				metadata: {
					ruleName: rule.name,
					sourceClassName: sourceClass.name,
					targetClassName: targetClass.name,
				},
			})
			.returning()
			.then((rows) => rows[0]);

		// Create execution result records
		const executionResults = studentEvaluations.map((se) => ({
			executionId: execution.id,
			studentId: se.studentId,
			wasPromoted: true,
			evaluationData: se.facts,
			rulesMatched: se.evaluation.matchedRules,
		}));

		await tx.insert(schema.promotionExecutionResults).values(executionResults);

		// Update student enrollments
		for (const studentId of opts.studentIds) {
			// Close current enrollment
			await enrollmentsService.closeActiveEnrollment(studentId, "completed");

			// Create new enrollment in target class
			await tx.insert(schema.enrollments).values({
				studentId,
				classId: opts.targetClassId,
				academicYearId: opts.academicYearId,
				status: "active",
			});

			// Update student's class reference
			await tx
				.update(schema.students)
				.set({ class: opts.targetClassId })
				.where(eq(schema.students.id, studentId));
		}

		return execution;
	});
}

// ========== Execution History ==========

export async function listExecutions(opts: ListExecutionsInput) {
	return repo.listExecutions(opts);
}

export async function getExecutionDetails(executionId: string) {
	const execution = await repo.findExecutionById(executionId);
	if (!execution) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Execution not found" });
	}

	const results = await repo.findExecutionResultsByExecutionId(executionId);

	return {
		execution,
		results,
	};
}

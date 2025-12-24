import { describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import {
	asAdmin,
	createClass,
	createClassCourse,
	createExam,
	createGrade,
	createStudent,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";
import * as promotionRulesService from "../promotion-rules.service";
import {
	getStudentPromotionFacts,
	refreshStudentPromotionSummary,
} from "../student-facts.service";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("student promotion summaries", () => {
	it("rebuilds and caches yearly facts", async () => {
		const klass = await createClass();
		const student = await createStudent({ class: klass.id });
		const classCourse = await createClassCourse({ class: klass.id });
		const exam = await createExam({
			classCourse: classCourse.id,
			percentage: "100",
		});
		await createGrade({ student: student.id, exam: exam.id, score: 14 });

		const facts = await refreshStudentPromotionSummary(
			student.id,
			klass.academicYear,
		);
		const summary = await db.query.studentPromotionSummaries.findFirst({
			where: andSummary(student.id, klass.academicYear),
		});

		expect(summary).not.toBeNull();
		expect(summary?.overallAverage).toBeGreaterThan(0);
		expect(summary?.overallAverage).toBeCloseTo(facts.overallAverage);

		const cachedFacts = await getStudentPromotionFacts(
			student.id,
			klass.academicYear,
		);
		expect(cachedFacts.registrationNumber).toBe(student.registrationNumber);
		expect(cachedFacts.overallAverage).toBeCloseTo(facts.overallAverage);
		expect(cachedFacts.averageByCourse).not.toEqual({});
	});

	it("requires cached summaries to evaluate promotion rules", async () => {
		const klass = await createClass();
		const student = await createStudent({ class: klass.id });
		const classCourse = await createClassCourse({ class: klass.id });
		const exam = await createExam({
			classCourse: classCourse.id,
			percentage: "100",
		});
		await createGrade({ student: student.id, exam: exam.id, score: 15 });

		const rule = await promotionRulesService.createRule(
			{
				name: "Average >= 10",
				ruleset: {
					conditions: {
						all: [
							{
								fact: "overallAverage",
								operator: "greaterThanInclusive",
								value: 10,
							},
						],
					},
					event: { type: "eligible", params: {} },
				},
				sourceClassId: klass.id,
				isActive: true,
			},
			klass.institutionId,
		);

		const before = await promotionRulesService.evaluateClassForPromotion(
			{
				ruleId: rule.id,
				sourceClassId: klass.id,
				academicYearId: klass.academicYear,
			},
			klass.institutionId,
		);
		expect(before.eligible).toHaveLength(0);
		expect(before.notEligible).toHaveLength(1);
		expect(before.notEligible[0].reasons?.[0]).toContain(
			"Promotion summary missing",
		);

		await refreshStudentPromotionSummary(student.id, klass.academicYear);

		const after = await promotionRulesService.evaluateClassForPromotion(
			{
				ruleId: rule.id,
				sourceClassId: klass.id,
				academicYearId: klass.academicYear,
			},
			klass.institutionId,
		);
		expect(after.eligible).toHaveLength(1);
		expect(after.eligible[0].facts.overallAverage).toBeGreaterThanOrEqual(10);
	});

	it("requires admin rights to trigger manual refresh", async () => {
		const klass = await createClass();
		const caller = createCaller(makeTestContext());
		await expect(
			caller.promotionRules.refreshClassSummaries({
				classId: klass.id,
				academicYearId: klass.academicYear,
			}),
		).rejects.toHaveProperty("code", "UNAUTHORIZED");
	});

	it("allows an admin to refresh class summaries manually", async () => {
		const klass = await createClass();
		const student = await createStudent({ class: klass.id });
		const admin = createCaller(asAdmin());

		const result = await admin.promotionRules.refreshClassSummaries({
			classId: klass.id,
			academicYearId: klass.academicYear,
		});

		expect(result.classId).toBe(klass.id);
		expect(result.studentCount).toBeGreaterThanOrEqual(1);

		const summary = await db.query.studentPromotionSummaries.findFirst({
			where: andSummary(student.id, klass.academicYear),
		});
		expect(summary).not.toBeNull();
	});
});

function andSummary(studentId: string, academicYearId: string) {
	return and(
		eq(schema.studentPromotionSummaries.studentId, studentId),
		eq(schema.studentPromotionSummaries.academicYearId, academicYearId),
	);
}

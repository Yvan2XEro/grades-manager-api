import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

function yearEq(col: Parameters<typeof eq>[0], id: string | undefined) {
	return id ? [eq(col, id)] : [];
}

export const statsRepo = {
	async overview(institutionId: string, academicYearId?: string) {
		const [studentsRow] = await db
			.select({ count: count() })
			.from(schema.enrollments)
			.where(
				and(
					eq(schema.enrollments.institutionId, institutionId),
					eq(schema.enrollments.status, "active"),
					...yearEq(schema.enrollments.academicYearId, academicYearId),
				),
			);

		const [examsPendingRow] = await db
			.select({ count: count() })
			.from(schema.exams)
			.where(
				and(
					eq(schema.exams.institutionId, institutionId),
					eq(schema.exams.status, "submitted"),
				),
			);

		const [feeExpectedRow] = await db
			.select({
				total: sql<string>`COALESCE(SUM(${schema.studentFeeAssignments.effectiveAmount}), '0')`,
			})
			.from(schema.studentFeeAssignments)
			.where(
				and(
					eq(schema.studentFeeAssignments.institutionId, institutionId),
					...yearEq(
						schema.studentFeeAssignments.academicYearId,
						academicYearId,
					),
				),
			);

		const [feeCollectedRow] = await db
			.select({
				total: sql<string>`COALESCE(SUM(${schema.feePayments.amount}), '0')`,
			})
			.from(schema.feePayments)
			.innerJoin(
				schema.studentFeeAssignments,
				eq(schema.feePayments.feeAssignmentId, schema.studentFeeAssignments.id),
			)
			.where(
				and(
					eq(schema.feePayments.institutionId, institutionId),
					...yearEq(
						schema.studentFeeAssignments.academicYearId,
						academicYearId,
					),
				),
			);

		const [admissionsRow] = await db
			.select({ count: count() })
			.from(schema.admissionApplications)
			.where(
				and(
					eq(schema.admissionApplications.institutionId, institutionId),
					...yearEq(
						schema.admissionApplications.academicYearId,
						academicYearId,
					),
				),
			);

		const [deliberationsOpenRow] = await db
			.select({ count: count() })
			.from(schema.deliberations)
			.where(
				and(
					eq(schema.deliberations.institutionId, institutionId),
					eq(schema.deliberations.status, "open"),
					...yearEq(schema.deliberations.academicYearId, academicYearId),
				),
			);

		const feeExpected = Number.parseFloat(feeExpectedRow?.total ?? "0");
		const feeCollected = Number.parseFloat(feeCollectedRow?.total ?? "0");

		return {
			activeStudents: studentsRow?.count ?? 0,
			examsPending: examsPendingRow?.count ?? 0,
			feeExpected,
			feeCollected,
			feeOutstanding: feeExpected - feeCollected,
			feeCollectionRate:
				feeExpected > 0 ? Math.round((feeCollected / feeExpected) * 100) : 0,
			admissionsTotal: admissionsRow?.count ?? 0,
			deliberationsOpen: deliberationsOpenRow?.count ?? 0,
		};
	},

	async enrollmentStats(institutionId: string, academicYearId?: string) {
		const baseWhere = and(
			eq(schema.enrollments.institutionId, institutionId),
			...yearEq(schema.enrollments.academicYearId, academicYearId),
		);

		const [totalRow] = await db
			.select({ count: count() })
			.from(schema.enrollments)
			.where(baseWhere);

		const byStatus = await db
			.select({ status: schema.enrollments.status, count: count() })
			.from(schema.enrollments)
			.where(baseWhere)
			.groupBy(schema.enrollments.status);

		const byProgram = await db
			.select({
				programId: schema.classes.program,
				programName: schema.programs.name,
				count: count(),
			})
			.from(schema.enrollments)
			.innerJoin(
				schema.classes,
				eq(schema.enrollments.classId, schema.classes.id),
			)
			.innerJoin(
				schema.programs,
				eq(schema.classes.program, schema.programs.id),
			)
			.where(baseWhere)
			.groupBy(schema.classes.program, schema.programs.name)
			.orderBy(desc(count()));

		const byGender = await db
			.select({
				gender: schema.domainUsers.gender,
				count: count(),
			})
			.from(schema.enrollments)
			.innerJoin(
				schema.students,
				eq(schema.enrollments.studentId, schema.students.id),
			)
			.innerJoin(
				schema.domainUsers,
				eq(schema.students.domainUserId, schema.domainUsers.id),
			)
			.where(baseWhere)
			.groupBy(schema.domainUsers.gender);

		return {
			total: totalRow?.count ?? 0,
			byStatus,
			byProgram,
			byGender,
		};
	},

	async performanceStats(institutionId: string, academicYearId?: string) {
		const deliberationWhere = and(
			eq(schema.deliberations.institutionId, institutionId),
			...yearEq(schema.deliberations.academicYearId, academicYearId),
		);

		const byDecision = await db
			.select({
				decision: schema.deliberationStudentResults.finalDecision,
				count: count(),
			})
			.from(schema.deliberationStudentResults)
			.innerJoin(
				schema.deliberations,
				eq(
					schema.deliberationStudentResults.deliberationId,
					schema.deliberations.id,
				),
			)
			.where(deliberationWhere)
			.groupBy(schema.deliberationStudentResults.finalDecision);

		const byMention = await db
			.select({
				mention: schema.deliberationStudentResults.mention,
				count: count(),
			})
			.from(schema.deliberationStudentResults)
			.innerJoin(
				schema.deliberations,
				eq(
					schema.deliberationStudentResults.deliberationId,
					schema.deliberations.id,
				),
			)
			.where(
				and(
					deliberationWhere,
					sql`${schema.deliberationStudentResults.mention} IS NOT NULL`,
				),
			)
			.groupBy(schema.deliberationStudentResults.mention);

		const [avgRow] = await db
			.select({
				avg: sql<string>`COALESCE(AVG(${schema.deliberationStudentResults.generalAverage}), '0')`,
			})
			.from(schema.deliberationStudentResults)
			.innerJoin(
				schema.deliberations,
				eq(
					schema.deliberationStudentResults.deliberationId,
					schema.deliberations.id,
				),
			)
			.where(
				and(
					deliberationWhere,
					sql`${schema.deliberationStudentResults.generalAverage} IS NOT NULL`,
				),
			);

		return {
			byDecision,
			byMention,
			avgGeneralAverage: Number.parseFloat(avgRow?.avg ?? "0"),
		};
	},

	async financeStats(institutionId: string, academicYearId?: string) {
		const assignWhere = and(
			eq(schema.studentFeeAssignments.institutionId, institutionId),
			...yearEq(schema.studentFeeAssignments.academicYearId, academicYearId),
		);

		const paymentJoinWhere = and(
			eq(schema.feePayments.institutionId, institutionId),
			...yearEq(schema.studentFeeAssignments.academicYearId, academicYearId),
		);

		const [expectedRow] = await db
			.select({
				total: sql<string>`COALESCE(SUM(${schema.studentFeeAssignments.effectiveAmount}), '0')`,
				count: count(),
			})
			.from(schema.studentFeeAssignments)
			.where(assignWhere);

		const [collectedRow] = await db
			.select({
				total: sql<string>`COALESCE(SUM(${schema.feePayments.amount}), '0')`,
			})
			.from(schema.feePayments)
			.innerJoin(
				schema.studentFeeAssignments,
				eq(schema.feePayments.feeAssignmentId, schema.studentFeeAssignments.id),
			)
			.where(paymentJoinWhere);

		const byStatus = await db
			.select({
				status: schema.studentFeeAssignments.status,
				count: count(),
			})
			.from(schema.studentFeeAssignments)
			.where(assignWhere)
			.groupBy(schema.studentFeeAssignments.status);

		const byPaymentMethod = await db
			.select({
				method: schema.feePayments.paymentMethod,
				total: sql<string>`COALESCE(SUM(${schema.feePayments.amount}), '0')`,
				count: count(),
			})
			.from(schema.feePayments)
			.innerJoin(
				schema.studentFeeAssignments,
				eq(schema.feePayments.feeAssignmentId, schema.studentFeeAssignments.id),
			)
			.where(paymentJoinWhere)
			.groupBy(schema.feePayments.paymentMethod);

		const monthlyCollections = await db
			.select({
				month: sql<string>`TO_CHAR(${schema.feePayments.paymentDate}, 'YYYY-MM')`,
				total: sql<string>`COALESCE(SUM(${schema.feePayments.amount}), '0')`,
			})
			.from(schema.feePayments)
			.innerJoin(
				schema.studentFeeAssignments,
				eq(schema.feePayments.feeAssignmentId, schema.studentFeeAssignments.id),
			)
			.where(paymentJoinWhere)
			.groupBy(sql`TO_CHAR(${schema.feePayments.paymentDate}, 'YYYY-MM')`)
			.orderBy(sql`TO_CHAR(${schema.feePayments.paymentDate}, 'YYYY-MM')`);

		const expected = Number.parseFloat(expectedRow?.total ?? "0");
		const collected = Number.parseFloat(collectedRow?.total ?? "0");

		return {
			expected,
			collected,
			outstanding: expected - collected,
			collectionRate:
				expected > 0 ? Math.round((collected / expected) * 100) : 0,
			assignmentsCount: expectedRow?.count ?? 0,
			byStatus,
			byPaymentMethod: byPaymentMethod.map((r) => ({
				...r,
				total: Number.parseFloat(r.total),
			})),
			monthlyCollections: monthlyCollections.map((r) => ({
				month: r.month,
				total: Number.parseFloat(r.total),
			})),
		};
	},

	async admissionsStats(institutionId: string, academicYearId?: string) {
		const baseWhere = and(
			eq(schema.admissionApplications.institutionId, institutionId),
			...yearEq(schema.admissionApplications.academicYearId, academicYearId),
		);

		const [totalRow] = await db
			.select({ count: count() })
			.from(schema.admissionApplications)
			.where(baseWhere);

		const byStatus = await db
			.select({
				status: schema.admissionApplications.status,
				count: count(),
			})
			.from(schema.admissionApplications)
			.where(baseWhere)
			.groupBy(schema.admissionApplications.status);

		const byProgram = await db
			.select({
				programId: schema.admissionApplications.programId,
				programName: schema.programs.name,
				count: count(),
			})
			.from(schema.admissionApplications)
			.innerJoin(
				schema.programs,
				eq(schema.admissionApplications.programId, schema.programs.id),
			)
			.where(baseWhere)
			.groupBy(schema.admissionApplications.programId, schema.programs.name)
			.orderBy(desc(count()));

		const [convertedRow] = await db
			.select({ count: count() })
			.from(schema.admissionApplications)
			.where(
				and(
					baseWhere,
					sql`${schema.admissionApplications.convertedStudentId} IS NOT NULL`,
				),
			);

		const total = totalRow?.count ?? 0;
		const converted = convertedRow?.count ?? 0;

		return {
			total,
			byStatus,
			byProgram,
			conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
			converted,
		};
	},
};

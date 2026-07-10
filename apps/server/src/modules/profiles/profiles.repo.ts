import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function getProfile(profileId: string) {
	return db.query.domainUsers.findFirst({
		where: eq(schema.domainUsers.id, profileId),
	});
}

export async function getStudentByDomainUserId(
	domainUserId: string,
	institutionId: string,
) {
	const [student] = await db
		.select()
		.from(schema.students)
		.where(
			and(
				eq(schema.students.domainUserId, domainUserId),
				eq(schema.students.institutionId, institutionId),
			),
		)
		.limit(1);
	return student ?? null;
}

export async function listEnrollments(
	studentId: string,
	institutionId: string,
) {
	return db
		.select({
			id: schema.enrollments.id,
			status: schema.enrollments.status,
			enrolledAt: schema.enrollments.enrolledAt,
			exitedAt: schema.enrollments.exitedAt,
			classId: schema.classes.id,
			className: schema.classes.name,
			academicYearId: schema.academicYears.id,
			academicYearName: schema.academicYears.name,
			academicYearStartDate: schema.academicYears.startDate,
		})
		.from(schema.enrollments)
		.innerJoin(
			schema.classes,
			eq(schema.enrollments.classId, schema.classes.id),
		)
		.innerJoin(
			schema.academicYears,
			eq(schema.enrollments.academicYearId, schema.academicYears.id),
		)
		.where(
			and(
				eq(schema.enrollments.studentId, studentId),
				eq(schema.enrollments.institutionId, institutionId),
			),
		)
		.orderBy(desc(schema.academicYears.startDate));
}

export async function listCourseResults(
	studentId: string,
	institutionId: string,
	academicYearId?: string,
) {
	return db.query.studentCourseEnrollments.findMany({
		where: academicYearId
			? and(
					eq(schema.studentCourseEnrollments.studentId, studentId),
					eq(schema.studentCourseEnrollments.academicYearId, academicYearId),
				)
			: eq(schema.studentCourseEnrollments.studentId, studentId),
		with: {
			course: {
				with: { teachingUnit: true },
			},
			academicYear: true,
		},
		orderBy: desc(schema.studentCourseEnrollments.academicYearId),
	});
}

export async function listFeeAssignments(
	studentId: string,
	institutionId: string,
) {
	return db
		.select({
			id: schema.studentFeeAssignments.id,
			status: schema.studentFeeAssignments.status,
			effectiveAmount: schema.studentFeeAssignments.effectiveAmount,
			currency: schema.studentFeeAssignments.currency,
			discountAmount: schema.studentFeeAssignments.discountAmount,
			clearedAt: schema.studentFeeAssignments.clearedAt,
			academicYearId: schema.academicYears.id,
			academicYearName: schema.academicYears.name,
		})
		.from(schema.studentFeeAssignments)
		.innerJoin(
			schema.academicYears,
			eq(schema.studentFeeAssignments.academicYearId, schema.academicYears.id),
		)
		.where(
			and(
				eq(schema.studentFeeAssignments.studentId, studentId),
				eq(schema.studentFeeAssignments.institutionId, institutionId),
			),
		)
		.orderBy(desc(schema.academicYears.startDate));
}

export async function listGuardians(studentId: string, institutionId: string) {
	return db
		.select({
			id: schema.guardians.id,
			firstName: schema.guardians.firstName,
			lastName: schema.guardians.lastName,
			email: schema.guardians.email,
			phone: schema.guardians.phone,
			isActive: schema.guardians.isActive,
			relationshipType: schema.studentGuardians.relationshipType,
			isPrimary: schema.studentGuardians.isPrimary,
			isEmergencyContact: schema.studentGuardians.isEmergencyContact,
		})
		.from(schema.studentGuardians)
		.innerJoin(
			schema.guardians,
			eq(schema.studentGuardians.guardianId, schema.guardians.id),
		)
		.where(
			and(
				eq(schema.studentGuardians.studentId, studentId),
				eq(schema.studentGuardians.institutionId, institutionId),
			),
		);
}

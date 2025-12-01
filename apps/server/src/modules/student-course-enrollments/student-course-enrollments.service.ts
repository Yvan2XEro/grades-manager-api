import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as creditLedger from "../student-credit-ledger";
import * as repo from "./student-course-enrollments.repo";

type CreateInput = {
	studentId: string;
	classCourseId: string;
	status?: schema.StudentCourseEnrollmentStatus;
	attempt?: number;
};

type BulkInput = {
	studentId: string;
	classCourseIds: string[];
	status?: schema.StudentCourseEnrollmentStatus;
	attempt?: number;
};

type CloseInput = {
	studentId: string;
	status?: schema.StudentCourseEnrollmentStatus;
};

const FINAL_STATUSES: schema.StudentCourseEnrollmentStatus[] = [
	"completed",
	"failed",
	"withdrawn",
];

async function fetchStudentContext(studentId: string) {
	const [row] = await db
		.select({
			id: schema.students.id,
			classId: schema.students.class,
			programId: schema.classes.program,
		})
		.from(schema.students)
		.innerJoin(schema.classes, eq(schema.students.class, schema.classes.id))
		.where(eq(schema.students.id, studentId))
		.limit(1);
	if (!row) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
	}
	return row;
}

async function fetchClassCourseContext(classCourseId: string) {
	const [row] = await db
		.select({
			id: schema.classCourses.id,
			classId: schema.classCourses.class,
			courseId: schema.classCourses.course,
			teacherId: schema.classCourses.teacher,
			classProgramId: schema.classes.program,
			academicYearId: schema.classes.academicYear,
			courseProgramId: schema.courses.program,
			courseCredits: schema.courses.credits,
		})
		.from(schema.classCourses)
		.innerJoin(schema.classes, eq(schema.classCourses.class, schema.classes.id))
		.innerJoin(
			schema.courses,
			eq(schema.classCourses.course, schema.courses.id),
		)
		.where(eq(schema.classCourses.id, classCourseId))
		.limit(1);
	if (!row) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Class course not found",
		});
	}
	return row;
}

async function ensureSameProgram(
	studentProgramId: string,
	classCourseProgramId: string,
) {
	if (studentProgramId !== classCourseProgramId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Student cannot enroll in a course from another program",
		});
	}
}

function resolveCreditsEarned(
	status: schema.StudentCourseEnrollmentStatus,
	creditsAttempted: number,
) {
	return status === "completed" ? creditsAttempted : 0;
}

function resolveCompletionTimestamp(
	status: schema.StudentCourseEnrollmentStatus,
) {
	return FINAL_STATUSES.includes(status) ? new Date() : null;
}

async function assertAttemptAvailability(input: {
	studentId: string;
	courseId: string;
	academicYearId: string;
	attempt: number;
}) {
	const existing = await db.query.studentCourseEnrollments.findFirst({
		where: and(
			eq(schema.studentCourseEnrollments.studentId, input.studentId),
			eq(schema.studentCourseEnrollments.courseId, input.courseId),
			eq(schema.studentCourseEnrollments.academicYearId, input.academicYearId),
			eq(schema.studentCourseEnrollments.attempt, input.attempt),
		),
	});
	if (existing) {
		throw new TRPCError({
			code: "CONFLICT",
			message: "Enrollment attempt already exists for this student/course/year",
		});
	}
}

export async function createEnrollment(input: CreateInput) {
	const status = input.status ?? "planned";
	const attempt = input.attempt ?? 1;
	const student = await fetchStudentContext(input.studentId);
	const classCourse = await fetchClassCourseContext(input.classCourseId);
	await ensureSameProgram(student.programId, classCourse.courseProgramId);
	await assertAttemptAvailability({
		studentId: student.id,
		courseId: classCourse.courseId,
		academicYearId: classCourse.academicYearId,
		attempt,
	});
	const payload: schema.NewStudentCourseEnrollment = {
		studentId: student.id,
		classCourseId: classCourse.id,
		courseId: classCourse.courseId,
		sourceClassId: classCourse.classId,
		academicYearId: classCourse.academicYearId,
		status,
		attempt,
		creditsAttempted: classCourse.courseCredits,
		creditsEarned: resolveCreditsEarned(status, classCourse.courseCredits),
		completedAt: resolveCompletionTimestamp(status),
	};
	const record = await repo.create(payload);
	const contribution = creditLedger.contributionForStatus(
		status,
		classCourse.courseCredits,
	);
	await creditLedger.applyDelta(
		record.studentId,
		record.academicYearId,
		contribution.inProgress,
		contribution.earned,
	);
	return record;
}

export async function bulkEnroll(input: BulkInput) {
	const uniqueCourseIds = Array.from(new Set(input.classCourseIds));
	if (!uniqueCourseIds.length) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "No class courses provided",
		});
	}
	const status = input.status ?? "active";
	const attempt = input.attempt ?? 1;
	const created: schema.StudentCourseEnrollment[] = [];
	const skipped: { classCourseId: string; reason: string }[] = [];
	for (const classCourseId of uniqueCourseIds) {
		try {
			const record = await createEnrollment({
				studentId: input.studentId,
				classCourseId,
				status,
				attempt,
			});
			created.push(record);
		} catch (error) {
			if (error instanceof TRPCError && error.code === "CONFLICT") {
				skipped.push({
					classCourseId,
					reason: "conflict",
				});
				continue;
			}
			throw error;
		}
	}
	return { created, skipped };
}

export async function updateStatus(
	id: string,
	status: schema.StudentCourseEnrollmentStatus,
) {
	const existing = await repo.findById(id);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	const payload: Partial<schema.NewStudentCourseEnrollment> = {
		status,
		creditsEarned: resolveCreditsEarned(status, existing.creditsAttempted),
		completedAt: resolveCompletionTimestamp(status),
	};
	if (status === "active" && existing.startedAt === null) {
		payload.startedAt = new Date();
	}
	const updated = await repo.update(id, payload);
	if (!updated) return null;
	const previousContribution = creditLedger.contributionForStatus(
		existing.status,
		existing.creditsAttempted,
	);
	const nextContribution = creditLedger.contributionForStatus(
		status,
		existing.creditsAttempted,
	);
	await creditLedger.applyDelta(
		existing.studentId,
		existing.academicYearId,
		nextContribution.inProgress - previousContribution.inProgress,
		nextContribution.earned - previousContribution.earned,
	);
	return updated;
}

export async function closeForStudent(input: CloseInput) {
	const status = input.status ?? "withdrawn";
	const activeRecords = await repo.findByStudentAndStatuses(input.studentId, [
		"planned",
		"active",
	]);
	for (const record of activeRecords) {
		await updateStatus(record.id, status);
	}
	return activeRecords.length;
}

export async function list(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}

export async function getById(id: string) {
	const item = await repo.findById(id);
	if (!item) throw new TRPCError({ code: "NOT_FOUND" });
	return item;
}

export async function ensureRosterForClassCourse(classCourseId: string) {
	const count = await repo.countRosterForClassCourse(classCourseId);
	if (count === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "No active enrollments exist for this class course",
		});
	}
	return count;
}

export async function ensureStudentRegistered(
	studentId: string,
	classCourseId: string,
) {
	const enrollment = await repo.findEligibleForClassCourse(
		classCourseId,
		studentId,
	);
	if (!enrollment) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Student is not registered for this course offering",
		});
	}
	return enrollment;
}

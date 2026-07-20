import { TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as classesRepo from "../classes/classes.repo";
import * as enrollmentsRepo from "../enrollments/enrollments.repo";
import * as examsService from "../exams/exams.service";
import * as notifications from "../notifications/notifications.service";
import * as windowsRepo from "./workflows.repo";

async function requireExam(examId: string, institutionId: string) {
	const exam = await db.query.exams.findFirst({
		where: and(
			eq(schema.exams.id, examId),
			eq(schema.exams.institutionId, institutionId),
		),
	});
	if (!exam) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Exam not found" });
	}
	return exam;
}

async function requireClass(classId: string, institutionId: string) {
	const klass = await classesRepo.findById(classId, institutionId);
	if (!klass)
		throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
	return klass;
}

async function requireAcademicYear(
	academicYearId: string,
	institutionId: string,
) {
	const year = await db.query.academicYears.findFirst({
		where: and(
			eq(schema.academicYears.id, academicYearId),
			eq(schema.academicYears.institutionId, institutionId),
		),
	});
	if (!year) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Academic year not found",
		});
	}
	return year;
}

async function requireClassCourse(
	classCourseId: string,
	institutionId: string,
) {
	const classCourse = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
	});
	if (!classCourse) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Class course not found",
		});
	}
	return classCourse;
}

export async function validateGrades(
	examId: string,
	approverId: string | null | undefined,
	institutionId: string,
) {
	const exam = await requireExam(examId, institutionId);
	const updated = await examsService.validateExam(
		examId,
		approverId ?? null,
		"approved",
		institutionId,
	);
	await examsService.setLock(examId, true, institutionId);
	await notifications.registerWorkflowAlert(
		"grade_validated",
		{ examId },
		approverId,
	);
	// Teacher notification is handled inside validateExam() with dedupeKey
	return updated;
}

export async function toggleEnrollmentWindow(
	classId: string,
	academicYearId: string,
	action: "open" | "close",
	institutionId: string,
) {
	await requireClass(classId, institutionId);
	await requireAcademicYear(academicYearId, institutionId);
	const { items } = await enrollmentsRepo.list({
		classId,
		academicYearId,
		status: undefined,
		institutionId,
	});
	if (!items.length) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Class or academic year not found for enrollment window",
		});
	}
	const nextStatus: schema.EnrollmentWindowStatus =
		action === "open" ? "open" : "closed";
	const window = await windowsRepo.upsertWindow(
		classId,
		academicYearId,
		nextStatus,
		institutionId,
	);
	await notifications.registerWorkflowAlert(`enrollment_${nextStatus}`, {
		classId,
		academicYearId,
		status: nextStatus,
	});
	return window;
}

export async function listEnrollmentWindows(institutionId: string) {
	return windowsRepo.listWindows(institutionId);
}

export async function triggerAttendanceAlert(
	classCourseId: string,
	severity: "info" | "warning" | "critical",
	message: string,
	recipientId: string | undefined,
	institutionId: string,
) {
	await requireClassCourse(classCourseId, institutionId);
	await notifications.registerWorkflowAlert(
		"attendance_alert",
		{ classCourseId, severity, message },
		recipientId,
	);
	return { status: "queued" };
}

export async function rejectGrades(
	examId: string,
	reason: string,
	rejectorId: string | null | undefined,
	institutionId: string,
) {
	const exam = await requireExam(examId, institutionId);
	const updated = await examsService.validateExam(
		examId,
		rejectorId ?? null,
		"rejected",
		institutionId,
		reason,
	);
	await notifications.registerWorkflowAlert(
		"grade_validated",
		{ examId, rejected: true, reason },
		rejectorId,
	);
	// Teacher notification is handled inside validateExam() with dedupeKey
	return updated;
}

export async function studentSelfEnroll(
	studentId: string,
	classCourseId: string,
	institutionId: string,
) {
	// Verify the class course belongs to this institution
	const classCourse = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
		with: { classRef: true },
	});
	if (!classCourse) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
	}
	// Check enrollment window is open for this class
	const window = await windowsRepo.findWindow(
		classCourse.class,
		classCourse.classRef.academicYear,
		institutionId,
	);
	if (!window || window.status !== "open") {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "Enrollment window is not open for this course",
		});
	}
	// Check student belongs to the right class
	const student = await db.query.students.findFirst({
		where: and(
			eq(schema.students.id, studentId),
			eq(schema.students.institutionId, institutionId),
			eq(schema.students.class, classCourse.class),
		),
	});
	if (!student) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not enrolled in the class for this course",
		});
	}
	// Check not already enrolled
	const existing = await db.query.studentCourseEnrollments.findFirst({
		where: and(
			eq(schema.studentCourseEnrollments.studentId, studentId),
			eq(schema.studentCourseEnrollments.classCourseId, classCourseId),
		),
	});
	if (existing) {
		return existing;
	}
	// Fetch required denormalized fields (unit credits come from teachingUnits)
	const courseDetails = await db
		.select({
			courseId: schema.classCourses.course,
			classId: schema.classCourses.class,
			academicYearId: schema.classes.academicYear,
			unitCredits: schema.teachingUnits.credits,
		})
		.from(schema.classCourses)
		.innerJoin(schema.classes, eq(schema.classes.id, schema.classCourses.class))
		.innerJoin(
			schema.courses,
			eq(schema.courses.id, schema.classCourses.course),
		)
		.innerJoin(
			schema.teachingUnits,
			eq(schema.teachingUnits.id, schema.courses.teachingUnitId),
		)
		.where(eq(schema.classCourses.id, classCourseId))
		.limit(1);

	const details = courseDetails[0];
	if (!details) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Course details not found",
		});
	}
	const [created] = await db
		.insert(schema.studentCourseEnrollments)
		.values({
			studentId,
			classCourseId,
			courseId: details.courseId,
			sourceClassId: details.classId,
			academicYearId: details.academicYearId,
			creditsAttempted: details.unitCredits,
			status: "active",
			attempt: 1,
		})
		.returning();
	return created;
}

export async function studentSelfUnenroll(
	studentId: string,
	classCourseId: string,
	institutionId: string,
) {
	const classCourse = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
		with: { classRef: true },
	});
	if (!classCourse) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
	}
	const window = await windowsRepo.findWindow(
		classCourse.class,
		classCourse.classRef.academicYear,
		institutionId,
	);
	if (!window || window.status !== "open") {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "Enrollment window is closed — cannot unenroll",
		});
	}
	const existing = await db.query.studentCourseEnrollments.findFirst({
		where: and(
			eq(schema.studentCourseEnrollments.studentId, studentId),
			eq(schema.studentCourseEnrollments.classCourseId, classCourseId),
		),
	});
	if (!existing) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "No enrollment found for this course",
		});
	}
	await db
		.update(schema.studentCourseEnrollments)
		.set({ status: "withdrawn" })
		.where(eq(schema.studentCourseEnrollments.id, existing.id));
	return { success: true };
}

export async function getStudentDecision(
	domainUserId: string,
	institutionId: string,
) {
	// domainUserId (ctx.profile.id) → student.id (FK in deliberationStudentResults)
	const student = await db.query.students.findFirst({
		where: and(
			eq(schema.students.domainUserId, domainUserId),
			eq(schema.students.institutionId, institutionId),
		),
	});
	if (!student) return [];

	const results = await db.query.deliberationStudentResults.findMany({
		where: eq(schema.deliberationStudentResults.studentId, student.id),
		with: {
			deliberation: {
				with: { classRef: true, academicYear: true },
			},
		},
		orderBy: (t, { desc }) => [desc(t.createdAt)],
	});
	return results
		.filter((r) => r.deliberation.closedAt !== null)
		.map((r) => ({
			id: r.id,
			deliberationId: r.deliberationId,
			academicYear: r.deliberation.academicYear?.name ?? null,
			className: r.deliberation.classRef?.name ?? null,
			generalAverage: r.generalAverage,
			totalCreditsEarned: r.totalCreditsEarned,
			totalCreditsPossible: r.totalCreditsPossible,
			finalDecision: r.finalDecision,
			autoDecision: r.autoDecision,
			isOverridden: r.isOverridden,
			mention: r.mention,
			rank: r.rank,
			ueResults: r.ueResults,
			closedAt: r.deliberation.closedAt,
		}));
}

export async function getCohortAnalytics(
	institutionId: string,
	opts: { classId?: string; academicYearId?: string },
) {
	// Get all classes for this institution (optionally filtered)
	const classWhere = opts.classId
		? and(
				eq(schema.classes.institutionId, institutionId),
				eq(schema.classes.id, opts.classId),
			)
		: opts.academicYearId
			? and(
					eq(schema.classes.institutionId, institutionId),
					eq(schema.classes.academicYear, opts.academicYearId),
				)
			: eq(schema.classes.institutionId, institutionId);

	const classes = await db.query.classes.findMany({
		where: classWhere,
		with: {
			academicYear: true,
			students: true,
		},
		limit: 50,
	});

	const cohorts = await Promise.all(
		classes.map(async (cls) => {
			const studentIds = cls.students.map((s) => s.id);
			const totalStudents = studentIds.length;

			// Count exams by status
			const examStats = await db
				.select({
					status: schema.exams.status,
					cnt: count(),
				})
				.from(schema.exams)
				.innerJoin(
					schema.classCourses,
					eq(schema.classCourses.id, schema.exams.classCourse),
				)
				.where(
					and(
						eq(schema.classCourses.class, cls.id),
						eq(schema.exams.institutionId, institutionId),
					),
				)
				.groupBy(schema.exams.status);

			const examsByStatus = Object.fromEntries(
				examStats.map((r) => [r.status, Number(r.cnt)]),
			);
			const totalExams = examStats.reduce((s, r) => s + Number(r.cnt), 0);
			const approvedExams = examsByStatus.approved ?? 0;
			const submittedExams = examsByStatus.submitted ?? 0;
			const gradingProgress =
				totalExams > 0
					? Math.round(((approvedExams + submittedExams) / totalExams) * 100)
					: 0;

			// Get average from deliberation results if available
			let avgGeneral: number | null = null;
			let admittedCount = 0;
			if (totalStudents > 0) {
				const allResults = await db.query.deliberationStudentResults.findMany({
					where: (t, { inArray: inArr }) => inArr(t.studentId, studentIds),
					columns: {
						generalAverage: true,
						finalDecision: true,
					},
				});
				if (allResults.length > 0) {
					const validAvgs = allResults
						.map((r) => r.generalAverage)
						.filter((a): a is number => a !== null);
					avgGeneral =
						validAvgs.length > 0
							? validAvgs.reduce((s, v) => s + v, 0) / validAvgs.length
							: null;
					admittedCount = allResults.filter(
						(r) =>
							r.finalDecision === "admitted" ||
							r.finalDecision === "compensated",
					).length;
				}
			}

			return {
				classId: cls.id,
				className: cls.name,
				academicYear: cls.academicYear?.name ?? null,
				totalStudents,
				totalExams,
				approvedExams,
				submittedExams,
				gradingProgress,
				avgGeneral,
				admittedCount,
				successRate:
					totalStudents > 0
						? Math.round((admittedCount / totalStudents) * 100)
						: null,
			};
		}),
	);

	return cohorts;
}

export async function closeExpiredApprovedExams() {
	const staleExams = await db.query.exams.findMany({
		where: (t, { and, eq, lt }) =>
			and(
				eq(t.status, "approved"),
				eq(t.isLocked, false),
				lt(t.date, new Date()),
			),
		limit: 20,
	});
	for (const exam of staleExams) {
		await examsService.setLock(exam.id, true, exam.institutionId);
		await notifications.registerWorkflowAlert("exam_locked", {
			examId: exam.id,
		});
	}
	return staleExams.length;
}

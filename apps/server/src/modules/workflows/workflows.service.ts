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
	await requireExam(examId, institutionId);
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
		institutionId,
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
	await notifications.registerWorkflowAlert(
		`enrollment_${nextStatus}`,
		{ classId, academicYearId, status: nextStatus },
		null,
		institutionId,
	);
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
		institutionId,
	);
	return { status: "queued" };
}

export async function rejectGrades(
	examId: string,
	reason: string,
	rejectorId: string | null | undefined,
	institutionId: string,
) {
	await requireExam(examId, institutionId);
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
		institutionId,
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
				with: {
					classRef: {
						with: { program: true, cycleLevel: { with: { cycle: true } } },
					},
					academicYear: true,
				},
			},
		},
		orderBy: (t, { desc }) => [desc(t.createdAt)],
	});
	// Outcome of the year: a graduate left the last level of the cycle.
	const enrollments = await db.query.enrollments.findMany({
		where: eq(schema.enrollments.studentId, student.id),
	});
	const statusOf = (classId: string, academicYearId: string) =>
		enrollments.find(
			(e) => e.classId === classId && e.academicYearId === academicYearId,
		)?.status ?? null;
	return results
		.filter((r) => r.deliberation.closedAt !== null)
		.map((r) => ({
			id: r.id,
			deliberationId: r.deliberationId,
			academicYear: r.deliberation.academicYear?.name ?? null,
			className: r.deliberation.classRef?.name ?? null,
			programName: r.deliberation.classRef?.program?.name ?? null,
			cycleName: r.deliberation.classRef?.cycleLevel?.cycle?.name ?? null,
			enrollmentStatus: statusOf(
				r.deliberation.classId,
				r.deliberation.academicYearId,
			),
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

/**
 * Per-class figures of the dean dashboard, for one academic year (the active
 * one by default). Definitions match the statistics page:
 * - students: enrollments of the class for its year;
 * - grading progress: (approved + submitted) / all exams of the class, null
 *   when the class has no exam;
 * - average and pass rate: those of the class's deliberation of that year
 *   (annual first, then the most advanced), null when it has none. Pass rate =
 *   (admitted + compensated) / deliberated students.
 */
export async function getCohortAnalytics(
	institutionId: string,
	opts: { classId?: string; academicYearId?: string },
) {
	let academicYearId = opts.academicYearId;
	if (!academicYearId && !opts.classId) {
		const active = await db.query.academicYears.findFirst({
			where: and(
				eq(schema.academicYears.institutionId, institutionId),
				eq(schema.academicYears.isActive, true),
			),
		});
		academicYearId = active?.id;
	}

	const classes = await db.query.classes.findMany({
		where: and(
			eq(schema.classes.institutionId, institutionId),
			opts.classId ? eq(schema.classes.id, opts.classId) : undefined,
			academicYearId
				? eq(schema.classes.academicYear, academicYearId)
				: undefined,
		),
		with: { academicYear: true },
		orderBy: (c, { asc }) => asc(c.name),
		limit: 200,
	});

	const statusRank: Record<string, number> = {
		signed: 4,
		closed: 3,
		open: 2,
		draft: 1,
	};

	return Promise.all(
		classes.map(async (cls) => {
			const yearId = cls.academicYear?.id ?? "";
			const [enrolled] = await db
				.select({ cnt: count() })
				.from(schema.enrollments)
				.where(
					and(
						eq(schema.enrollments.classId, cls.id),
						eq(schema.enrollments.academicYearId, yearId),
					),
				);
			const totalStudents = Number(enrolled?.cnt ?? 0);

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
					: null;

			// The class's deliberation of its year: annual first, most advanced
			const deliberations = await db.query.deliberations.findMany({
				where: and(
					eq(schema.deliberations.classId, cls.id),
					eq(schema.deliberations.academicYearId, yearId),
				),
			});
			const delib = deliberations
				.filter((d) => d.stats)
				.sort(
					(a, b) =>
						Number(b.type === "annual") - Number(a.type === "annual") ||
						(statusRank[b.status] ?? 0) - (statusRank[a.status] ?? 0) ||
						b.createdAt.getTime() - a.createdAt.getTime(),
				)[0];
			const stats = delib?.stats as
				| {
						totalStudents?: number;
						admittedCount?: number;
						compensatedCount?: number;
						classAverage?: number | null;
				  }
				| undefined;
			const deliberatedCount = stats?.totalStudents ?? 0;
			const admittedCount =
				(stats?.admittedCount ?? 0) + (stats?.compensatedCount ?? 0);

			return {
				classId: cls.id,
				className: cls.name,
				academicYear: cls.academicYear?.name ?? null,
				totalStudents,
				totalExams,
				approvedExams,
				submittedExams,
				gradingProgress,
				deliberationStatus: delib?.status ?? null,
				avgGeneral: stats?.classAverage ?? null,
				deliberatedCount,
				admittedCount,
				successRate:
					delib && deliberatedCount > 0
						? Math.round((admittedCount / deliberatedCount) * 1000) / 10
						: null,
			};
		}),
	);
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
		await notifications.registerWorkflowAlert(
			"exam_locked",
			{ examId: exam.id },
			null,
			exam.institutionId,
		);
	}
	return staleExams.length;
}

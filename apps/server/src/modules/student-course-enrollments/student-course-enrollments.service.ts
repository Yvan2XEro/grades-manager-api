import { TRPCError } from "@trpc/server";
import { and, eq, inArray, ne } from "drizzle-orm";
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

type AutoEnrollClassInput = {
	classId: string;
	academicYearId: string;
	semesterId?: string;
	status?: schema.StudentCourseEnrollmentStatus;
};

const FINAL_STATUSES: schema.StudentCourseEnrollmentStatus[] = [
	"completed",
	"failed",
	"withdrawn",
];
const SATISFIED_STATUSES: schema.StudentCourseEnrollmentStatus[] = [
	"completed",
];
const IN_PROGRESS_STATUSES: schema.StudentCourseEnrollmentStatus[] = [
	"planned",
	"active",
];
type PrerequisiteWarningState = "missing" | "in-progress";
type PrerequisiteWarning = {
	studentId: string;
	targetCourseId: string;
	targetCourseCode: string;
	targetCourseName: string;
	prerequisiteCourseId: string;
	prerequisiteCourseCode: string;
	prerequisiteCourseName: string;
	prerequisiteType: schema.CoursePrerequisiteType;
	state: PrerequisiteWarningState;
};
type EnrollmentWithWarnings = {
	record: schema.StudentCourseEnrollment;
	warnings: PrerequisiteWarning[];
};

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
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Student not found",
		});
	}
	return row;
}

async function fetchClassCourseContext(classCourseId: string) {
	const [row] = await db
		.select({
			id: schema.classCourses.id,
			classId: schema.classCourses.class,
			courseId: schema.classCourses.course,
			courseCode: schema.courses.code,
			courseName: schema.courses.name,
			teacherId: schema.classCourses.teacher,
			classProgramId: schema.classes.program,
			academicYearId: schema.classes.academicYear,
			courseProgramId: schema.courses.program,
			unitCredits: schema.teachingUnits.credits,
		})
		.from(schema.classCourses)
		.innerJoin(schema.classes, eq(schema.classCourses.class, schema.classes.id))
		.innerJoin(
			schema.courses,
			eq(schema.classCourses.course, schema.courses.id),
		)
		.innerJoin(
			schema.teachingUnits,
			eq(schema.courses.teachingUnitId, schema.teachingUnits.id),
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

async function collectPrerequisiteWarnings(
	studentId: string,
	classCourse: Awaited<ReturnType<typeof fetchClassCourseContext>>,
) {
	const prerequisites = await repo.listCoursePrerequisites(
		classCourse.courseId,
	);
	if (!prerequisites.length) return [];
	const prerequisiteCourseIds = prerequisites.map(
		(prereq) => prereq.prerequisiteCourseId,
	);
	const history = await repo.findStudentCourseHistoryForCourses(
		studentId,
		prerequisiteCourseIds,
	);
	const warnings: PrerequisiteWarning[] = [];
	for (const prereq of prerequisites) {
		const records = history.filter(
			(entry) => entry.courseId === prereq.prerequisiteCourseId,
		);
		const satisfied = records.some((record) =>
			SATISFIED_STATUSES.includes(record.status),
		);
		if (satisfied) continue;
		const inProgress = records.some((record) =>
			IN_PROGRESS_STATUSES.includes(record.status),
		);
		warnings.push({
			studentId,
			targetCourseId: classCourse.courseId,
			targetCourseCode: classCourse.courseCode,
			targetCourseName: classCourse.courseName,
			prerequisiteCourseId: prereq.prerequisiteCourseId,
			prerequisiteCourseCode: prereq.prerequisiteCourseCode,
			prerequisiteCourseName: prereq.prerequisiteCourseName,
			prerequisiteType: prereq.type,
			state: inProgress ? "in-progress" : "missing",
		});
	}
	return warnings;
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

async function findLatestEnrollment(input: {
	studentId: string;
	courseId: string;
	academicYearId: string;
}) {
	return db.query.studentCourseEnrollments.findFirst({
		where: and(
			eq(schema.studentCourseEnrollments.studentId, input.studentId),
			eq(schema.studentCourseEnrollments.courseId, input.courseId),
			eq(schema.studentCourseEnrollments.academicYearId, input.academicYearId),
		),
		orderBy: (enrollments, { desc }) => desc(enrollments.attempt),
	});
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

export async function createEnrollment(
	input: CreateInput,
): Promise<EnrollmentWithWarnings> {
	const status = input.status ?? "planned";
	const student = await fetchStudentContext(input.studentId);
	const classCourse = await fetchClassCourseContext(input.classCourseId);
	await ensureSameProgram(student.programId, classCourse.courseProgramId);
	const warnings = await collectPrerequisiteWarnings(student.id, classCourse);
	let attempt = input.attempt;
	if (attempt === undefined) {
		const latest = await findLatestEnrollment({
			studentId: student.id,
			courseId: classCourse.courseId,
			academicYearId: classCourse.academicYearId,
		});
		if (!latest) {
			attempt = 1;
		} else {
			if (!FINAL_STATUSES.includes(latest.status)) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Student already has an active enrollment for this course",
				});
			}
			attempt = latest.attempt + 1;
		}
	} else {
		await assertAttemptAvailability({
			studentId: student.id,
			courseId: classCourse.courseId,
			academicYearId: classCourse.academicYearId,
			attempt,
		});
	}
	const payload: schema.NewStudentCourseEnrollment = {
		studentId: student.id,
		classCourseId: classCourse.id,
		courseId: classCourse.courseId,
		sourceClassId: classCourse.classId,
		academicYearId: classCourse.academicYearId,
		status,
		attempt,
		creditsAttempted: classCourse.unitCredits,
		creditsEarned: resolveCreditsEarned(status, classCourse.unitCredits),
		completedAt: resolveCompletionTimestamp(status),
	};
	const record = await repo.create(payload);
	// Ensure a ledger row exists (credits will be computed from grades, not enrollment status)
	await creditLedger.ensureLedger(record.studentId, record.academicYearId);
	return { record, warnings };
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
	const created: EnrollmentWithWarnings[] = [];
	const skipped: { classCourseId: string; reason: string }[] = [];
	for (const classCourseId of uniqueCourseIds) {
		try {
			const result = await createEnrollment({
				studentId: input.studentId,
				classCourseId,
				status,
				attempt: input.attempt,
			});
			created.push(result);
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
	institutionId: string,
	status: schema.StudentCourseEnrollmentStatus,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	const payload: Partial<schema.NewStudentCourseEnrollment> = {
		status,
		creditsEarned: resolveCreditsEarned(status, existing.creditsAttempted),
		completedAt: resolveCompletionTimestamp(status),
	};
	if (status === "active" && existing.startedAt === null) {
		payload.startedAt = new Date();
	}
	const updated = await repo.update(id, institutionId, payload);
	return updated;
}

export async function closeForStudent(
	input: CloseInput,
	institutionId: string,
) {
	const status = input.status ?? "withdrawn";
	const activeRecords = await repo.findByStudentAndStatuses(input.studentId, [
		"planned",
		"active",
	]);
	for (const record of activeRecords) {
		await updateStatus(record.id, institutionId, status);
	}
	return activeRecords.length;
}

export async function list(
	opts: Parameters<typeof repo.list>[1],
	institutionId: string,
) {
	return repo.list(institutionId, opts);
}

export async function getById(id: string, institutionId: string) {
	const item = await repo.findById(id, institutionId);
	if (!item) throw new TRPCError({ code: "NOT_FOUND" });
	return item;
}

/**
 * Puts the students enrolled in a class that year on the roster of the
 * class's courses: a student of a class takes its courses. Only missing
 * (student, course, year) pairs are added, so a student withdrawn or exempted
 * from a course stays off it, and the call is safe to repeat.
 *
 * Scope it with `classCourseIds` (a course just added to a class), or with
 * `classIds` (+ `studentIds` for students just enrolled in a class).
 * Returns the number of course enrollments created.
 */
export async function syncClassRosters(scope: {
	classIds?: string[];
	classCourseIds?: string[];
	studentIds?: string[];
}) {
	if (!scope.classIds?.length && !scope.classCourseIds?.length) return 0;
	if (scope.studentIds && scope.studentIds.length === 0) return 0;
	const classCourses = await db
		.select({
			id: schema.classCourses.id,
			classId: schema.classCourses.class,
			courseId: schema.classCourses.course,
			academicYearId: schema.classes.academicYear,
			credits: schema.teachingUnits.credits,
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
		.where(
			scope.classCourseIds?.length
				? inArray(schema.classCourses.id, scope.classCourseIds)
				: inArray(schema.classCourses.class, scope.classIds ?? []),
		);
	if (!classCourses.length) return 0;
	const classIds = [...new Set(classCourses.map((cc) => cc.classId))];
	const enrollments = await db
		.select({
			studentId: schema.enrollments.studentId,
			classId: schema.enrollments.classId,
			academicYearId: schema.enrollments.academicYearId,
		})
		.from(schema.enrollments)
		.where(
			and(
				inArray(schema.enrollments.classId, classIds),
				ne(schema.enrollments.status, "withdrawn"),
				scope.studentIds
					? inArray(schema.enrollments.studentId, scope.studentIds)
					: undefined,
			),
		);
	if (!enrollments.length) return 0;
	const studentIds = [...new Set(enrollments.map((e) => e.studentId))];
	const courseIds = [...new Set(classCourses.map((cc) => cc.courseId))];
	const existing = await db
		.select({
			studentId: schema.studentCourseEnrollments.studentId,
			courseId: schema.studentCourseEnrollments.courseId,
			academicYearId: schema.studentCourseEnrollments.academicYearId,
		})
		.from(schema.studentCourseEnrollments)
		.where(
			and(
				inArray(schema.studentCourseEnrollments.studentId, studentIds),
				inArray(schema.studentCourseEnrollments.courseId, courseIds),
			),
		);
	const key = (studentId: string, courseId: string, yearId: string) =>
		`${studentId}|${courseId}|${yearId}`;
	const taken = new Set(
		existing.map((e) => key(e.studentId, e.courseId, e.academicYearId)),
	);
	const rows: schema.NewStudentCourseEnrollment[] = [];
	for (const enrollment of enrollments) {
		for (const cc of classCourses) {
			// The enrollment in that class for the class's own year only
			if (cc.classId !== enrollment.classId) continue;
			if (cc.academicYearId !== enrollment.academicYearId) continue;
			const k = key(enrollment.studentId, cc.courseId, cc.academicYearId);
			if (taken.has(k)) continue;
			taken.add(k);
			rows.push({
				studentId: enrollment.studentId,
				classCourseId: cc.id,
				courseId: cc.courseId,
				sourceClassId: cc.classId,
				academicYearId: cc.academicYearId,
				status: "active",
				attempt: 1,
				creditsAttempted: cc.credits,
			});
		}
	}
	if (!rows.length) return 0;
	let created = 0;
	for (let i = 0; i < rows.length; i += 500) {
		const inserted = await db
			.insert(schema.studentCourseEnrollments)
			.values(rows.slice(i, i + 500))
			.onConflictDoNothing()
			.returning({ id: schema.studentCourseEnrollments.id });
		created += inserted.length;
	}
	const ledgers = new Map(
		rows.map((row) => [`${row.studentId}|${row.academicYearId}`, row]),
	);
	for (const row of ledgers.values()) {
		await creditLedger.ensureLedger(row.studentId, row.academicYearId);
	}
	return created;
}

/** Error message (a code the web translates) of a course without students. */
export const NO_STUDENTS_ERROR = "EXAM_NO_STUDENTS";

/**
 * An exam needs students: brings the class's students onto the course's
 * roster (courses added before or after the students), then refuses a course
 * nobody is enrolled in.
 */
export async function ensureRosterForClassCourse(classCourseId: string) {
	await syncClassRosters({ classCourseIds: [classCourseId] });
	const count = await repo.countRosterForClassCourse(classCourseId);
	if (count === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: NO_STUDENTS_ERROR,
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

export async function autoEnrollClass(
	input: AutoEnrollClassInput,
	opts?: { institutionId?: string; checkFeeGate?: boolean },
) {
	const klass = await db.query.classes.findFirst({
		where: eq(schema.classes.id, input.classId),
		columns: {
			id: true,
			academicYear: true,
		},
	});
	if (!klass) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
	}
	if (klass.academicYear !== input.academicYearId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Class is not attached to the provided academic year",
		});
	}
	// Students enrolled in the class that year — not their current class,
	// which differs for any past year
	const students = await db
		.selectDistinct({ id: schema.enrollments.studentId })
		.from(schema.enrollments)
		.where(
			and(
				eq(schema.enrollments.classId, klass.id),
				eq(schema.enrollments.academicYearId, input.academicYearId),
				ne(schema.enrollments.status, "withdrawn"),
			),
		);
	const baseCondition = eq(schema.classCourses.class, klass.id);
	const classCourseCondition = input.semesterId
		? and(baseCondition, eq(schema.classCourses.semesterId, input.semesterId))
		: baseCondition;
	const classCourses = await db
		.select({ id: schema.classCourses.id })
		.from(schema.classCourses)
		.where(classCourseCondition);
	if (!classCourses.length) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "No class courses found for this selection",
		});
	}
	if (!students.length) {
		return {
			studentsCount: 0,
			classCoursesCount: classCourses.length,
			createdCount: 0,
			skippedCount: 0,
			conflicts: [] as Array<{
				studentId: string;
				classCourseId: string;
			}>,
			warnings: [] as PrerequisiteWarning[],
		};
	}
	const status = input.status ?? "active";
	const conflicts: Array<{ studentId: string; classCourseId: string }> = [];
	const warnings: PrerequisiteWarning[] = [];
	const feeBlockedStudentIds = new Set<string>();

	// If fee gate enabled, check clearance per student (skip non-cleared ones)
	if (opts?.checkFeeGate && opts.institutionId) {
		const { findAssignmentForStudent } = await import(
			"../fee-clearance/fee-clearance.repo"
		);
		for (const student of students) {
			const assignment = await findAssignmentForStudent(
				student.id,
				input.academicYearId,
				opts.institutionId,
			);
			if (
				assignment &&
				assignment.status !== "paid" &&
				assignment.status !== "exempt"
			) {
				feeBlockedStudentIds.add(student.id);
			}
		}
	}

	let createdCount = 0;
	for (const student of students) {
		if (feeBlockedStudentIds.has(student.id)) {
			conflicts.push(
				...classCourses.map((cc) => ({
					studentId: student.id,
					classCourseId: cc.id,
				})),
			);
			continue;
		}
		for (const classCourse of classCourses) {
			try {
				const { warnings: localWarnings } = await createEnrollment({
					studentId: student.id,
					classCourseId: classCourse.id,
					status,
				});
				createdCount++;
				if (localWarnings.length) {
					warnings.push(...localWarnings);
				}
			} catch (error) {
				if (error instanceof TRPCError && error.code === "CONFLICT") {
					conflicts.push({
						studentId: student.id,
						classCourseId: classCourse.id,
					});
					continue;
				}
				throw error;
			}
		}
	}
	return {
		studentsCount: students.length,
		classCoursesCount: classCourses.length,
		createdCount,
		skippedCount: conflicts.length,
		conflicts,
		warnings,
	};
}

import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { normalizeCode } from "@/lib/strings";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { notFound } from "../_shared/errors";
import type { MemberRole } from "../authz";
import * as classesRepo from "../classes/classes.repo";
import * as coursesRepo from "../courses/courses.repo";
import {
	isUnassignedTeacherEmail,
	unassignedTeacher,
} from "../domain-users/unassigned-teacher";
import * as examsService from "../exams/exams.service";
import * as courseEnrollments from "../student-course-enrollments/student-course-enrollments.service";
import * as repo from "./class-courses.repo";

type ClassCourseInput = Omit<
	schema.NewClassCourse,
	"institutionId" | "coefficient"
> & {
	coefficient?: number;
	allowTeacherOverride?: boolean;
};

type TeacherOverviewSourceItem = Awaited<
	ReturnType<typeof repo.list>
>["items"][number] & {
	isDelegated?: boolean;
};

export type TeacherOverviewExam = {
	id: string;
	name: string;
	type: string;
	date: string;
	percentage: number;
	isLocked: boolean;
	status: string;
	canEdit: boolean;
	classCourseId: string;
	/** Grades entered so far, and their average (null when none). */
	gradedCount: number;
	average: number | null;
};

export type TeacherOverviewCourse = {
	classCourseId: string;
	courseName: string;
	className: string;
	programName: string;
	studentCount: number;
	exams: TeacherOverviewExam[];
	isDelegated: boolean;
	semesterId: string | null;
	semesterName: string | null;
	/**
	 * Half of the academic year the course is taught in: odd semesters
	 * (S1, S3, S5) and fall units are the first, even ones and spring units
	 * the second; null for annual courses.
	 */
	yearHalf: "first" | "second" | null;
};

function courseYearHalf(
	semesterOrder: number | undefined,
	ueSemester: string | null | undefined,
): TeacherOverviewCourse["yearHalf"] {
	if (semesterOrder !== undefined) {
		return semesterOrder % 2 === 1 ? "first" : "second";
	}
	if (ueSemester === "fall") return "first";
	if (ueSemester === "spring") return "second";
	return null;
}

async function validateConfig(
	config: Pick<schema.NewClassCourse, "class" | "course" | "semesterId">,
	institutionId: string,
	existingId?: string,
) {
	const klass = await classesRepo.findById(config.class, institutionId);
	if (!klass) throw notFound("Class not found");
	const course = await coursesRepo.findById(config.course, institutionId);
	if (!course) throw notFound("Course not found");
	const courseProgram = await db.query.programs.findFirst({
		where: eq(schema.programs.id, course.program),
	});
	if (!courseProgram || courseProgram.institutionId !== klass.institutionId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Course not found in this institution",
		});
	}
	if (klass.program !== course.program) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Class and course must belong to the same program",
		});
	}

	// Check if course is already assigned to this class
	const existingAssignments = await repo.list({
		classId: config.class,
		courseId: config.course,
		limit: 1,
		institutionId: klass.institutionId,
	});

	// If we found an assignment and it's not the one we're updating, throw error
	if (
		existingAssignments.items.length > 0 &&
		existingAssignments.items[0].id !== existingId
	) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Course "${course.name}" is already assigned to this class. Each course can only be assigned once per class.`,
		});
	}

	const prereqs = await db
		.select({
			prerequisiteCourseId: schema.coursePrerequisites.prerequisiteCourseId,
		})
		.from(schema.coursePrerequisites)
		.where(eq(schema.coursePrerequisites.courseId, config.course));

	if (prereqs.length > 0) {
		const existing = await repo.list({
			classId: config.class,
			limit: 200,
			institutionId: klass.institutionId,
		});
		const assigned = new Set(existing.items.map((cc) => cc.course));
		for (const prereq of prereqs) {
			if (!assigned.has(prereq.prerequisiteCourseId)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Prerequisite courses must be assigned before this course",
				});
			}
		}
	}

	const resolvedSemesterId = await resolveSemesterId(
		klass.semesterId,
		config.semesterId,
	);

	return { semesterId: resolvedSemesterId, klass };
}

async function resolveSemesterId(
	classSemesterId?: string | null,
	overrideSemesterId?: string | null,
) {
	const target = overrideSemesterId ?? classSemesterId;
	if (!target) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Class must have a semester before assigning courses",
		});
	}
	const semester = await db.query.semesters.findFirst({
		where: eq(schema.semesters.id, target),
	});
	if (!semester) throw notFound("Semester not found");
	return semester.id;
}

export async function createClassCourse(
	data: Omit<ClassCourseInput, "teacher"> & { teacher?: string | null },
	institutionId: string,
) {
	const { allowTeacherOverride, ...payload } = data;
	const { semesterId, klass } = await validateConfig(payload, institutionId);
	const resolvedInstitutionId = klass.institutionId ?? institutionId;
	// No teacher given: the course's default one, else "not known yet" — the
	// course is added anyway and shows as without teacher until one is set
	let teacher = payload.teacher || null;
	if (!teacher) {
		const course = await coursesRepo.findById(payload.course, institutionId);
		teacher =
			course?.defaultTeacher ??
			(await unassignedTeacher(resolvedInstitutionId));
	}
	const created = await repo.create({
		...payload,
		teacher,
		institutionId: resolvedInstitutionId,
		code: normalizeCode(payload.code),
		coefficient:
			payload.coefficient !== undefined
				? payload.coefficient.toString()
				: undefined,
		semesterId,
	});
	// The class's students take the course
	if (created) {
		await courseEnrollments.syncClassRosters({ classCourseIds: [created.id] });
	}
	return created;
}

export async function updateClassCourse(
	id: string,
	data: Partial<ClassCourseInput>,
	institutionId: string,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound();
	const { allowTeacherOverride, ...payload } = data;
	const merged = {
		...existing,
		...payload,
	};
	const { semesterId, klass } = await validateConfig(
		merged as Omit<schema.NewClassCourse, "institutionId">,
		institutionId,
		id,
	);
	const resolvedInstitutionId = klass.institutionId ?? institutionId;
	return repo.update(
		id,
		{
			...payload,
			code: payload.code ? normalizeCode(payload.code) : undefined,
			coefficient:
				payload.coefficient !== undefined
					? payload.coefficient.toString()
					: undefined,
			semesterId: payload.semesterId ? semesterId : undefined,
			institutionId: resolvedInstitutionId,
		},
		institutionId,
	);
}

export async function deleteClassCourse(id: string, institutionId: string) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound();
	await repo.remove(id, institutionId);
}

export async function listClassCourses(
	opts: Omit<Parameters<typeof repo.list>[0], "institutionId">,
	institutionId: string,
) {
	return repo.list({ ...opts, institutionId });
}

export async function getClassCourseById(id: string, institutionId: string) {
	const item = await repo.findById(id, institutionId);
	if (!item) throw notFound();
	const teacher = await db.query.domainUsers.findFirst({
		where: eq(schema.domainUsers.id, item.teacher),
		columns: { primaryEmail: true },
	});
	return {
		...item,
		hasTeacher: !isUnassignedTeacherEmail(teacher?.primaryEmail),
	};
}

export async function getClassCourseByCode(
	code: string,
	academicYearId: string,
	institutionId: string,
) {
	const item = await repo.findByCode(
		normalizeCode(code),
		academicYearId,
		institutionId,
	);
	if (!item) throw notFound();
	return item;
}

const ROSTER_STATUSES: schema.StudentCourseEnrollmentStatus[] = [
	"planned",
	"active",
	"completed",
	"failed",
];

export async function getClassCourseRoster(
	classCourseId: string,
	institutionId: string,
) {
	const classCourse = await repo.findById(classCourseId, institutionId);
	if (!classCourse) throw notFound();
	const students = await db
		.select({
			id: schema.students.id,
			registrationNumber: schema.students.registrationNumber,
			status: schema.studentCourseEnrollments.status,
			firstName: schema.domainUsers.firstName,
			lastName: schema.domainUsers.lastName,
		})
		.from(schema.studentCourseEnrollments)
		.innerJoin(
			schema.students,
			eq(schema.studentCourseEnrollments.studentId, schema.students.id),
		)
		.innerJoin(
			schema.domainUsers,
			eq(schema.students.domainUserId, schema.domainUsers.id),
		)
		.where(
			and(
				eq(schema.studentCourseEnrollments.classCourseId, classCourseId),
				inArray(schema.studentCourseEnrollments.status, ROSTER_STATUSES),
			),
		)
		.orderBy(schema.domainUsers.lastName, schema.domainUsers.firstName);
	return {
		classCourseId,
		students,
	};
}

export async function listClassCoursesPaged(
	input: {
		page: number;
		pageSize: number;
		query?: string;
		classId?: string;
		academicYearId?: string;
		semesterId?: string;
		teacherId?: string;
		classCourseIds?: string[];
	},
	institutionId: string,
) {
	return repo.listPaged({ institutionId, ...input });
}

export async function searchClassCourses(
	opts: Omit<Parameters<typeof repo.search>[0], "institutionId">,
	institutionId: string,
) {
	return repo.search({ ...opts, institutionId });
}

export async function buildTeacherOverview(
	classCourses: TeacherOverviewSourceItem[],
	institutionId: string,
	actor: {
		profileId: string | null;
		memberRole: MemberRole | null;
	},
) {
	if (classCourses.length === 0) {
		return [] as TeacherOverviewCourse[];
	}

	const classCourseIds = classCourses.map((item) => item.id);
	const examResult = await examsService.listExams(
		{
			classCourseIds,
			limit: 5000,
		},
		{
			institutionId,
			profileId: actor.profileId,
			memberRole: actor.memberRole,
		},
	);

	// One aggregate query for every exam (the home page used to fetch the
	// grades of each exam separately: hundreds of requests for a teacher)
	const examIds = examResult.items.map((exam) => exam.id);
	const gradeStats = examIds.length
		? await db
				.select({
					examId: schema.grades.exam,
					count: sql<number>`count(*)::int`,
					average: sql<string | null>`avg(${schema.grades.score})`,
				})
				.from(schema.grades)
				.where(inArray(schema.grades.exam, examIds))
				.groupBy(schema.grades.exam)
		: [];
	const statsByExam = new Map(gradeStats.map((row) => [row.examId, row]));

	const examsByClassCourse = new Map<string, TeacherOverviewExam[]>();
	for (const exam of examResult.items) {
		const stats = statsByExam.get(exam.id);
		const bucket = examsByClassCourse.get(exam.classCourse) ?? [];
		bucket.push({
			id: exam.id,
			name: exam.name,
			type: exam.type,
			date: exam.date.toISOString(),
			percentage: Number(exam.percentage),
			isLocked: exam.isLocked,
			status: exam.status ?? (exam.isLocked ? "locked" : "open"),
			canEdit: exam.canEdit ?? false,
			classCourseId: exam.classCourse,
			gradedCount: Number(stats?.count ?? 0),
			average:
				stats?.average != null
					? Number(Number(stats.average).toFixed(2))
					: null,
		});
		examsByClassCourse.set(exam.classCourse, bucket);
	}

	const semesterIds = [
		...new Set(
			classCourses
				.map((item) => item.semesterId)
				.filter((id): id is string => Boolean(id)),
		),
	];
	const semesters = semesterIds.length
		? await db.query.semesters.findMany({
				where: inArray(schema.semesters.id, semesterIds),
			})
		: [];
	const semesterById = new Map(semesters.map((sem) => [sem.id, sem]));

	return classCourses.map((classCourse): TeacherOverviewCourse => {
		const semester = classCourse.semesterId
			? semesterById.get(classCourse.semesterId)
			: undefined;
		return {
			classCourseId: classCourse.id,
			courseName:
				classCourse.courseName ?? classCourse.courseCode ?? classCourse.course,
			className: classCourse.className ?? classCourse.class,
			programName: classCourse.programName ?? "",
			studentCount: classCourse.studentCount ?? 0,
			exams: examsByClassCourse.get(classCourse.id) ?? [],
			isDelegated: classCourse.isDelegated ?? false,
			semesterId: semester?.id ?? null,
			semesterName: semester?.name ?? null,
			yearHalf: courseYearHalf(semester?.orderIndex, classCourse.ueSemester),
		};
	});
}

import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { normalizeCode } from "@/lib/strings";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { notFound } from "../_shared/errors";
import * as classesRepo from "../classes/classes.repo";
import * as coursesRepo from "../courses/courses.repo";
import * as repo from "./class-courses.repo";

type ClassCourseInput = schema.NewClassCourse & {
	allowTeacherOverride?: boolean;
};

async function validateConfig(
	config: schema.NewClassCourse,
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
	if (config.weeklyHours > course.hours) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Weekly hours exceed course hours",
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
	classSemesterId?: string,
	overrideSemesterId?: string,
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
	data: ClassCourseInput,
	institutionId: string,
) {
	const { allowTeacherOverride, ...payload } = data;
	const { semesterId, klass } = await validateConfig(payload, institutionId);
	const resolvedInstitutionId = klass.institutionId ?? institutionId;
	return repo.create({
		...payload,
		institutionId: resolvedInstitutionId,
		code: normalizeCode(payload.code),
		semesterId,
	});
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
		merged as schema.NewClassCourse,
		institutionId,
		id,
	);
	const resolvedInstitutionId = klass.institutionId ?? institutionId;
	return repo.update(
		id,
		{
			...payload,
			code: payload.code ? normalizeCode(payload.code) : undefined,
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
	opts: Parameters<typeof repo.list>[0],
	institutionId: string,
) {
	return repo.list({ ...opts, institutionId });
}

export async function getClassCourseById(id: string, institutionId: string) {
	const item = await repo.findById(id, institutionId);
	if (!item) throw notFound();
	return item;
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

export async function searchClassCourses(
	opts: Parameters<typeof repo.search>[0],
	institutionId: string,
) {
	return repo.search({ ...opts, institutionId });
}

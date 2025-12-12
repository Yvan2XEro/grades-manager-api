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
	allowTeacherOverride = false,
) {
	const klass = await classesRepo.findById(config.class);
	if (!klass) throw notFound("Class not found");
	const course = await coursesRepo.findById(config.course);
	if (!course) throw notFound("Course not found");
	if (klass.program !== course.program) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Class and course must belong to the same program",
		});
	}
	if (config.teacher !== course.defaultTeacher && !allowTeacherOverride) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Teacher override requires approval",
		});
	}
	if (config.weeklyHours > course.hours) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Weekly hours exceed course hours",
		});
	}

	const prereqs = await db
		.select({
			prerequisiteCourseId: schema.coursePrerequisites.prerequisiteCourseId,
		})
		.from(schema.coursePrerequisites)
		.where(eq(schema.coursePrerequisites.courseId, config.course));

	if (prereqs.length > 0) {
		const existing = await repo.list({ classId: config.class, limit: 200 });
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

	return { semesterId: resolvedSemesterId };
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

export async function createClassCourse(data: ClassCourseInput) {
	const { allowTeacherOverride, ...payload } = data;
	const { semesterId } = await validateConfig(payload, allowTeacherOverride);
	return repo.create({
		...payload,
		code: normalizeCode(payload.code),
		semesterId,
	});
}

export async function updateClassCourse(
	id: string,
	data: Partial<ClassCourseInput>,
) {
	const existing = await repo.findById(id);
	if (!existing) throw notFound();
	const { allowTeacherOverride, ...payload } = data;
	const merged = {
		...existing,
		...payload,
	};
	const { semesterId } = await validateConfig(
		merged as schema.NewClassCourse,
		allowTeacherOverride,
	);
	return repo.update(id, {
		...payload,
		code: payload.code ? normalizeCode(payload.code) : undefined,
		semesterId: payload.semesterId ? semesterId : undefined,
	});
}

export async function deleteClassCourse(id: string) {
	await repo.remove(id);
}

export async function listClassCourses(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}

export async function getClassCourseById(id: string) {
	const item = await repo.findById(id);
	if (!item) throw notFound();
	return item;
}

export async function getClassCourseByCode(
	code: string,
	academicYearId: string,
) {
	const item = await repo.findByCode(normalizeCode(code), academicYearId);
	if (!item) throw notFound();
	return item;
}

const ROSTER_STATUSES: schema.StudentCourseEnrollmentStatus[] = [
	"planned",
	"active",
	"completed",
	"failed",
];

export async function getClassCourseRoster(classCourseId: string) {
	const classCourse = await repo.findById(classCourseId);
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

export async function searchClassCourses(opts: Parameters<typeof repo.search>[0]) {
	return repo.search(opts);
}

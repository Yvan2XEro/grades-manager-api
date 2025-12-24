import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { normalizeCode } from "@/lib/strings";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { notFound } from "../_shared/errors";
import * as repo from "./courses.repo";

type CourseInput = schema.NewCourse & {
	prerequisiteCourseIds?: string[];
};

async function ensureTeachingUnit(
	teachingUnitId: string,
	programId: string,
	institutionId: string,
) {
	const result = await db
		.select()
		.from(schema.teachingUnits)
		.innerJoin(
			schema.programs,
			eq(schema.teachingUnits.programId, schema.programs.id),
		)
		.where(
			and(
				eq(schema.teachingUnits.id, teachingUnitId),
				eq(schema.programs.institutionId, institutionId),
			),
		)
		.limit(1);
	const unit = result[0]?.teaching_units;
	if (!unit) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Teaching unit not found",
		});
	}
	if (unit.programId !== programId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Teaching unit does not belong to the selected program",
		});
	}
	return unit;
}

async function syncPrerequisites(
	courseId: string,
	prerequisiteCourseIds?: string[],
) {
	if (!prerequisiteCourseIds) return;
	await db
		.delete(schema.coursePrerequisites)
		.where(eq(schema.coursePrerequisites.courseId, courseId));
	const sanitized = prerequisiteCourseIds.filter((id) => id && id !== courseId);
	if (!sanitized.length) return;
	await db.insert(schema.coursePrerequisites).values(
		sanitized.map((prereqId) => ({
			courseId,
			prerequisiteCourseId: prereqId,
		})),
	);
}

export async function createCourse(data: CourseInput, institutionId: string) {
	const { prerequisiteCourseIds, ...courseData } = data;
	await ensureTeachingUnit(
		courseData.teachingUnitId,
		courseData.program,
		institutionId,
	);
	const created = await repo.create({
		...courseData,
		code: normalizeCode(courseData.code),
	});
	await syncPrerequisites(created.id, prerequisiteCourseIds);
	return created;
}

export async function updateCourse(
	id: string,
	institutionId: string,
	data: Partial<CourseInput>,
) {
	const { prerequisiteCourseIds, ...courseData } = data;
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound();
	if (
		(courseData.program && courseData.teachingUnitId) ||
		courseData.teachingUnitId
	) {
		await ensureTeachingUnit(
			courseData.teachingUnitId ?? existing.teachingUnitId,
			courseData.program ?? existing.program,
			institutionId,
		);
	}
	const updated = await repo.update(id, institutionId, {
		...courseData,
		code: courseData.code ? normalizeCode(courseData.code) : undefined,
	});
	if (prerequisiteCourseIds) {
		await syncPrerequisites(updated.id, prerequisiteCourseIds);
	}
	return updated;
}

export async function deleteCourse(id: string, institutionId: string) {
	await repo.remove(id, institutionId);
}

export async function listCourses(
	opts: Parameters<typeof repo.list>[1],
	institutionId: string,
) {
	return repo.list(institutionId, opts);
}

export async function getCourseById(id: string, institutionId: string) {
	const item = await repo.findById(id, institutionId);
	if (!item) throw notFound();
	return item;
}

export async function getCourseByCode(
	code: string,
	programId: string,
	institutionId: string,
) {
	const item = await repo.findByCode(
		normalizeCode(code),
		programId,
		institutionId,
	);
	if (!item) throw notFound();
	return item;
}

export async function assignDefaultTeacher(
	courseId: string,
	institutionId: string,
	teacherId: string,
) {
	const existing = await repo.findById(courseId, institutionId);
	if (!existing) throw notFound();
	return repo.assignDefaultTeacher(courseId, institutionId, teacherId);
}

export async function searchCourses(
	opts: Parameters<typeof repo.search>[1],
	institutionId: string,
) {
	return repo.search(institutionId, opts);
}

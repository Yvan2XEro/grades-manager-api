import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { normalizeCode } from "@/lib/strings";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { notFound } from "../_shared/errors";
import * as repo from "./courses.repo";

type CourseInput = schema.NewCourse & {
	prerequisiteCourseIds?: string[];
};

async function ensureTeachingUnit(teachingUnitId: string, programId: string) {
	const unit = await db.query.teachingUnits.findFirst({
		where: eq(schema.teachingUnits.id, teachingUnitId),
	});
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

export async function createCourse(data: CourseInput) {
	const { prerequisiteCourseIds, ...courseData } = data;
	await ensureTeachingUnit(courseData.teachingUnitId, courseData.program);
	const created = await repo.create({
		...courseData,
		code: normalizeCode(courseData.code),
	});
	await syncPrerequisites(created.id, prerequisiteCourseIds);
	return created;
}

export async function updateCourse(id: string, data: Partial<CourseInput>) {
	const { prerequisiteCourseIds, ...courseData } = data;
	const existing = await repo.findById(id);
	if (!existing) throw notFound();
	if (
		(courseData.program && courseData.teachingUnitId) ||
		courseData.teachingUnitId
	) {
		await ensureTeachingUnit(
			courseData.teachingUnitId ?? existing.teachingUnitId,
			courseData.program ?? existing.program,
		);
	}
	const updated = await repo.update(id, {
		...courseData,
		code: courseData.code ? normalizeCode(courseData.code) : undefined,
	});
	if (prerequisiteCourseIds) {
		await syncPrerequisites(updated.id, prerequisiteCourseIds);
	}
	return updated;
}

export async function deleteCourse(id: string) {
	await repo.remove(id);
}

export async function listCourses(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}

export async function getCourseById(id: string) {
	const item = await repo.findById(id);
	if (!item) throw notFound();
	return item;
}

export async function getCourseByCode(code: string, programId: string) {
	const item = await repo.findByCode(normalizeCode(code), programId);
	if (!item) throw notFound();
	return item;
}

export async function assignDefaultTeacher(
	courseId: string,
	teacherId: string,
) {
	const existing = await repo.findById(courseId);
	if (!existing) throw notFound();
	return repo.assignDefaultTeacher(courseId, teacherId);
}

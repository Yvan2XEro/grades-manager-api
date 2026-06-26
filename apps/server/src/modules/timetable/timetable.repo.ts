import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import type { DayOfWeek, NewCourseSession } from "@/db/schema/app-schema";
import * as schema from "@/db/schema/app-schema";

export async function create(data: NewCourseSession) {
	const [item] = await db
		.insert(schema.courseSessions)
		.values(data)
		.returning();
	return item;
}

export async function update(
	id: string,
	data: Partial<NewCourseSession>,
	institutionId: string,
) {
	const [item] = await db
		.update(schema.courseSessions)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(schema.courseSessions.id, id),
				eq(schema.courseSessions.institutionId, institutionId),
			),
		)
		.returning();
	return item;
}

export async function remove(id: string, institutionId: string) {
	await db
		.delete(schema.courseSessions)
		.where(
			and(
				eq(schema.courseSessions.id, id),
				eq(schema.courseSessions.institutionId, institutionId),
			),
		);
}

export async function list(
	institutionId: string,
	opts: {
		classCourseId?: string;
		academicYearId?: string;
		dayOfWeek?: DayOfWeek;
	} = {},
) {
	const conditions = [eq(schema.courseSessions.institutionId, institutionId)];
	if (opts.classCourseId)
		conditions.push(
			eq(schema.courseSessions.classCourseId, opts.classCourseId),
		);
	if (opts.academicYearId)
		conditions.push(
			eq(schema.courseSessions.academicYearId, opts.academicYearId),
		);
	if (opts.dayOfWeek)
		conditions.push(eq(schema.courseSessions.dayOfWeek, opts.dayOfWeek));

	return db.query.courseSessions.findMany({
		where: and(...conditions),
		with: {
			classCourse: {
				with: {
					classRef: true,
					courseRef: true,
				},
			},
		},
		orderBy: (t, { asc }) => [asc(t.dayOfWeek), asc(t.startTime)],
	});
}

export async function findById(id: string, institutionId: string) {
	return db.query.courseSessions.findFirst({
		where: and(
			eq(schema.courseSessions.id, id),
			eq(schema.courseSessions.institutionId, institutionId),
		),
	});
}

export async function findConflicts(
	institutionId: string,
	dayOfWeek: DayOfWeek,
	startTime: string,
	endTime: string,
	opts: { room?: string; teacherId?: string; excludeId?: string },
) {
	const all = await db.query.courseSessions.findMany({
		where: and(
			eq(schema.courseSessions.institutionId, institutionId),
			eq(schema.courseSessions.dayOfWeek, dayOfWeek),
		),
		with: {
			classCourse: {
				with: { classRef: true, courseRef: true },
			},
		},
	});

	return all
		.filter((s) => {
			if (opts.excludeId && s.id === opts.excludeId) return false;
			const overlaps = s.startTime < endTime && s.endTime > startTime;
			if (!overlaps) return false;
			const roomConflict = opts.room && s.room && s.room === opts.room;
			const teacherConflict =
				opts.teacherId && s.classCourse?.teacher === opts.teacherId;
			return roomConflict || teacherConflict;
		})
		.map((s) => ({
			...s,
			conflictType: (() => {
				const roomMatch = opts.room && s.room && s.room === opts.room;
				const teacherMatch =
					opts.teacherId && s.classCourse?.teacher === opts.teacherId;
				if (roomMatch && teacherMatch) return "both" as const;
				if (roomMatch) return "room" as const;
				return "teacher" as const;
			})(),
		}));
}

export async function listByClassCourseIds(
	classCourseIds: string[],
	institutionId: string,
) {
	if (classCourseIds.length === 0) return [];
	const { inArray } = await import("drizzle-orm");
	return db.query.courseSessions.findMany({
		where: and(
			eq(schema.courseSessions.institutionId, institutionId),
			inArray(schema.courseSessions.classCourseId, classCourseIds),
		),
		with: {
			classCourse: { with: { classRef: true, courseRef: true } },
		},
		orderBy: (t, { asc }) => [asc(t.dayOfWeek), asc(t.startTime)],
	});
}

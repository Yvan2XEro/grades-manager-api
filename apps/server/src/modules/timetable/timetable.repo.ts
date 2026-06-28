import { and, eq, inArray, isNull, or } from "drizzle-orm";
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
		classId?: string;
		teacherId?: string;
		academicYearId?: string;
		semesterId?: string;
		dayOfWeek?: DayOfWeek;
	} = {},
) {
	const conditions = [eq(schema.courseSessions.institutionId, institutionId)];
	if (opts.classCourseId)
		conditions.push(
			eq(schema.courseSessions.classCourseId, opts.classCourseId),
		);
	// Resolve classId or teacherId to a list of classCourseIds via a secondary query
	if (opts.classId || opts.teacherId) {
		const ccConditions = [eq(schema.classCourses.institutionId, institutionId)];
		if (opts.classId)
			ccConditions.push(eq(schema.classCourses.class, opts.classId));
		if (opts.teacherId)
			ccConditions.push(eq(schema.classCourses.teacher, opts.teacherId));
		const ccs = await db.query.classCourses.findMany({
			where: and(...ccConditions),
			columns: { id: true },
		});
		if (ccs.length === 0) return [];
		conditions.push(
			inArray(
				schema.courseSessions.classCourseId,
				ccs.map((c) => c.id),
			),
		);
	}
	if (opts.academicYearId)
		conditions.push(
			eq(schema.courseSessions.academicYearId, opts.academicYearId),
		);
	if (opts.semesterId)
		conditions.push(eq(schema.courseSessions.semesterId, opts.semesterId));
	if (opts.dayOfWeek)
		conditions.push(eq(schema.courseSessions.dayOfWeek, opts.dayOfWeek));

	return db.query.courseSessions.findMany({
		where: and(...conditions),
		with: {
			classCourse: {
				with: {
					classRef: true,
					courseRef: true,
					teacherRef: { columns: { firstName: true, lastName: true } },
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
	opts: {
		room?: string;
		roomId?: string;
		teacherId?: string;
		classId?: string;
		excludeId?: string;
		academicYearId?: string;
		semesterId?: string;
	},
) {
	const conditions = [
		eq(schema.courseSessions.institutionId, institutionId),
		eq(schema.courseSessions.dayOfWeek, dayOfWeek),
	];
	if (opts.academicYearId)
		conditions.push(
			eq(schema.courseSessions.academicYearId, opts.academicYearId),
		);
	if (opts.semesterId)
		// Annual sessions (semesterId=null) span all semesters — they must still conflict.
		conditions.push(
			or(
				isNull(schema.courseSessions.semesterId),
				eq(schema.courseSessions.semesterId, opts.semesterId),
			)!,
		);

	const all = await db.query.courseSessions.findMany({
		where: and(...conditions),
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
			const roomConflict =
				(opts.roomId && s.roomId && s.roomId === opts.roomId) ||
				(!opts.roomId && opts.room && s.room && s.room === opts.room);
			const teacherConflict =
				opts.teacherId && s.classCourse?.teacher === opts.teacherId;
			const classConflict =
				opts.classId && s.classCourse?.class === opts.classId;
			return (
				Boolean(roomConflict) ||
				Boolean(teacherConflict) ||
				Boolean(classConflict)
			);
		})
		.map((s) => ({
			...s,
			conflictType: (() => {
				const roomMatch =
					(opts.roomId && s.roomId && s.roomId === opts.roomId) ||
					(!opts.roomId && opts.room && s.room && s.room === opts.room);
				const teacherMatch =
					opts.teacherId && s.classCourse?.teacher === opts.teacherId;
				const classMatch =
					opts.classId && s.classCourse?.class === opts.classId;
				const types: string[] = [];
				if (roomMatch) types.push("room");
				if (teacherMatch) types.push("teacher");
				if (classMatch) types.push("class");
				return types.join("+") as
					| "room"
					| "teacher"
					| "class"
					| "room+teacher"
					| "room+class"
					| "teacher+class"
					| "room+teacher+class";
			})(),
		}));
}

export async function findDuplicate(
	institutionId: string,
	classCourseId: string,
	dayOfWeek: DayOfWeek,
	startTime: string,
	endTime: string,
	academicYearId: string,
	semesterId?: string | null,
) {
	const conditions = [
		eq(schema.courseSessions.institutionId, institutionId),
		eq(schema.courseSessions.classCourseId, classCourseId),
		eq(schema.courseSessions.dayOfWeek, dayOfWeek),
		eq(schema.courseSessions.startTime, startTime),
		eq(schema.courseSessions.endTime, endTime),
		eq(schema.courseSessions.academicYearId, academicYearId),
	];
	// Scope by semester so sessions in different semesters are not treated as duplicates
	if (semesterId !== undefined) {
		conditions.push(
			semesterId === null
				? isNull(schema.courseSessions.semesterId)
				: eq(schema.courseSessions.semesterId, semesterId),
		);
	}
	return db.query.courseSessions.findFirst({
		where: and(...conditions),
		columns: { id: true },
	});
}

export async function listByClassCourseIds(
	classCourseIds: string[],
	institutionId: string,
	semesterId?: string,
) {
	if (classCourseIds.length === 0) return [];
	const { inArray } = await import("drizzle-orm");
	const conditions = [
		eq(schema.courseSessions.institutionId, institutionId),
		inArray(schema.courseSessions.classCourseId, classCourseIds),
	];
	if (semesterId)
		conditions.push(eq(schema.courseSessions.semesterId, semesterId));
	return db.query.courseSessions.findMany({
		where: and(...conditions),
		with: {
			classCourse: {
				with: {
					classRef: true,
					courseRef: true,
					teacherRef: { columns: { firstName: true, lastName: true } },
				},
			},
		},
		orderBy: (t, { asc }) => [asc(t.dayOfWeek), asc(t.startTime)],
	});
}

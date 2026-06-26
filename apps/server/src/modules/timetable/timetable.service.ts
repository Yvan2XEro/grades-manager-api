import { TRPCError } from "@trpc/server";
import type { DayOfWeek } from "@/db/schema/app-schema";
import * as repo from "./timetable.repo";

async function resolveTeacherId(
	classCourseId: string,
): Promise<string | undefined> {
	const { db } = await import("@/db");
	const { eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");
	const cc = await db.query.classCourses.findFirst({
		where: eq(schema.classCourses.id, classCourseId),
		columns: { teacher: true },
	});
	return cc?.teacher ?? undefined;
}

export async function createSession(
	input: {
		classCourseId: string;
		academicYearId: string;
		dayOfWeek: DayOfWeek;
		startTime: string;
		endTime: string;
		room?: string;
	},
	institutionId: string,
) {
	if (input.startTime >= input.endTime) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "startTime must be before endTime",
		});
	}

	const teacherId = await resolveTeacherId(input.classCourseId);

	const conflicts = await repo.findConflicts(
		institutionId,
		input.dayOfWeek,
		input.startTime,
		input.endTime,
		{ room: input.room, teacherId },
	);

	const session = await repo.create({
		...input,
		room: input.room ?? null,
		institutionId,
	});

	return { session, conflicts };
}

export async function updateSession(
	input: {
		id: string;
		dayOfWeek?: DayOfWeek;
		startTime?: string;
		endTime?: string;
		room?: string | null;
	},
	institutionId: string,
) {
	const existing = await repo.findById(input.id, institutionId);
	if (!existing) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
	}

	const nextStart = input.startTime ?? existing.startTime;
	const nextEnd = input.endTime ?? existing.endTime;
	const nextDay = (input.dayOfWeek ?? existing.dayOfWeek) as DayOfWeek;
	const nextRoom =
		input.room !== undefined
			? (input.room ?? undefined)
			: (existing.room ?? undefined);

	if (nextStart >= nextEnd) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "startTime must be before endTime",
		});
	}

	const teacherId = await resolveTeacherId(existing.classCourseId);

	const { id, ...data } = input;
	const session = await repo.update(id, data, institutionId);

	const conflicts = await repo.findConflicts(
		institutionId,
		nextDay,
		nextStart,
		nextEnd,
		{ room: nextRoom, teacherId, excludeId: id },
	);

	return { session, conflicts };
}

export async function deleteSession(id: string, institutionId: string) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
	}
	await repo.remove(id, institutionId);
	return { success: true };
}

export async function listSessions(
	institutionId: string,
	opts: {
		classCourseId?: string;
		academicYearId?: string;
		dayOfWeek?: DayOfWeek;
	},
) {
	return repo.list(institutionId, opts);
}

export async function getTeacherTimetable(
	teacherId: string,
	institutionId: string,
	academicYearId?: string,
) {
	const { db } = await import("@/db");
	const { and, eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");

	const conditions = [
		eq(schema.classCourses.institutionId, institutionId),
		eq(schema.classCourses.teacher, teacherId),
	];

	const classCourses = await db.query.classCourses.findMany({
		where: and(...conditions),
		with: { classRef: true },
	});

	const filtered = academicYearId
		? classCourses.filter((cc) => cc.classRef?.academicYear === academicYearId)
		: classCourses;

	return repo.listByClassCourseIds(
		filtered.map((cc) => cc.id),
		institutionId,
	);
}

export async function getStudentTimetable(
	studentId: string,
	institutionId: string,
	academicYearId?: string,
) {
	const { db } = await import("@/db");
	const { and, eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");

	const conditions = [
		eq(schema.studentCourseEnrollments.studentId, studentId),
		eq(schema.studentCourseEnrollments.status, "active"),
	];
	if (academicYearId) {
		conditions.push(
			eq(schema.studentCourseEnrollments.academicYearId, academicYearId),
		);
	}

	const enrollments = await db.query.studentCourseEnrollments.findMany({
		where: and(...conditions),
		columns: { classCourseId: true },
	});

	return repo.listByClassCourseIds(
		enrollments.map((e) => e.classCourseId),
		institutionId,
	);
}

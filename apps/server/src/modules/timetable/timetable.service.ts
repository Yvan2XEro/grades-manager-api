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

async function resolveRoomName(
	roomId?: string,
	fallback?: string,
): Promise<string | undefined> {
	if (!roomId) return fallback;
	const { db } = await import("@/db");
	const { eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");
	const room = await db.query.rooms.findFirst({
		where: eq(schema.rooms.id, roomId),
		columns: { name: true },
	});
	return room?.name ?? fallback;
}

async function checkRoomCapacity(
	roomId: string | undefined,
	classCourseId: string,
	institutionId: string,
): Promise<{ roomCapacity: number; classSize: number } | null> {
	if (!roomId) return null;
	const { db } = await import("@/db");
	const { and, count, eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");

	const room = await db.query.rooms.findFirst({
		where: eq(schema.rooms.id, roomId),
		columns: { capacity: true },
	});
	if (!room?.capacity) return null;

	const cc = await db.query.classCourses.findFirst({
		where: eq(schema.classCourses.id, classCourseId),
		columns: { class: true },
	});
	if (!cc?.class) return null;

	const [{ value: classSize }] = await db
		.select({ value: count() })
		.from(schema.students)
		.where(
			and(
				eq(schema.students.class, cc.class),
				eq(schema.students.institutionId, institutionId),
			),
		);

	if (Number(classSize) > room.capacity) {
		return { roomCapacity: room.capacity, classSize: Number(classSize) };
	}
	return null;
}

export async function createSession(
	input: {
		classCourseId: string;
		academicYearId: string;
		dayOfWeek: DayOfWeek;
		startTime: string;
		endTime: string;
		room?: string;
		roomId?: string;
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
	const roomName = await resolveRoomName(input.roomId, input.room);
	const capacityWarning = await checkRoomCapacity(
		input.roomId,
		input.classCourseId,
		institutionId,
	);

	const conflicts = await repo.findConflicts(
		institutionId,
		input.dayOfWeek,
		input.startTime,
		input.endTime,
		{ room: roomName, roomId: input.roomId, teacherId },
	);

	const session = await repo.create({
		...input,
		room: roomName ?? null,
		roomId: input.roomId ?? null,
		institutionId,
	});

	return { session, conflicts, capacityWarning };
}

export async function updateSession(
	input: {
		id: string;
		dayOfWeek?: DayOfWeek;
		startTime?: string;
		endTime?: string;
		room?: string | null;
		roomId?: string | null;
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
	const nextRoomId =
		input.roomId !== undefined ? input.roomId : existing.roomId;
	const nextRoomName = input.room !== undefined ? input.room : existing.room;
	const resolvedRoom = await resolveRoomName(
		nextRoomId ?? undefined,
		nextRoomName ?? undefined,
	);

	if (nextStart >= nextEnd) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "startTime must be before endTime",
		});
	}

	const teacherId = await resolveTeacherId(existing.classCourseId);
	const capacityWarning = await checkRoomCapacity(
		nextRoomId ?? undefined,
		existing.classCourseId,
		institutionId,
	);

	const { id, ...data } = input;
	const session = await repo.update(
		id,
		{ ...data, room: resolvedRoom ?? null },
		institutionId,
	);

	const conflicts = await repo.findConflicts(
		institutionId,
		nextDay,
		nextStart,
		nextEnd,
		{
			room: resolvedRoom,
			roomId: nextRoomId ?? undefined,
			teacherId,
			excludeId: id,
		},
	);

	return { session, conflicts, capacityWarning };
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

// ── Bulk import ───────────────────────────────────────────────────────────────

type ImportRow = {
	classCourseId: string;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
	room?: string;
	roomId?: string;
};

export async function previewBulkImport(
	rows: ImportRow[],
	institutionId: string,
) {
	const { db } = await import("@/db");
	const { and, eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");
	const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
	const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

	const valid: (ImportRow & { rowIndex: number })[] = [];
	const errors: { rowIndex: number; reason: string }[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const rowNum = i + 1;

		if (!row.classCourseId) {
			errors.push({ rowIndex: rowNum, reason: "classCourseId is required" });
			continue;
		}
		if (!validDays.includes(row.dayOfWeek)) {
			errors.push({
				rowIndex: rowNum,
				reason: `Invalid dayOfWeek "${row.dayOfWeek}". Must be one of: ${validDays.join(", ")}`,
			});
			continue;
		}
		if (!timePattern.test(row.startTime)) {
			errors.push({
				rowIndex: rowNum,
				reason: `Invalid startTime "${row.startTime}". Use HH:MM format.`,
			});
			continue;
		}
		if (!timePattern.test(row.endTime)) {
			errors.push({
				rowIndex: rowNum,
				reason: `Invalid endTime "${row.endTime}". Use HH:MM format.`,
			});
			continue;
		}
		if (row.startTime >= row.endTime) {
			errors.push({
				rowIndex: rowNum,
				reason: "startTime must be before endTime",
			});
			continue;
		}

		const cc = await db.query.classCourses.findFirst({
			where: and(
				eq(schema.classCourses.id, row.classCourseId),
				eq(schema.classCourses.institutionId, institutionId),
			),
			columns: { id: true },
		});
		if (!cc) {
			errors.push({
				rowIndex: rowNum,
				reason: `classCourseId "${row.classCourseId}" not found in this institution`,
			});
			continue;
		}

		if (row.roomId) {
			const room = await db.query.rooms.findFirst({
				where: and(
					eq(schema.rooms.id, row.roomId),
					eq(schema.rooms.institutionId, institutionId),
				),
				columns: { id: true },
			});
			if (!room) {
				errors.push({
					rowIndex: rowNum,
					reason: `roomId "${row.roomId}" not found in this institution`,
				});
				continue;
			}
		}

		valid.push({ ...row, rowIndex: rowNum });
	}

	return { valid, errors, totalRows: rows.length };
}

export async function executeBulkImport(
	rows: ImportRow[],
	institutionId: string,
	skipDuplicates: boolean,
) {
	const daysOfWeek = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
	let created = 0;
	let skipped = 0;
	const errors: { rowIndex: number; reason: string }[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const day = row.dayOfWeek as DayOfWeek;

		if (!daysOfWeek.includes(day)) {
			errors.push({ rowIndex: i + 1, reason: `Invalid day: ${row.dayOfWeek}` });
			continue;
		}

		const existing = await repo.findDuplicate(
			institutionId,
			row.classCourseId,
			day,
			row.startTime,
			row.endTime,
		);

		if (existing) {
			if (skipDuplicates) {
				skipped++;
				continue;
			}
			errors.push({
				rowIndex: i + 1,
				reason: `Duplicate session already exists for this class course on ${day} ${row.startTime}–${row.endTime}`,
			});
			continue;
		}

		await repo.create({
			institutionId,
			classCourseId: row.classCourseId,
			academicYearId: await resolveAcademicYearFromClassCourse(
				row.classCourseId,
				institutionId,
			),
			dayOfWeek: day,
			startTime: row.startTime,
			endTime: row.endTime,
			room: row.room ?? null,
			roomId: row.roomId ?? null,
		});
		created++;
	}

	return { created, skipped, errors };
}

async function resolveAcademicYearFromClassCourse(
	classCourseId: string,
	institutionId: string,
): Promise<string> {
	const { db } = await import("@/db");
	const { and, eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");
	const cc = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
		with: { classRef: { columns: { academicYear: true } } },
	});
	if (!cc?.classRef?.academicYear) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Cannot resolve academic year for class course ${classCourseId}`,
		});
	}
	return cc.classRef.academicYear;
}

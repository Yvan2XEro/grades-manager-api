import { TRPCError } from "@trpc/server";
import type { DayOfWeek } from "@/db/schema/app-schema";
import * as repo from "./timetable.repo";

async function resolveClassCourseInfo(
	classCourseId: string,
	institutionId: string,
): Promise<{ teacherId?: string; classId?: string }> {
	const { db } = await import("@/db");
	const { and, eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");
	const cc = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
		columns: { teacher: true, class: true },
	});
	if (!cc)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: `Class course ${classCourseId} not found in this institution`,
		});
	return {
		teacherId: cc.teacher ?? undefined,
		classId: cc.class ?? undefined,
	};
}

async function resolveRoomName(
	roomId: string | undefined,
	fallback: string | undefined,
	institutionId: string,
): Promise<string | undefined> {
	if (!roomId) return fallback;
	const { db } = await import("@/db");
	const { and, eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");
	const room = await db.query.rooms.findFirst({
		where: and(
			eq(schema.rooms.id, roomId),
			eq(schema.rooms.institutionId, institutionId),
			eq(schema.rooms.isActive, true),
		),
		columns: { name: true },
	});
	if (!room)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: `Room ${roomId} not found or inactive in this institution`,
		});
	return room.name;
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
		where: and(
			eq(schema.rooms.id, roomId),
			eq(schema.rooms.institutionId, institutionId),
		),
		columns: { capacity: true },
	});
	if (!room?.capacity) return null;

	const cc = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
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
		semesterId?: string;
	},
	institutionId: string,
) {
	if (input.startTime >= input.endTime) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "startTime must be before endTime",
		});
	}

	const { teacherId, classId } = await resolveClassCourseInfo(
		input.classCourseId,
		institutionId,
	);
	const roomName = await resolveRoomName(
		input.roomId,
		input.room,
		institutionId,
	);
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
		{
			room: roomName,
			roomId: input.roomId,
			teacherId,
			classId,
			academicYearId: input.academicYearId,
			semesterId: input.semesterId,
		},
	);

	if (conflicts.length > 0) {
		const ids = conflicts.map((c) => c.id).join(", ");
		throw new TRPCError({
			code: "CONFLICT",
			message: `Scheduling conflict (${conflicts.map((c) => c.conflictType).join(", ")}) with session(s): ${ids}`,
		});
	}

	const session = await repo.create({
		...input,
		room: roomName ?? null,
		roomId: input.roomId ?? null,
		semesterId: input.semesterId ?? null,
		institutionId,
	});

	return { session, capacityWarning };
}

export async function updateSession(
	input: {
		id: string;
		dayOfWeek?: DayOfWeek;
		startTime?: string;
		endTime?: string;
		room?: string | null;
		roomId?: string | null;
		semesterId?: string | null;
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
		institutionId,
	);

	if (nextStart >= nextEnd) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "startTime must be before endTime",
		});
	}

	const { teacherId, classId } = await resolveClassCourseInfo(
		existing.classCourseId,
		institutionId,
	);
	const capacityWarning = await checkRoomCapacity(
		nextRoomId ?? undefined,
		existing.classCourseId,
		institutionId,
	);

	const nextSemesterId =
		input.semesterId !== undefined ? input.semesterId : existing.semesterId;

	// Check conflicts BEFORE mutating, scoped to the same academic year + semester
	const conflicts = await repo.findConflicts(
		institutionId,
		nextDay,
		nextStart,
		nextEnd,
		{
			room: resolvedRoom,
			roomId: nextRoomId ?? undefined,
			teacherId,
			classId,
			excludeId: input.id,
			academicYearId: existing.academicYearId,
			semesterId: nextSemesterId ?? undefined,
		},
	);

	if (conflicts.length > 0) {
		const ids = conflicts.map((c) => c.id).join(", ");
		throw new TRPCError({
			code: "CONFLICT",
			message: `Scheduling conflict (${conflicts.map((c) => c.conflictType).join(", ")}) with session(s): ${ids}`,
		});
	}

	const { id, ...data } = input;
	const session = await repo.update(
		id,
		{ ...data, room: resolvedRoom ?? null },
		institutionId,
	);

	return { session, capacityWarning };
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
		semesterId?: string;
		dayOfWeek?: DayOfWeek;
	},
) {
	return repo.list(institutionId, opts);
}

export async function getTeacherTimetable(
	teacherId: string,
	institutionId: string,
	academicYearId?: string,
	semesterId?: string,
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
		semesterId,
	);
}

export async function getStudentTimetable(
	studentId: string,
	institutionId: string,
	academicYearId?: string,
	semesterId?: string,
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
		semesterId,
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
	semesterId?: string;
};

/** Check if a candidate session conflicts with any previously accepted in-batch session. */
function intraBatchConflict(
	candidate: {
		dayOfWeek: string;
		startTime: string;
		endTime: string;
		room?: string;
		roomId?: string;
		teacherId?: string;
		classId?: string;
		academicYearId: string;
		semesterId?: string;
	},
	batch: Array<typeof candidate & { rowIndex: number }>,
): number | null {
	for (const b of batch) {
		if (b.dayOfWeek !== candidate.dayOfWeek) continue;
		if (b.academicYearId !== candidate.academicYearId) continue;
		// Skip if both have a semester and they differ (non-overlapping semesters don't conflict)
		if (
			b.semesterId &&
			candidate.semesterId &&
			b.semesterId !== candidate.semesterId
		)
			continue;
		if (candidate.startTime >= b.endTime || candidate.endTime <= b.startTime)
			continue;
		const roomConflict =
			(candidate.roomId && b.roomId && candidate.roomId === b.roomId) ||
			(!candidate.roomId &&
				candidate.room &&
				!b.roomId &&
				b.room &&
				candidate.room === b.room);
		const teacherConflict =
			candidate.teacherId && b.teacherId && candidate.teacherId === b.teacherId;
		const classConflict =
			candidate.classId && b.classId && candidate.classId === b.classId;
		if (roomConflict || teacherConflict || classConflict) return b.rowIndex;
	}
	return null;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const VALID_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** Validate a single import row against format rules and DB existence.
 *  Returns an error string or null if valid. */
async function validateImportRow(
	row: ImportRow,
	institutionId: string,
): Promise<string | null> {
	const { db } = await import("@/db");
	const { and, eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");

	if (!row.classCourseId) return "classCourseId is required";
	if (!VALID_DAYS.includes(row.dayOfWeek))
		return `Invalid dayOfWeek "${row.dayOfWeek}". Must be one of: ${VALID_DAYS.join(", ")}`;
	if (!TIME_PATTERN.test(row.startTime))
		return `Invalid startTime "${row.startTime}". Use HH:MM format.`;
	if (!TIME_PATTERN.test(row.endTime))
		return `Invalid endTime "${row.endTime}". Use HH:MM format.`;
	if (row.startTime >= row.endTime) return "startTime must be before endTime";

	const cc = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, row.classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
		columns: { id: true },
	});
	if (!cc)
		return `classCourseId "${row.classCourseId}" not found in this institution`;

	if (row.roomId) {
		const room = await db.query.rooms.findFirst({
			where: and(
				eq(schema.rooms.id, row.roomId),
				eq(schema.rooms.institutionId, institutionId),
				eq(schema.rooms.isActive, true),
			),
			columns: { id: true },
		});
		if (!room)
			return `roomId "${row.roomId}" not found or inactive in this institution`;
	}

	return null;
}

export async function previewBulkImport(
	rows: ImportRow[],
	institutionId: string,
) {
	const valid: (ImportRow & { rowIndex: number })[] = [];
	const errors: { rowIndex: number; reason: string }[] = [];
	// Track accepted sessions for intra-batch conflict detection
	const accepted: Array<{
		dayOfWeek: string;
		startTime: string;
		endTime: string;
		room?: string;
		roomId?: string;
		teacherId?: string;
		classId?: string;
		academicYearId: string;
		semesterId?: string;
		rowIndex: number;
	}> = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const rowNum = i + 1;

		// Format + DB existence validation
		const validationError = await validateImportRow(row, institutionId);
		if (validationError) {
			errors.push({ rowIndex: rowNum, reason: validationError });
			continue;
		}

		const day = row.dayOfWeek as DayOfWeek;

		// Duplicate check (same as execute)
		const duplicate = await repo.findDuplicate(
			institutionId,
			row.classCourseId,
			day,
			row.startTime,
			row.endTime,
		);
		if (duplicate) {
			errors.push({
				rowIndex: rowNum,
				reason: `Duplicate session already exists on ${day} ${row.startTime}–${row.endTime}`,
			});
			continue;
		}

		const { teacherId, classId } = await resolveClassCourseInfo(
			row.classCourseId,
			institutionId,
		);
		const roomName = await resolveRoomName(row.roomId, row.room, institutionId);
		const academicYearId = await resolveAcademicYearFromClassCourse(
			row.classCourseId,
			institutionId,
		);

		// DB conflict check
		const conflicts = await repo.findConflicts(
			institutionId,
			day,
			row.startTime,
			row.endTime,
			{
				room: roomName,
				roomId: row.roomId,
				teacherId,
				classId,
				academicYearId,
				semesterId: row.semesterId,
			},
		);
		if (conflicts.length > 0) {
			const ids = conflicts.map((c) => c.id).join(", ");
			errors.push({
				rowIndex: rowNum,
				reason: `Conflict (${conflicts.map((c) => c.conflictType).join(", ")}) with session(s): ${ids}`,
			});
			continue;
		}

		// Intra-batch conflict check
		const candidate = {
			dayOfWeek: day,
			startTime: row.startTime,
			endTime: row.endTime,
			room: roomName,
			roomId: row.roomId,
			teacherId,
			classId,
			academicYearId,
			semesterId: row.semesterId,
		};
		const batchConflictRow = intraBatchConflict(candidate, accepted);
		if (batchConflictRow !== null) {
			errors.push({
				rowIndex: rowNum,
				reason: `Conflicts with row ${batchConflictRow} in this import batch`,
			});
			continue;
		}

		accepted.push({ ...candidate, rowIndex: rowNum });
		valid.push({ ...row, rowIndex: rowNum });
	}

	return { valid, errors, totalRows: rows.length };
}

export async function executeBulkImport(
	rows: ImportRow[],
	institutionId: string,
	skipDuplicates: boolean,
) {
	let created = 0;
	let skipped = 0;
	const errors: { rowIndex: number; reason: string }[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const rowNum = i + 1;

		// Full re-validation (same rules as preview)
		const validationError = await validateImportRow(row, institutionId);
		if (validationError) {
			errors.push({ rowIndex: rowNum, reason: validationError });
			continue;
		}

		const day = row.dayOfWeek as DayOfWeek;
		const academicYearId = await resolveAcademicYearFromClassCourse(
			row.classCourseId,
			institutionId,
		);

		// Duplicate check
		const duplicate = await repo.findDuplicate(
			institutionId,
			row.classCourseId,
			day,
			row.startTime,
			row.endTime,
		);
		if (duplicate) {
			if (skipDuplicates) {
				skipped++;
				continue;
			}
			errors.push({
				rowIndex: rowNum,
				reason: `Duplicate session already exists on ${day} ${row.startTime}–${row.endTime}`,
			});
			continue;
		}

		// Conflict check (teacher, room, class) scoped to academic year + semester
		const { teacherId, classId } = await resolveClassCourseInfo(
			row.classCourseId,
			institutionId,
		);
		const roomName = await resolveRoomName(row.roomId, row.room, institutionId);
		const conflicts = await repo.findConflicts(
			institutionId,
			day,
			row.startTime,
			row.endTime,
			{
				room: roomName,
				roomId: row.roomId,
				teacherId,
				classId,
				academicYearId,
				semesterId: row.semesterId,
			},
		);
		if (conflicts.length > 0) {
			const ids = conflicts.map((c) => c.id).join(", ");
			errors.push({
				rowIndex: rowNum,
				reason: `Conflict (${conflicts.map((c) => c.conflictType).join(", ")}) with session(s): ${ids}`,
			});
			continue;
		}

		await repo.create({
			institutionId,
			classCourseId: row.classCourseId,
			academicYearId,
			dayOfWeek: day,
			startTime: row.startTime,
			endTime: row.endTime,
			room: roomName ?? null,
			roomId: row.roomId ?? null,
			semesterId: row.semesterId ?? null,
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

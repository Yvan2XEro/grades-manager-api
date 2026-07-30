import { TRPCError } from "@trpc/server";
import type { DayOfWeek } from "@/db/schema/app-schema";
import * as repo from "./timetable.repo";

async function resolveClassCourseInfo(
	classCourseId: string,
	institutionId: string,
): Promise<{
	teacherId?: string;
	classId?: string;
	classAcademicYear?: string;
	classSemesterId?: string | null;
}> {
	const { db } = await import("@/db");
	const { and, eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");
	const cc = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
		columns: { teacher: true, class: true, semesterId: true },
		with: { classRef: { columns: { academicYear: true } } },
	});
	if (!cc)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: `Class course ${classCourseId} not found in this institution`,
		});
	return {
		teacherId: cc.teacher ?? undefined,
		classId: cc.class ?? undefined,
		classAcademicYear: cc.classRef?.academicYear ?? undefined,
		classSemesterId: cc.semesterId,
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
		validFrom?: string;
		validUntil?: string;
	},
	institutionId: string,
) {
	if (input.startTime >= input.endTime) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "startTime must be before endTime",
		});
	}

	// Validate academicYearId and semesterId belong to this institution
	{
		const { db } = await import("@/db");
		const { and, eq } = await import("drizzle-orm");
		const schema = await import("@/db/schema/app-schema");

		const ay = await db.query.academicYears.findFirst({
			where: and(
				eq(schema.academicYears.id, input.academicYearId),
				eq(schema.academicYears.institutionId, institutionId),
			),
			columns: { id: true },
		});
		if (!ay)
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Academic year not found in this institution",
			});

		if (input.semesterId) {
			const sem = await db.query.semesters.findFirst({
				where: eq(schema.semesters.id, input.semesterId),
				columns: { id: true },
			});
			if (!sem)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Semester not found",
				});
		}
	}

	const { teacherId, classId, classAcademicYear, classSemesterId } =
		await resolveClassCourseInfo(input.classCourseId, institutionId);

	// Reject academic year mismatches: the session must belong to the same year as its class
	if (classAcademicYear && classAcademicYear !== input.academicYearId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"The selected course belongs to a different academic year. Please select a course from the current academic year.",
		});
	}

	// If the class course is semester-bound, a supplied semesterId must match
	if (
		classSemesterId &&
		input.semesterId &&
		classSemesterId !== input.semesterId
	) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"The selected course belongs to a different semester. Clear the semester filter before creating this session.",
		});
	}

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
			validFrom: input.validFrom,
			validUntil: input.validUntil,
		},
	);

	if (conflicts.length > 0) {
		const types = [...new Set(conflicts.map((c) => c.conflictType))];
		const label =
			types.includes("teacher") && types.includes("room")
				? "teacher and room"
				: types.includes("teacher")
					? "teacher"
					: "room";
		throw new TRPCError({
			code: "CONFLICT",
			message: `Schedule conflict: another session already occupies this time slot for the same ${label} (${conflicts.length} conflict${conflicts.length > 1 ? "s" : ""}).`,
		});
	}

	const session = await repo.create({
		...input,
		room: roomName ?? null,
		roomId: input.roomId ?? null,
		semesterId: input.semesterId ?? null,
		validFrom: input.validFrom ?? null,
		validUntil: input.validUntil ?? null,
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
		validFrom?: string | null;
		validUntil?: string | null;
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

	const { teacherId, classId, classSemesterId } = await resolveClassCourseInfo(
		existing.classCourseId,
		institutionId,
	);

	// If the caller changes semesterId and the class course is semester-bound, they must match
	if (
		input.semesterId !== undefined &&
		input.semesterId !== null &&
		classSemesterId &&
		classSemesterId !== input.semesterId
	) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"The selected semester does not match the course's semester. Please leave the semester field empty to keep the existing one.",
		});
	}

	const capacityWarning = await checkRoomCapacity(
		nextRoomId ?? undefined,
		existing.classCourseId,
		institutionId,
	);

	const nextSemesterId =
		input.semesterId !== undefined ? input.semesterId : existing.semesterId;
	const nextValidFrom =
		input.validFrom !== undefined ? input.validFrom : existing.validFrom;
	const nextValidUntil =
		input.validUntil !== undefined ? input.validUntil : existing.validUntil;
	if (nextValidFrom && nextValidUntil && nextValidFrom > nextValidUntil) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "validFrom must be before or equal to validUntil",
		});
	}

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
			validFrom: nextValidFrom,
			validUntil: nextValidUntil,
		},
	);

	if (conflicts.length > 0) {
		const types = [...new Set(conflicts.map((c) => c.conflictType))];
		const label =
			types.includes("teacher") && types.includes("room")
				? "teacher and room"
				: types.includes("teacher")
					? "teacher"
					: "room";
		throw new TRPCError({
			code: "CONFLICT",
			message: `Schedule conflict: another session already occupies this time slot for the same ${label} (${conflicts.length} conflict${conflicts.length > 1 ? "s" : ""}).`,
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
		classId?: string;
		teacherId?: string;
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
	id?: string;
	classCourseId: string;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
	room?: string;
	roomId?: string;
	semesterId?: string;
	validFrom?: string;
	validUntil?: string;
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
		validFrom?: string;
		validUntil?: string;
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
		const candidateStart = candidate.validFrom ?? "0000-01-01";
		const candidateEnd = candidate.validUntil ?? "9999-12-31";
		const batchStart = b.validFrom ?? "0000-01-01";
		const batchEnd = b.validUntil ?? "9999-12-31";
		if (candidateStart > batchEnd || batchStart > candidateEnd) continue;
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
	if (row.validFrom && row.validUntil && row.validFrom > row.validUntil) {
		return "validFrom must be before or equal to validUntil";
	}

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
	mode: "create" | "update" = "create",
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
		if (mode === "update" && !row.id) {
			errors.push({
				rowIndex: rowNum,
				reason: "id is required in update mode",
			});
			continue;
		}

		// Format + DB existence validation
		const validationError = await validateImportRow(row, institutionId);
		if (validationError) {
			errors.push({ rowIndex: rowNum, reason: validationError });
			continue;
		}

		const day = row.dayOfWeek as DayOfWeek;

		const { teacherId, classId } = await resolveClassCourseInfo(
			row.classCourseId,
			institutionId,
		);
		const roomName = await resolveRoomName(row.roomId, row.room, institutionId);
		const academicYearId = await resolveAcademicYearFromClassCourse(
			row.classCourseId,
			institutionId,
		);

		// Duplicate check scoped by academic year + semester to avoid false positives
		const duplicate = await repo.findDuplicate(
			institutionId,
			row.classCourseId,
			day,
			row.startTime,
			row.endTime,
			academicYearId,
			row.semesterId ?? null,
			row.validFrom ?? null,
			row.validUntil ?? null,
		);
		if (duplicate && duplicate.id !== row.id) {
			errors.push({
				rowIndex: rowNum,
				reason: `Duplicate session already exists on ${day} ${row.startTime}–${row.endTime}`,
			});
			continue;
		}

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
				validFrom: row.validFrom,
				validUntil: row.validUntil,
				excludeId: mode === "update" ? row.id : undefined,
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
			validFrom: row.validFrom,
			validUntil: row.validUntil,
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
	mode: "create" | "update" = "create",
) {
	let created = 0;
	let updated = 0;
	let skipped = 0;
	const errors: { rowIndex: number; reason: string }[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const rowNum = i + 1;
		if (mode === "update" && !row.id) {
			errors.push({
				rowIndex: rowNum,
				reason: "id is required in update mode",
			});
			continue;
		}

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

		// Duplicate check scoped by academic year + semester
		const duplicate = await repo.findDuplicate(
			institutionId,
			row.classCourseId,
			day,
			row.startTime,
			row.endTime,
			academicYearId,
			row.semesterId ?? null,
			row.validFrom ?? null,
			row.validUntil ?? null,
		);
		if (duplicate && duplicate.id !== row.id) {
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
				validFrom: row.validFrom,
				validUntil: row.validUntil,
				excludeId: mode === "update" ? row.id : undefined,
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

		const payload = {
			institutionId,
			classCourseId: row.classCourseId,
			academicYearId,
			dayOfWeek: day,
			startTime: row.startTime,
			endTime: row.endTime,
			room: roomName ?? null,
			roomId: row.roomId ?? null,
			semesterId: row.semesterId ?? null,
			validFrom: row.validFrom ?? null,
			validUntil: row.validUntil ?? null,
		};
		if (mode === "update") {
			const existing = await repo.findById(row.id!, institutionId);
			if (!existing) {
				errors.push({
					rowIndex: rowNum,
					reason: `Session ${row.id} not found`,
				});
				continue;
			}
			await repo.update(row.id!, payload, institutionId);
			updated++;
		} else {
			await repo.create(payload);
			created++;
		}
	}

	return { created, updated, skipped, errors };
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

export type CopySessionsResult = {
	copied: number;
	skipped: number;
	notMatched: number;
};

/**
 * Copies all timetable sessions from sourceYearId to targetYearId.
 * classMapping maps source class IDs to target class IDs.
 * Sessions with no matching classCourse in the target year are counted in notMatched.
 * Sessions already present in the target (same classCourseId+dayOfWeek+startTime) are skipped.
 */
export async function copySessionsAcrossYears(
	sourceYearId: string,
	targetYearId: string,
	institutionId: string,
	classMapping: Record<string, string>,
): Promise<CopySessionsResult> {
	const { db } = await import("@/db");
	const { and, eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");

	const result: CopySessionsResult = { copied: 0, skipped: 0, notMatched: 0 };

	const sourceSessions = await db.query.courseSessions.findMany({
		where: and(
			eq(schema.courseSessions.academicYearId, sourceYearId),
			eq(schema.courseSessions.institutionId, institutionId),
		),
		with: { classCourse: true },
	});

	for (const session of sourceSessions) {
		const sourceClassId = session.classCourse?.class;
		if (!sourceClassId) {
			result.notMatched++;
			continue;
		}

		const targetClassId = classMapping[sourceClassId];
		if (!targetClassId) {
			result.notMatched++;
			continue;
		}

		const targetCC = await db.query.classCourses.findFirst({
			where: and(
				eq(schema.classCourses.class, targetClassId),
				eq(schema.classCourses.code, session.classCourse.code),
				eq(schema.classCourses.institutionId, institutionId),
			),
		});
		if (!targetCC) {
			result.notMatched++;
			continue;
		}

		const existing = await db.query.courseSessions.findFirst({
			where: and(
				eq(schema.courseSessions.classCourseId, targetCC.id),
				eq(schema.courseSessions.dayOfWeek, session.dayOfWeek),
				eq(schema.courseSessions.startTime, session.startTime),
				eq(schema.courseSessions.academicYearId, targetYearId),
			),
		});
		if (existing) {
			result.skipped++;
			continue;
		}

		await db.insert(schema.courseSessions).values({
			institutionId,
			classCourseId: targetCC.id,
			academicYearId: targetYearId,
			dayOfWeek: session.dayOfWeek,
			startTime: session.startTime,
			endTime: session.endTime,
			room: session.room,
			roomId: session.roomId,
			semesterId: session.semesterId,
			validFrom: session.validFrom,
			validUntil: session.validUntil,
		});
		result.copied++;
	}

	return result;
}

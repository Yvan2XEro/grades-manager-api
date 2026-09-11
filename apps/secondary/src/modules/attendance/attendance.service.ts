import { randomUUID } from "node:crypto";
import { notFound } from "../../lib/errors";
import * as repo from "./attendance.repo";

// ─── Session operations ──────────────────────────────────────────────────────

export async function listSessions(
	institutionId: string,
	classId: string,
	filters?: {
		termId?: string;
		startDate?: Date;
		endDate?: Date;
	},
) {
	return repo.findSessionsByClass(institutionId, classId, filters);
}

export async function getSession(sessionId: string, institutionId: string) {
	const session = await repo.findSessionById(sessionId, institutionId);
	if (!session) throw notFound("Attendance session not found");
	return session;
}

export async function createSession(
	data: {
		classId: string;
		subjectId?: string;
		termId: string;
		conductedById?: string;
		sessionDate: Date;
		startTime?: string;
		endTime?: string;
	},
	institutionId: string,
) {
	return repo.insertSession({
		id: randomUUID(),
		institutionId,
		classId: data.classId,
		subjectId: data.subjectId,
		termId: data.termId,
		conductedById: data.conductedById,
		sessionDate: data.sessionDate,
		startTime: data.startTime,
		endTime: data.endTime,
	});
}

export async function updateSession(
	sessionId: string,
	institutionId: string,
	data: {
		subjectId?: string;
		conductedById?: string;
		sessionDate?: Date;
		startTime?: string;
		endTime?: string;
	},
) {
	const existing = await repo.findSessionById(sessionId, institutionId);
	if (!existing) throw notFound("Attendance session not found");

	return repo.updateSession(sessionId, institutionId, {
		...(data.subjectId !== undefined && { subjectId: data.subjectId }),
		...(data.conductedById !== undefined && {
			conductedById: data.conductedById,
		}),
		...(data.sessionDate && { sessionDate: data.sessionDate }),
		...(data.startTime !== undefined && { startTime: data.startTime }),
		...(data.endTime !== undefined && { endTime: data.endTime }),
	});
}

export async function deleteSession(sessionId: string, institutionId: string) {
	const existing = await repo.findSessionById(sessionId, institutionId);
	if (!existing) throw notFound("Attendance session not found");

	// Delete all records for this session
	await repo.deleteRecordsBySession(sessionId, institutionId);

	// Delete the session
	return repo.deleteSession(sessionId, institutionId);
}

// ─── Record operations ───────────────────────────────────────────────────────

export async function getSessionRecords(
	sessionId: string,
	institutionId: string,
) {
	// Verify session exists
	await getSession(sessionId, institutionId);
	return repo.findRecordsBySession(sessionId, institutionId);
}

export async function recordAttendance(
	data: {
		sessionId: string;
		studentId: string;
		status: string;
		justification?: string;
	},
	institutionId: string,
) {
	// Verify session exists
	await getSession(data.sessionId, institutionId);

	// Check if record already exists
	const existing = await repo.findRecordBySessionAndStudent(
		data.sessionId,
		data.studentId,
		institutionId,
	);

	if (existing) {
		// Update existing
		return repo.updateRecord(existing.id, institutionId, {
			status: data.status,
			justification: data.justification,
		});
	}

	// Create new
	return repo.insertRecord({
		id: randomUUID(),
		institutionId,
		sessionId: data.sessionId,
		studentId: data.studentId,
		status: data.status,
		justification: data.justification,
	});
}

export async function batchRecordAttendance(
	data: {
		sessionId: string;
		items: Array<{
			studentId: string;
			status: string;
			justification?: string;
		}>;
	},
	institutionId: string,
) {
	// Verify session exists
	await getSession(data.sessionId, institutionId);

	// Get existing records for this session
	const existing = await repo.findRecordsBySession(
		data.sessionId,
		institutionId,
	);
	const existingMap = new Map(existing.map((r) => [r.studentId, r]));

	// Separate into updates and inserts
	const toInsert: Array<{
		id: string;
		institutionId: string;
		sessionId: string;
		studentId: string;
		status: string;
		justification?: string;
	}> = [];

	const updates = [];

	for (const item of data.items) {
		const existing = existingMap.get(item.studentId);
		if (existing) {
			updates.push(
				repo.updateRecord(existing.id, institutionId, {
					status: item.status,
					justification: item.justification,
				}),
			);
		} else {
			toInsert.push({
				id: randomUUID(),
				institutionId,
				sessionId: data.sessionId,
				studentId: item.studentId,
				status: item.status,
				justification: item.justification,
			});
		}
	}

	// Execute all operations
	const results = [];

	if (toInsert.length > 0) {
		const inserted = await repo.insertManyRecords(toInsert);
		results.push(...inserted);
	}

	if (updates.length > 0) {
		const updated = await Promise.all(updates);
		results.push(...updated.filter(Boolean));
	}

	return results;
}

export async function updateAttendanceRecord(
	recordId: string,
	institutionId: string,
	data: {
		status?: string;
		justification?: string;
	},
) {
	const existing = await repo.findRecordById(recordId, institutionId);
	if (!existing) throw notFound("Attendance record not found");

	return repo.updateRecord(recordId, institutionId, {
		...(data.status && { status: data.status }),
		...(data.justification !== undefined && {
			justification: data.justification,
		}),
	});
}

export async function deleteAttendanceRecord(
	recordId: string,
	institutionId: string,
) {
	const existing = await repo.findRecordById(recordId, institutionId);
	if (!existing) throw notFound("Attendance record not found");

	return repo.deleteRecord(recordId, institutionId);
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getStudentHistory(
	studentId: string,
	institutionId: string,
	filters?: {
		classId?: string;
		startDate?: Date;
		endDate?: Date;
	},
) {
	return repo.findStudentHistory(institutionId, studentId, filters);
}

import { TRPCError } from "@trpc/server";
import * as repo from "./assessments.repo";

async function assertCanGrade(
	authUserId: string,
	callerRole: string,
	classId: string,
	subjectId: string,
	institutionId: string,
): Promise<string | null> {
	if (callerRole === "admin") return null; // admins can grade anything; no staff record required
	const staffRecord = await repo.findStaffByAuthUser(authUserId, institutionId);
	if (!staffRecord) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "No staff profile found",
		});
	}
	const assignment = await repo.findAssignment(
		staffRecord.id,
		classId,
		subjectId,
		institutionId,
	);
	if (!assignment) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not assigned to this subject in this class",
		});
	}
	return staffRecord.id;
}

export async function listForClass(
	institutionId: string,
	classId: string,
	subjectId: string,
	termId: string,
) {
	return repo.findByClassSubjectTerm(institutionId, classId, subjectId, termId);
}

export async function upsert(
	data: {
		studentId: string;
		classId: string;
		subjectId: string;
		termId: string;
		assessmentType: string;
		value: number | null;
	},
	institutionId: string,
	callerAuthUserId: string,
	callerRole: string,
) {
	const staffId = await assertCanGrade(
		callerAuthUserId,
		callerRole,
		data.classId,
		data.subjectId,
		institutionId,
	);
	return repo.upsertOne({ institutionId, ...data, enteredById: staffId });
}

export async function batchUpsert(
	items: Array<{
		studentId: string;
		classId: string;
		subjectId: string;
		termId: string;
		assessmentType: string;
		value: number | null;
	}>,
	institutionId: string,
	callerAuthUserId: string,
	callerRole: string,
) {
	// All items must share the same classId + subjectId (grade entry grid invariant).
	// Validate once against the first item; the grid guarantees the rest match.
	let staffId: string | null = null;
	if (items.length > 0) {
		staffId = await assertCanGrade(
			callerAuthUserId,
			callerRole,
			items[0].classId,
			items[0].subjectId,
			institutionId,
		);
	}
	const results = await Promise.all(
		items.map((item) =>
			repo.upsertOne({ institutionId, ...item, enteredById: staffId }),
		),
	);
	return results;
}

export async function getStudentResults(
	institutionId: string,
	studentId: string,
	termId: string,
) {
	return repo.findByStudentTerm(institutionId, studentId, termId);
}

export async function getCompletionMatrix(
	institutionId: string,
	classId: string,
): Promise<Record<string, Record<string, number>>> {
	const rows = await repo.findAllForClass(institutionId, classId);
	// matrix[termId][subjectId] = Set<studentId> of graded students
	const matrix: Record<string, Record<string, Set<string>>> = {};
	for (const row of rows) {
		if (row.value === null || row.value === undefined) continue;
		if (!matrix[row.termId]) matrix[row.termId] = {};
		if (!matrix[row.termId][row.subjectId])
			matrix[row.termId][row.subjectId] = new Set();
		matrix[row.termId][row.subjectId].add(row.studentId);
	}
	// Convert sets to counts
	const result: Record<string, Record<string, number>> = {};
	for (const [termId, subjects] of Object.entries(matrix)) {
		result[termId] = {};
		for (const [subjectId, students] of Object.entries(subjects)) {
			result[termId][subjectId] = students.size;
		}
	}
	return result;
}

export async function getCompletionBySubject(
	institutionId: string,
	classId: string,
	termId: string,
): Promise<{ subjectId: string; gradedCount: number }[]> {
	const rows = await repo.findByClassTerm(institutionId, classId, termId);
	const map = new Map<string, Set<string>>();
	for (const row of rows) {
		if (row.value === null || row.value === undefined) continue;
		if (!map.has(row.subjectId)) map.set(row.subjectId, new Set());
		map.get(row.subjectId)?.add(row.studentId);
	}
	return Array.from(map.entries()).map(([subjectId, students]) => ({
		subjectId,
		gradedCount: students.size,
	}));
}

export async function getClassAverages(
	institutionId: string,
	classId: string,
	termId: string,
): Promise<{ studentId: string; avg: number | null; graded: number }[]> {
	const rows = await repo.findByClassTerm(institutionId, classId, termId);
	// Group by studentId and compute avg across all subjects
	const map = new Map<string, number[]>();
	for (const row of rows) {
		if (row.value === null || row.value === undefined) continue;
		const v = Number(row.value);
		if (Number.isNaN(v)) continue;
		if (!map.has(row.studentId)) map.set(row.studentId, []);
		map.get(row.studentId)?.push(v);
	}
	return Array.from(map.entries()).map(([studentId, vals]) => ({
		studentId,
		graded: vals.length,
		avg: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
	}));
}

import type { GradeInput, GradesByStudent } from "../types";

/**
 * Turns the grade form values (`student_<id>` → score) into the grades to
 * upsert and the existing grades to delete (emptied or removed fields).
 */
export function buildGradeChanges(
	values: Record<string, string | number | undefined>,
	gradesByStudent: GradesByStudent,
	examId: string,
) {
	const inserts: GradeInput[] = [];
	const deletes: string[] = [];

	Object.entries(values).forEach(([field, rawValue]) => {
		if (!field.startsWith("student_")) return;
		const studentId = field.replace("student_", "");
		if (rawValue === "" || rawValue === undefined || rawValue === null) {
			const existing = gradesByStudent[studentId];
			if (existing?.id) {
				deletes.push(existing.id);
			}
			return;
		}
		const score = Number(rawValue);
		if (!Number.isNaN(score) && score >= 0 && score <= 20) {
			inserts.push({ studentId, examId, score });
		}
	});

	Object.entries(gradesByStudent).forEach(([studentId, entry]) => {
		const fieldName = `student_${studentId}`;
		if (!(fieldName in values) && entry?.id) {
			deletes.push(entry.id);
		}
	});

	return { inserts, deletes };
}

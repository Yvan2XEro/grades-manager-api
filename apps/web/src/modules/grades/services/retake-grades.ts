import type { ExamItem } from "../types";

/**
 * Resolve grades considering retake exams and scoring policy.
 * Groups exams by type (CC, EXAMEN) and applies scoring policy for retakes.
 *
 * @param studentGrades - All grades for a student
 * @param allExams - All exams (including retakes)
 * @returns Map of exam ID to effective score (with retake logic applied)
 */
export function resolveRetakeGrades(
	studentGrades: Array<{ examId: string; score: number }>,
	allExams: ExamItem[],
): Map<string, { score: number; isRetake: boolean }> {
	const gradeMap = new Map(studentGrades.map((g) => [g.examId, g.score]));

	const normalExams = allExams.filter((e) => e.sessionType === "normal");
	const retakeExams = allExams.filter((e) => e.sessionType === "retake");

	// Map retakes to their parent exams
	const retakesByParent = new Map<string, ExamItem>();
	for (const retake of retakeExams) {
		if (retake.parentExamId) {
			retakesByParent.set(retake.parentExamId, retake);
		}
	}

	const resolvedGrades = new Map<
		string,
		{ score: number; isRetake: boolean }
	>();

	for (const exam of normalExams) {
		const normalScore = gradeMap.get(exam.id);
		const retakeExam = retakesByParent.get(exam.id);

		if (retakeExam) {
			const retakeScore = gradeMap.get(retakeExam.id);

			if (retakeScore !== undefined) {
				const policy = retakeExam.scoringPolicy || "replace";

				if (policy === "replace") {
					// Replace: always use retake score if available
					resolvedGrades.set(exam.id, { score: retakeScore, isRetake: true });
				} else {
					// best_of: use the higher score
					if (normalScore !== undefined) {
						const bestScore = Math.max(normalScore, retakeScore);
						resolvedGrades.set(exam.id, {
							score: bestScore,
							isRetake:
								bestScore === retakeScore && retakeScore !== normalScore,
						});
					} else {
						resolvedGrades.set(exam.id, { score: retakeScore, isRetake: true });
					}
				}
			} else if (normalScore !== undefined) {
				// No retake grade, use normal score
				resolvedGrades.set(exam.id, { score: normalScore, isRetake: false });
			}
		} else if (normalScore !== undefined) {
			// No retake, use normal grade
			resolvedGrades.set(exam.id, { score: normalScore, isRetake: false });
		}
	}

	return resolvedGrades;
}

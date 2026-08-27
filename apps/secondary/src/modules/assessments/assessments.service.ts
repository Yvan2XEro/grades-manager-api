import * as repo from "./assessments.repo";

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
	enteredById?: string | null,
) {
	return repo.upsertOne({ institutionId, ...data, enteredById });
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
	enteredById?: string | null,
) {
	const results = await Promise.all(
		items.map((item) =>
			repo.upsertOne({ institutionId, ...item, enteredById }),
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

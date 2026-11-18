import * as repo from "./comments.repo";

export async function listByClassSubjectTerm(
	institutionId: string,
	classId: string,
	subjectId: string,
	termId: string,
) {
	return repo.findByClassSubjectTerm(institutionId, classId, subjectId, termId);
}

export async function upsertComment(data: {
	institutionId: string;
	studentId: string;
	subjectId: string;
	termId: string;
	classId: string;
	comment: string;
}) {
	if (!data.comment.trim()) {
		await repo.deleteComment(
			data.studentId,
			data.subjectId,
			data.termId,
			data.classId,
			data.institutionId,
		);
		return null;
	}
	return repo.upsertComment(data);
}

export async function batchUpsertComments(
	institutionId: string,
	items: Array<{
		studentId: string;
		subjectId: string;
		termId: string;
		classId: string;
		comment: string;
	}>,
) {
	const results = await Promise.all(
		items.map((item) => upsertComment({ ...item, institutionId })),
	);
	return { saved: results.filter(Boolean).length };
}

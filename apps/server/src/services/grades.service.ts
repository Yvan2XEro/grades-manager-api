import { TRPCError } from "@trpc/server";
import * as examsRepo from "../modules/exams/exams.repo";
import * as repo from "../repositories/grades.repo";

export async function upsertNote(
	studentId: string,
	examId: string,
	score: number,
) {
	const exam = await examsRepo.findById(examId);
	if (!exam) throw new TRPCError({ code: "NOT_FOUND" });
	if (exam.isLocked) throw new TRPCError({ code: "FORBIDDEN" });
	try {
		return await repo.upsert({
			student: studentId,
			exam: examId,
			score: score.toString(),
		});
	} catch (_e) {
		throw new TRPCError({ code: "CONFLICT" });
	}
}

export async function updateNote(id: string, score: number) {
	const grade = await repo.findById(id);
	if (!grade) throw new TRPCError({ code: "NOT_FOUND" });
	const exam = await examsRepo.findById(grade.exam);
	if (exam?.isLocked) throw new TRPCError({ code: "FORBIDDEN" });
	return repo.update(id, score.toString());
}

export async function deleteNote(id: string) {
	const grade = await repo.findById(id);
	if (!grade) throw new TRPCError({ code: "NOT_FOUND" });
	const exam = await examsRepo.findById(grade.exam);
	if (exam?.isLocked) throw new TRPCError({ code: "FORBIDDEN" });
	await repo.remove(id);
}

export async function listByExam(opts: Parameters<typeof repo.listByExam>[0]) {
	return repo.listByExam(opts);
}

export async function listByStudent(
	opts: Parameters<typeof repo.listByStudent>[0],
) {
	return repo.listByStudent(opts);
}

export async function listByClassCourse(
	opts: Parameters<typeof repo.listByClassCourse>[0],
) {
	return repo.listByClassCourse(opts);
}

export async function avgForExam(examId: string) {
	return repo.avgForExam(examId);
}

export async function avgForCourse(courseId: string) {
	return repo.avgForCourse(courseId);
}

export async function avgForStudentInCourse(
	studentId: string,
	courseId: string,
) {
	return repo.avgForStudentInCourse(studentId, courseId);
}

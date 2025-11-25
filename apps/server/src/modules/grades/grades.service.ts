import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { notFound } from "../_shared/errors";
import * as examsRepo from "../exams/exams.repo";
import * as studentsRepo from "../students/students.repo";
import * as repo from "./grades.repo";

const _CSV_HEADERS = ["registrationNumber", "score"];

function ensureExamEditable(exam: schema.Exam | undefined | null) {
	if (!exam) throw notFound();
	if (exam.isLocked) throw new TRPCError({ code: "FORBIDDEN" });
}

export async function upsertNote(
	studentId: string,
	examId: string,
	score: number,
) {
	const exam = await examsRepo.findById(examId);
	ensureExamEditable(exam);
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
	if (!grade) throw notFound();
	const exam = await examsRepo.findById(grade.exam);
	ensureExamEditable(exam);
	return repo.update(id, score.toString());
}

export async function deleteNote(id: string) {
	const grade = await repo.findById(id);
	if (!grade) throw notFound();
	const exam = await examsRepo.findById(grade.exam);
	ensureExamEditable(exam);
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

export async function exportClassCourseCsv(classCourseId: string) {
	const rows = await db
		.select({
			registrationNumber: schema.students.registrationNumber,
			examId: schema.exams.id,
			score: schema.grades.score,
		})
		.from(schema.grades)
		.innerJoin(schema.exams, eq(schema.grades.exam, schema.exams.id))
		.innerJoin(
			schema.classCourses,
			eq(schema.exams.classCourse, schema.classCourses.id),
		)
		.innerJoin(schema.students, eq(schema.grades.student, schema.students.id))
		.where(eq(schema.classCourses.id, classCourseId));

	const header = ["registrationNumber", "examId", "score"];
	const body = rows
		.map((row) => `${row.registrationNumber},${row.examId},${row.score}`)
		.join("\n");
	return [header.join(","), body].filter(Boolean).join("\n");
}

export async function importGradesFromCsv(examId: string, csv: string) {
	const exam = await examsRepo.findById(examId);
	ensureExamEditable(exam);
	const lines = csv
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
	if (!lines.length) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "CSV is empty",
		});
	}
        const headers = lines
                .shift()
                ?.split(",")
                .map((h) => h.trim()) ?? ["registrationNumber", "score"];
	const regIdx = headers.indexOf("registrationNumber");
	const scoreIdx = headers.indexOf("score");
	if (regIdx === -1 || scoreIdx === -1) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "CSV must include registrationNumber and score columns",
		});
	}

	const result = {
		imported: 0,
		errors: [] as string[],
	};

	for (const line of lines) {
		const cells = line.split(",");
		const registrationNumber = cells[regIdx]?.trim();
		const scoreValue = Number(cells[scoreIdx]);
		if (!registrationNumber || Number.isNaN(scoreValue)) {
			result.errors.push(`Invalid row: ${line}`);
			continue;
		}
		const student =
			await studentsRepo.findByRegistrationNumber(registrationNumber);
		if (!student) {
			result.errors.push(`Unknown registration: ${registrationNumber}`);
			continue;
		}
		await repo.upsert({
			exam: examId,
			student: student.id,
			score: scoreValue.toString(),
		});
		result.imported++;
	}
	return result;
}

export async function getStudentTranscript(studentId: string) {
	const student = await studentsRepo.findById(studentId);
	if (!student) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
	}

	const courseScores = await db
		.select({
			courseId: schema.courses.id,
			courseName: schema.courses.name,
			teachingUnitId: schema.teachingUnits.id,
			unitName: schema.teachingUnits.name,
			unitCode: schema.teachingUnits.code,
			credits: schema.courses.credits,
			score: sql<number>`
				sum(${schema.grades.score} * (${schema.exams.percentage} / 100.0))
			`,
		})
		.from(schema.grades)
		.innerJoin(schema.exams, eq(schema.grades.exam, schema.exams.id))
		.innerJoin(
			schema.classCourses,
			eq(schema.exams.classCourse, schema.classCourses.id),
		)
		.innerJoin(
			schema.courses,
			eq(schema.classCourses.course, schema.courses.id),
		)
		.innerJoin(
			schema.teachingUnits,
			eq(schema.courses.teachingUnitId, schema.teachingUnits.id),
		)
		.where(eq(schema.grades.student, studentId))
		.groupBy(
			schema.courses.id,
			schema.teachingUnits.id,
			schema.teachingUnits.name,
			schema.teachingUnits.code,
		);

	const units = new Map<
		string,
		{
			id: string;
			name: string;
			code: string;
			courses: Array<{
				id: string;
				name: string;
				average: number;
				credits: number;
			}>;
			credits: number;
			scoreSum: number;
		}
	>();

	for (const course of courseScores) {
		const unit = units.get(course.teachingUnitId) ?? {
			id: course.teachingUnitId,
			name: course.unitName,
			code: course.unitCode,
			courses: [],
			credits: 0,
			scoreSum: 0,
		};
		unit.courses.push({
			id: course.courseId,
			name: course.courseName,
			average: Number(course.score ?? 0),
			credits: course.credits,
		});
		unit.credits += course.credits;
		unit.scoreSum += Number(course.score ?? 0) * course.credits;
		units.set(course.teachingUnitId, unit);
	}

	const unitSummaries = Array.from(units.values()).map((unit) => ({
		id: unit.id,
		name: unit.name,
		code: unit.code,
		average: unit.credits ? unit.scoreSum / unit.credits : 0,
		courses: unit.courses,
	}));

	const totalCredits = unitSummaries.reduce(
		(sum, unit) =>
			sum + unit.courses.reduce((c, course) => c + course.credits, 0),
		0,
	);
	const weightedSum = unitSummaries.reduce((sum, unit) => {
		return (
			sum +
			unit.courses.reduce(
				(courseSum, course) => courseSum + course.average * course.credits,
				0,
			)
		);
	}, 0);

	return {
		studentId,
		units: unitSummaries,
		overallAverage: totalCredits ? weightedSum / totalCredits : 0,
	};
}

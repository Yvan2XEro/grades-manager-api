import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { notFound } from "../_shared/errors";
import * as examsRepo from "../exams/exams.repo";
import {
	type ExamActorAccess,
	type ExamEditorActor,
	ensureActorCanEditExam,
} from "../exam-grade-editors/exam-grade-editors.service";
import * as courseEnrollments from "../student-course-enrollments/student-course-enrollments.service";
import * as studentsRepo from "../students/students.repo";
import * as repo from "./grades.repo";

const _CSV_HEADERS = ["registrationNumber", "score"];

async function requireExamForInstitution(
	examId: string,
	institutionId: string,
) {
	const exam = await examsRepo.findById(examId);
	if (!exam || exam.institutionId !== institutionId) {
		throw notFound();
	}
	return exam;
}

async function requireClassCourseForInstitution(
	classCourseId: string,
	institutionId: string,
) {
	const classCourse = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
	});
	if (!classCourse) throw notFound("Class course not found");
	return classCourse;
}

async function requireCourseForInstitution(
	courseId: string,
	institutionId: string,
) {
	const [course] = await db
		.select({
			id: schema.courses.id,
			institutionId: schema.programs.institutionId,
		})
		.from(schema.courses)
		.innerJoin(schema.programs, eq(schema.programs.id, schema.courses.program))
		.where(eq(schema.courses.id, courseId))
		.limit(1);
	if (!course || course.institutionId !== institutionId) {
		throw notFound("Course not found");
	}
	return course;
}

function ensureExamEditable(exam: schema.Exam | undefined | null) {
	if (!exam) throw notFound();
	if (exam.isLocked) throw new TRPCError({ code: "FORBIDDEN" });
}

export async function upsertNote(
	studentId: string,
	examId: string,
	score: number,
	institutionId: string,
	actor: ExamEditorActor,
) {
	const { exam, access } = await ensureActorCanEditExam({
		examId,
		institutionId,
		actor,
	});
	ensureExamEditable(exam);
	await courseEnrollments.ensureStudentRegistered(studentId, exam.classCourse);
	try {
		const saved = await repo.upsert({
			student: studentId,
			exam: examId,
			score: score.toString(),
		});
		await maybeLogDelegateGradeEdit({
			access,
			actor,
			exam,
			action: "write",
			studentId,
			gradeId: saved.id,
			scoreAfter: score,
		});
		return saved;
	} catch (_e) {
		throw new TRPCError({ code: "CONFLICT" });
	}
}

export async function updateNote(
	id: string,
	score: number,
	institutionId: string,
	actor: ExamEditorActor,
) {
	const grade = await repo.findById(id);
	if (!grade) throw notFound();
	const { exam, access } = await ensureActorCanEditExam({
		examId: grade.exam,
		institutionId,
		actor,
	});
	ensureExamEditable(exam);
	await courseEnrollments.ensureStudentRegistered(
		grade.student,
		exam.classCourse,
	);
	const updated = await repo.update(id, score.toString());
	await maybeLogDelegateGradeEdit({
		access,
		actor,
		exam,
		action: "write",
		studentId: grade.student,
		gradeId: grade.id,
		scoreBefore: Number(grade.score),
		scoreAfter: score,
	});
	return updated;
}

export async function deleteNote(
	id: string,
	institutionId: string,
	actor: ExamEditorActor,
) {
	const grade = await repo.findById(id);
	if (!grade) throw notFound();
	const { exam, access } = await ensureActorCanEditExam({
		examId: grade.exam,
		institutionId,
		actor,
	});
	ensureExamEditable(exam);
	await repo.remove(id);
	await maybeLogDelegateGradeEdit({
		access,
		actor,
		exam,
		action: "delete",
		studentId: grade.student,
		gradeId: grade.id,
		scoreBefore: Number(grade.score),
	});
}

export async function listByExam(
	opts: Parameters<typeof repo.listByExam>[0],
	institutionId: string,
) {
	await requireExamForInstitution(opts.examId, institutionId);
	return repo.listByExam(opts);
}

export async function listByStudent(
	opts: Parameters<typeof repo.listByStudent>[0],
	institutionId: string,
) {
	await studentsRepo.findById(opts.studentId, institutionId);
	return repo.listByStudent(opts);
}

export async function listByClassCourse(
	opts: Parameters<typeof repo.listByClassCourse>[0],
	institutionId: string,
) {
	await requireClassCourseForInstitution(opts.classCourseId, institutionId);
	return repo.listByClassCourse(opts);
}

export async function avgForExam(examId: string, institutionId: string) {
	await requireExamForInstitution(examId, institutionId);
	return repo.avgForExam(examId);
}

export async function avgForCourse(courseId: string, institutionId: string) {
	await requireCourseForInstitution(courseId, institutionId);
	return repo.avgForCourse(courseId);
}

export async function avgForStudentInCourse(
	studentId: string,
	courseId: string,
	institutionId: string,
) {
	await studentsRepo.findById(studentId, institutionId);
	await requireCourseForInstitution(courseId, institutionId);
	return repo.avgForStudentInCourse(studentId, courseId);
}

export async function exportClassCourseCsv(
	classCourseId: string,
	institutionId: string,
) {
	await requireClassCourseForInstitution(classCourseId, institutionId);
	// Developer note: when adjusting CSV/PDF exports, include institution metadata
	// (nameFr/nameEn, contactEmail, logoUrl, etc.) in the generated headers.
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

export async function importGradesFromCsv(
	examId: string,
	csv: string,
	institutionId: string,
	actor: ExamEditorActor,
) {
	const { exam, access } = await ensureActorCanEditExam({
		examId,
		institutionId,
		actor,
	});
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
		const student = await studentsRepo.findByRegistrationNumber(
			registrationNumber,
			institutionId,
		);
		if (!student) {
			result.errors.push(`Unknown registration: ${registrationNumber}`);
			continue;
		}
		try {
			await courseEnrollments.ensureStudentRegistered(
				student.id,
				exam.classCourse,
			);
		} catch (_err) {
			result.errors.push(
				`Student ${registrationNumber} is not enrolled for this course`,
			);
			continue;
		}
		const saved = await repo.upsert({
			exam: examId,
			student: student.id,
			score: scoreValue.toString(),
		});
		result.imported++;
		await maybeLogDelegateGradeEdit({
			access,
			actor,
			exam,
			action: "import",
			studentId: student.id,
			gradeId: saved.id,
			scoreAfter: scoreValue,
			metadata: { source: "csv" },
		});
	}
	return result;
}

export async function getStudentTranscript(
	studentId: string,
	institutionId: string,
) {
	const student = await studentsRepo.findById(studentId, institutionId);
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
			unitCredits: schema.teachingUnits.credits,
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
			}>;
			credits: number;
			scoreSum: number;
			courseCount: number;
		}
	>();

	for (const course of courseScores) {
		const unit = units.get(course.teachingUnitId) ?? {
			id: course.teachingUnitId,
			name: course.unitName,
			code: course.unitCode,
			courses: [],
			credits: Number(course.unitCredits ?? 0),
			scoreSum: 0,
			courseCount: 0,
		};
		unit.courses.push({
			id: course.courseId,
			name: course.courseName,
			average: Number(course.score ?? 0),
		});
		unit.scoreSum += Number(course.score ?? 0);
		unit.courseCount += 1;
		units.set(course.teachingUnitId, unit);
	}

	const unitSummaries = Array.from(units.values()).map((unit) => ({
		id: unit.id,
		name: unit.name,
		code: unit.code,
		average: unit.courseCount ? unit.scoreSum / unit.courseCount : 0,
		credits: unit.credits,
		courses: unit.courses,
	}));

	const totalCredits = unitSummaries.reduce(
		(sum, unit) => sum + unit.credits,
		0,
	);
	const weightedSum = unitSummaries.reduce(
		(sum, unit) => sum + unit.average * unit.credits,
		0,
	);

	return {
		studentId,
		units: unitSummaries,
		overallAverage: totalCredits ? weightedSum / totalCredits : 0,
	};
}

type DelegateLogInput = {
	access: ExamActorAccess;
	actor: ExamEditorActor;
	exam: schema.Exam & { classCourseRef?: schema.ClassCourse | null };
	action: schema.GradeEditLogAction;
	studentId: string;
	gradeId?: string | null;
	scoreBefore?: number | null;
	scoreAfter?: number | null;
	metadata?: Record<string, unknown>;
};

async function maybeLogDelegateGradeEdit(input: DelegateLogInput) {
	if (input.access !== "delegate") return;
	const actorProfileId = input.actor.profileId;
	if (!actorProfileId) return;
	await db.insert(schema.gradeEditLogs).values({
		institutionId: input.exam.institutionId,
		examId: input.exam.id,
		classCourseId: input.exam.classCourse,
		studentId: input.studentId,
		gradeId: input.gradeId ?? null,
		actorProfileId,
		actorRole: "delegate",
		isDelegate: true,
		action: input.action,
		scoreBefore:
			typeof input.scoreBefore === "number"
				? input.scoreBefore.toString()
				: null,
		scoreAfter:
			typeof input.scoreAfter === "number"
				? input.scoreAfter.toString()
				: null,
		metadata: input.metadata ?? {},
	});
}

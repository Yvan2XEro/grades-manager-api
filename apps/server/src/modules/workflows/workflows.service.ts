import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as classesRepo from "../classes/classes.repo";
import * as enrollmentsRepo from "../enrollments/enrollments.repo";
import * as examsService from "../exams/exams.service";
import * as notifications from "../notifications/notifications.service";
import * as windowsRepo from "./workflows.repo";

async function requireExam(examId: string, institutionId: string) {
	const exam = await db.query.exams.findFirst({
		where: and(
			eq(schema.exams.id, examId),
			eq(schema.exams.institutionId, institutionId),
		),
	});
	if (!exam) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Exam not found" });
	}
	return exam;
}

async function requireClass(classId: string, institutionId: string) {
	const klass = await classesRepo.findById(classId, institutionId);
	if (!klass)
		throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
	return klass;
}

async function requireAcademicYear(
	academicYearId: string,
	institutionId: string,
) {
	const year = await db.query.academicYears.findFirst({
		where: and(
			eq(schema.academicYears.id, academicYearId),
			eq(schema.academicYears.institutionId, institutionId),
		),
	});
	if (!year) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Academic year not found",
		});
	}
	return year;
}

async function requireClassCourse(
	classCourseId: string,
	institutionId: string,
) {
	const classCourse = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
	});
	if (!classCourse) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Class course not found",
		});
	}
	return classCourse;
}

export async function validateGrades(
	examId: string,
	approverId: string | null | undefined,
	institutionId: string,
) {
	await requireExam(examId, institutionId);
	const updated = await examsService.validateExam(
		examId,
		approverId ?? null,
		"approved",
		institutionId,
	);
	await examsService.setLock(examId, true, institutionId);
	await notifications.registerWorkflowAlert(
		"grade_validated",
		{ examId },
		approverId,
	);
	return updated;
}

export async function toggleEnrollmentWindow(
	classId: string,
	academicYearId: string,
	action: "open" | "close",
	institutionId: string,
) {
	await requireClass(classId, institutionId);
	await requireAcademicYear(academicYearId, institutionId);
	const { items } = await enrollmentsRepo.list({
		classId,
		academicYearId,
		status: undefined,
		institutionId,
	});
	if (!items.length) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Class or academic year not found for enrollment window",
		});
	}
	const nextStatus: schema.EnrollmentWindowStatus =
		action === "open" ? "open" : "closed";
	const window = await windowsRepo.upsertWindow(
		classId,
		academicYearId,
		nextStatus,
		institutionId,
	);
	await notifications.registerWorkflowAlert(`enrollment_${nextStatus}`, {
		classId,
		academicYearId,
		status: nextStatus,
	});
	return window;
}

export async function listEnrollmentWindows(institutionId: string) {
	return windowsRepo.listWindows(institutionId);
}

export async function triggerAttendanceAlert(
	classCourseId: string,
	severity: "info" | "warning" | "critical",
	message: string,
	recipientId: string | undefined,
	institutionId: string,
) {
	await requireClassCourse(classCourseId, institutionId);
	await notifications.registerWorkflowAlert(
		"attendance_alert",
		{ classCourseId, severity, message },
		recipientId,
	);
	return { status: "queued" };
}

export async function closeExpiredApprovedExams() {
	const staleExams = await db.query.exams.findMany({
		where: (t, { and, eq, lt }) =>
			and(
				eq(t.status, "approved"),
				eq(t.isLocked, false),
				lt(t.date, new Date()),
			),
		limit: 20,
	});
	for (const exam of staleExams) {
		await examsService.setLock(exam.id, true, exam.institutionId);
		await notifications.registerWorkflowAlert("exam_locked", {
			examId: exam.id,
		});
	}
	return staleExams.length;
}

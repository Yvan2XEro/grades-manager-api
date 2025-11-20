import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as repo from "./enrollments.repo";

async function ensureStudent(studentId: string) {
	const student = await db.query.students.findFirst({
		where: eq(schema.students.id, studentId),
	});
	if (!student) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
	}
	return student;
}

async function ensureClass(classId: string) {
	const klass = await db.query.classes.findFirst({
		where: eq(schema.classes.id, classId),
	});
	if (!klass) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
	}
	return klass;
}

async function ensureAcademicYear(academicYearId: string) {
	const year = await db.query.academicYears.findFirst({
		where: eq(schema.academicYears.id, academicYearId),
	});
	if (!year) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Academic year not found",
		});
	}
	return year;
}

export async function createEnrollment(data: schema.NewEnrollment) {
	await ensureStudent(data.studentId);
	await ensureClass(data.classId);
	await ensureAcademicYear(data.academicYearId);
	return repo.create(data);
}

export async function updateEnrollment(
	id: string,
	data: Partial<schema.NewEnrollment>,
) {
	const existing = await repo.findById(id);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	if (data.studentId) await ensureStudent(data.studentId);
	if (data.classId) await ensureClass(data.classId);
	if (data.academicYearId) await ensureAcademicYear(data.academicYearId);
	return repo.update(id, data);
}

export async function updateStatus(
	id: string,
	status: schema.EnrollmentStatus,
) {
	const existing = await repo.findById(id);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	return repo.update(id, { status, exitedAt: new Date() });
}

export async function listEnrollments(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}

export async function getEnrollmentById(id: string) {
	const enrollment = await repo.findById(id);
	if (!enrollment) throw new TRPCError({ code: "NOT_FOUND" });
	return enrollment;
}

export async function closeActiveEnrollment(
	studentId: string,
	status: schema.EnrollmentStatus = "completed",
) {
	return repo.closeActive(studentId, status);
}

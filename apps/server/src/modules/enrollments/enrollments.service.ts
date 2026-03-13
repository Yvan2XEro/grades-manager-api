import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as repo from "./enrollments.repo";

async function ensureStudent(studentId: string, institutionId: string) {
	const student = await db.query.students.findFirst({
		where: and(
			eq(schema.students.id, studentId),
			eq(schema.students.institutionId, institutionId),
		),
	});
	if (!student) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Student not found",
		});
	}
	return student;
}

async function ensureClass(classId: string, institutionId: string) {
	const klass = await db.query.classes.findFirst({
		where: and(
			eq(schema.classes.id, classId),
			eq(schema.classes.institutionId, institutionId),
		),
	});
	if (!klass) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
	}
	return klass;
}

async function ensureAcademicYear(
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

export async function createEnrollment(
	data: Omit<schema.NewEnrollment, "institutionId"> & {
		institutionId?: string;
	},
	institutionId: string,
) {
	const student = await ensureStudent(data.studentId, institutionId);
	const klass = await ensureClass(data.classId, institutionId);
	if (
		student.institutionId !== institutionId ||
		klass.institutionId !== institutionId
	) {
		throw new TRPCError({ code: "NOT_FOUND" });
	}
	await ensureAcademicYear(data.academicYearId, institutionId);
	return repo.create({ ...data, institutionId });
}

export async function updateEnrollment(
	id: string,
	data: Partial<schema.NewEnrollment>,
	institutionId: string,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	if (data.studentId) await ensureStudent(data.studentId, institutionId);
	let updateData = data;
	if (data.classId) {
		await ensureClass(data.classId, institutionId);
		updateData = { ...data, institutionId };
	}
	if (data.academicYearId) {
		await ensureAcademicYear(data.academicYearId, institutionId);
	}
	return repo.update(id, updateData, institutionId);
}

const TERMINAL_ENROLLMENT_STATUSES: schema.EnrollmentStatus[] = [
	"completed",
	"withdrawn",
];

export async function updateStatus(
	id: string,
	status: schema.EnrollmentStatus,
	institutionId: string,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	const isTerminal = TERMINAL_ENROLLMENT_STATUSES.includes(status);
	const exitedAt = isTerminal ? new Date() : null;
	return repo.update(id, { status, exitedAt }, institutionId);
}

export async function deleteEnrollment(id: string, institutionId: string) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
	if (existing.status === "active") {
		// Check if there are course enrollments with grades before deleting active enrollments
		const courseEnrollments = await db.query.studentCourseEnrollments.findMany({
			where: and(
				eq(schema.studentCourseEnrollments.studentId, existing.studentId),
				eq(schema.studentCourseEnrollments.sourceClassId, existing.classId),
			),
		});
		if (courseEnrollments.length > 0) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message:
					"Cannot delete an active enrollment with existing course enrollments. Change status to withdrawn first.",
			});
		}
	}
	return repo.deleteById(id, institutionId);
}

export async function listEnrollments(
	opts: Omit<Parameters<typeof repo.list>[0], "institutionId"> & {
		institutionId?: string;
	},
	institutionId: string,
) {
	return repo.list({ ...opts, institutionId });
}

export async function getEnrollmentById(id: string, institutionId: string) {
	const enrollment = await repo.findById(id, institutionId);
	if (!enrollment) throw new TRPCError({ code: "NOT_FOUND" });
	return enrollment;
}

export async function closeActiveEnrollment(
	studentId: string,
	status: schema.EnrollmentStatus = "completed",
	institutionId?: string,
	// biome-ignore lint/suspicious/noExplicitAny: drizzle tx type differs from DbInstance union
	txDb?: any,
) {
	return repo.closeActive(studentId, status, institutionId, txDb);
}

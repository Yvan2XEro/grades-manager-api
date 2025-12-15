import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { normalizeCode } from "@/lib/strings";
import * as studentsRepo from "@/modules/students/students.repo";
import * as schema from "../../db/schema/app-schema";
import { transaction } from "../_shared/db-transaction";
import { conflict, notFound } from "../_shared/errors";
import * as enrollmentsRepo from "../enrollments/enrollments.repo";
import * as programOptionsRepo from "../program-options/program-options.repo";
import * as repo from "./classes.repo";

async function loadProgram(programId: string, institutionId: string) {
	const program = await db.query.programs.findFirst({
		where: and(
			eq(schema.programs.id, programId),
			eq(schema.programs.institutionId, institutionId),
		),
	});
	if (!program) throw notFound("Program not found");
	return program;
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
	if (!year) throw notFound("Academic year not found");
	return year;
}

async function ensurePrimaryCycle(facultyId: string) {
	const existing = await db.query.studyCycles.findFirst({
		where: eq(schema.studyCycles.facultyId, facultyId),
		orderBy: (cycles, helpers) => helpers.asc(cycles.createdAt),
	});
	if (existing) return existing;
	const [created] = await db
		.insert(schema.studyCycles)
		.values({
			facultyId,
			code: "default",
			name: "Default Cycle",
			description: null,
			totalCreditsRequired: 180,
			durationYears: 3,
		})
		.returning();
	return created;
}

async function ensureCycleLevel(
	program: schema.Program,
	cycleLevelId?: string,
) {
	if (cycleLevelId) {
		const level = await db.query.cycleLevels.findFirst({
			where: eq(schema.cycleLevels.id, cycleLevelId),
		});
		if (!level) throw notFound("Cycle level not found");
		const cycle = await db.query.studyCycles.findFirst({
			where: eq(schema.studyCycles.id, level.cycleId),
		});
		if (!cycle) throw notFound("Study cycle not found");
		if (cycle.facultyId !== program.faculty) {
			throw conflict("Cycle level does not belong to program faculty");
		}
		return level.id;
	}
	const cycle = await ensurePrimaryCycle(program.faculty);
	const existing = await db.query.cycleLevels.findFirst({
		where: eq(schema.cycleLevels.cycleId, cycle.id),
		orderBy: (levels, helpers) => helpers.asc(levels.orderIndex),
	});
	if (existing) return existing.id;
	const [created] = await db
		.insert(schema.cycleLevels)
		.values({
			cycleId: cycle.id,
			orderIndex: 1,
			code: "L1",
			name: "Level 1",
			minCredits: 60,
		})
		.returning();
	return created.id;
}

async function ensureProgramOption(
	program: schema.Program,
	programOptionId?: string,
) {
	if (!programOptionId) {
		const existing = await db.query.programOptions.findFirst({
			where: eq(schema.programOptions.programId, program.id),
			orderBy: (options, helpers) => helpers.asc(options.createdAt),
		});
		if (existing) return existing.id;
		const option = await programOptionsRepo.create({
			programId: program.id,
			name: "Default option",
			code: `default-${program.id.slice(0, 4)}`,
			institutionId: program.institutionId,
		});
		return option.id;
	}
	const option = await db.query.programOptions.findFirst({
		where: eq(schema.programOptions.id, programOptionId),
	});
	if (!option) throw notFound("Program option not found");
	if (option.programId !== program.id) {
		throw conflict("Program option does not belong to program");
	}
	return option.id;
}

async function ensureSemester(semesterId?: string) {
	if (semesterId) {
		const semester = await db.query.semesters.findFirst({
			where: eq(schema.semesters.id, semesterId),
		});
		if (!semester) throw notFound("Semester not found");
		return semester.id;
	}
	const fallback = await db.query.semesters.findFirst({
		orderBy: (semesters, helpers) => helpers.asc(semesters.orderIndex),
	});
	if (fallback) return fallback.id;
	const [created] = await db
		.insert(schema.semesters)
		.values({
			code: "S1",
			name: "Semester 1",
			orderIndex: 1,
		})
		.returning();
	return created.id;
}

export async function createClass(
	data: Parameters<typeof repo.create>[0],
	institutionId: string,
) {
	const program = await loadProgram(data.program, institutionId);
	const academicYear = await ensureAcademicYear(
		data.academicYear,
		institutionId,
	);
	const cycleLevelId = await ensureCycleLevel(program, data.cycleLevelId);
	const programOptionId = await ensureProgramOption(
		program,
		data.programOptionId,
	);
	const semesterId = await ensureSemester(data.semesterId);
	return repo.create({
		...data,
		academicYear: academicYear.id,
		institutionId,
		code: normalizeCode(data.code),
		cycleLevelId,
		programOptionId,
		semesterId,
	});
}

export async function updateClass(
	id: string,
	data: Parameters<typeof repo.update>[2],
	institutionId: string,
) {
	const existing = await repo.findById(id, institutionId);
	if (!existing) throw notFound();
	const program = await loadProgram(
		data.program ?? existing.program,
		institutionId,
	);
	const academicYear =
		data.academicYear !== undefined
			? await ensureAcademicYear(data.academicYear, institutionId)
			: existing.academicYearInfo;
	const desiredLevelId =
		data.cycleLevelId !== undefined ? data.cycleLevelId : existing.cycleLevelId;
	const cycleLevelId = await ensureCycleLevel(program, desiredLevelId);
	const desiredProgramOptionId =
		data.programOptionId !== undefined
			? data.programOptionId
			: existing.programOptionId;
	const programOptionId = await ensureProgramOption(
		program,
		desiredProgramOptionId,
	);
	const semesterId = data.semesterId
		? await ensureSemester(data.semesterId)
		: undefined;
	return repo.update(id, institutionId, {
		...data,
		program: program.id,
		academicYear: academicYear.id ?? existing.academicYear,
		cycleLevelId,
		programOptionId,
		code: data.code ? normalizeCode(data.code) : undefined,
		semesterId,
	});
}

export async function deleteClass(id: string, institutionId: string) {
	const klass = await repo.findById(id, institutionId);
	if (!klass) throw notFound();

	const students = await studentsRepo.list({ classId: id, institutionId });
	if (students.items.length) {
		const { items } = await repo.list(institutionId, {
			programId: klass.program,
			academicYearId: klass.academicYear,
		});
		const target = items.find((c) => c.id !== id);
		if (!target) throw conflict("Cannot delete class with students");
		for (const s of students.items) {
			await transferStudent(s.id, target.id, institutionId);
		}
	}

	await repo.remove(id, institutionId);
}

export async function listClasses(
	opts: Parameters<typeof repo.list>[1],
	institutionId: string,
) {
	return repo.list(institutionId, opts);
}

export async function getClassById(id: string, institutionId: string) {
	const item = await repo.findById(id, institutionId);
	if (!item) throw notFound();
	return item;
}

export async function getClassByCode(
	code: string,
	academicYearId: string,
	institutionId: string,
) {
	const item = await repo.findByCode(
		normalizeCode(code),
		academicYearId,
		institutionId,
	);
	if (!item) throw notFound();
	return item;
}

export async function transferStudent(
	studentId: string,
	toClassId: string,
	institutionId: string,
) {
	const student = await studentsRepo.findById(studentId, institutionId);
	if (!student) throw notFound("Student not found");
	const target = await repo.findById(toClassId, institutionId);
	if (!target) throw notFound("Class not found");
	await transaction(async (tx) => {
		await tx
			.update(schema.students)
			.set({ class: toClassId })
			.where(eq(schema.students.id, studentId));
	});
	await enrollmentsRepo.closeActive(studentId, "completed", institutionId);
	await enrollmentsRepo.create({
		studentId,
		classId: toClassId,
		academicYearId: target.academicYear,
		institutionId,
		status: "active",
	});
	return studentsRepo.findById(studentId, institutionId);
}

export async function searchClasses(
	opts: Parameters<typeof repo.search>[0],
	institutionId: string,
) {
	return repo.search(opts, institutionId);
}

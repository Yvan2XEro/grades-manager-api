import { eq } from "drizzle-orm";
import { db } from "@/db";
import { normalizeCode } from "@/lib/strings";
import * as studentsRepo from "@/modules/students/students.repo";
import * as schema from "../../db/schema/app-schema";
import { transaction } from "../_shared/db-transaction";
import { conflict, notFound } from "../_shared/errors";
import * as enrollmentsRepo from "../enrollments/enrollments.repo";
import * as programOptionsRepo from "../program-options/program-options.repo";
import * as repo from "./classes.repo";

async function loadProgram(programId: string) {
	const program = await db.query.programs.findFirst({
		where: eq(schema.programs.id, programId),
	});
	if (!program) throw notFound("Program not found");
	return program;
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

export async function createClass(data: Parameters<typeof repo.create>[0]) {
	const program = await loadProgram(data.program);
	const cycleLevelId = await ensureCycleLevel(program, data.cycleLevelId);
	const programOptionId = await ensureProgramOption(
		program,
		data.programOptionId,
	);
	const semesterId = await ensureSemester(data.semesterId);
	return repo.create({
		...data,
		code: normalizeCode(data.code),
		cycleLevelId,
		programOptionId,
		semesterId,
	});
}

export async function updateClass(
	id: string,
	data: Parameters<typeof repo.update>[1],
) {
	const existing = await repo.findById(id);
	if (!existing) throw notFound();
	const program = await loadProgram(data.program ?? existing.program);
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
	return repo.update(id, {
		...data,
		program: program.id,
		cycleLevelId,
		programOptionId,
		code: data.code ? normalizeCode(data.code) : undefined,
		semesterId,
	});
}

export async function deleteClass(id: string) {
	const klass = await repo.findById(id);
	if (!klass) throw notFound();

	const students = await studentsRepo.list({ classId: id });
	if (students.items.length) {
		const { items } = await repo.list({
			programId: klass.program,
			academicYearId: klass.academicYear,
		});
		const target = items.find((c) => c.id !== id);
		if (!target) throw conflict("Cannot delete class with students");
		for (const s of students.items) {
			await studentsRepo.transferStudent(s.id, target.id);
			await enrollmentsRepo.closeActive(s.id, "completed");
			await enrollmentsRepo.create({
				studentId: s.id,
				classId: target.id,
				academicYearId: target.academicYear,
				status: "active",
			});
		}
	}

	await repo.remove(id);
}

export async function listClasses(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}

export async function getClassById(id: string) {
	const item = await repo.findById(id);
	if (!item) throw notFound();
	return item;
}

export async function getClassByCode(code: string, academicYearId: string) {
	const item = await repo.findByCode(normalizeCode(code), academicYearId);
	if (!item) throw notFound();
	return item;
}

export async function transferStudent(studentId: string, toClassId: string) {
	const student = await studentsRepo.findById(studentId);
	if (!student) throw notFound("Student not found");
	const target = await repo.findById(toClassId);
	if (!target) throw notFound("Class not found");
	await transaction(async (tx) => {
		await tx
			.update(schema.students)
			.set({ class: toClassId })
			.where(eq(schema.students.id, studentId));
	});
	await enrollmentsRepo.closeActive(studentId, "completed");
	await enrollmentsRepo.create({
		studentId,
		classId: toClassId,
		academicYearId: target.academicYear,
		status: "active",
	});
	return studentsRepo.findById(studentId);
}

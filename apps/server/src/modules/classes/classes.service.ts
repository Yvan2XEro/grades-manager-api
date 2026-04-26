import { and, asc, eq, inArray, or } from "drizzle-orm";
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

async function ensurePrimaryCycle(institutionId: string) {
	const existing = await db.query.studyCycles.findFirst({
		where: eq(schema.studyCycles.institutionId, institutionId),
		orderBy: (cycles, helpers) => helpers.asc(cycles.createdAt),
	});
	if (existing) return existing;
	const [created] = await db
		.insert(schema.studyCycles)
		.values({
			institutionId,
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
		if (cycle.institutionId !== program.institutionId) {
			throw conflict("Cycle level does not belong to program institution");
		}
		return level.id;
	}
	const cycle = await ensurePrimaryCycle(program.institutionId);
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

async function ensureSemester(semesterId?: string | null) {
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

type CreateClassInput = Pick<
	schema.NewKlass,
	"code" | "name" | "program" | "academicYear"
> & {
	cycleLevelId?: string;
	programOptionId?: string;
	semesterId?: string | null;
	totalCredits?: number;
};

export async function createClass(
	data: CreateClassInput,
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
	data: Partial<CreateClassInput>,
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
		academicYear: academicYear?.id ?? existing.academicYear,
		cycleLevelId,
		programOptionId,
		code: data.code ? normalizeCode(data.code) : undefined,
		semesterId,
	});
}

export async function deleteClass(id: string, institutionId: string) {
	const klass = await db.query.classes.findFirst({
		where: eq(schema.classes.id, id),
	});
	if (!klass || klass.institutionId !== institutionId) throw notFound();

	const students = await studentsRepo.list({ classId: id, institutionId });
	if (students.items.length) {
		// First, look for another class in the same program + academic year
		const { items: sameProgramItems } = await repo.list(institutionId, {
			programId: klass.program,
			academicYearId: klass.academicYear,
		});
		let target = sameProgramItems.find((c) => c.id !== id);

		// Fallback: any other class in the institution
		if (!target) {
			const { items: allItems } = await repo.list(institutionId, {});
			target = allItems.find((c) => c.id !== id);
		}

		if (!target) throw conflict("Cannot delete class with students");
		for (const s of students.items) {
			await transferStudent(s.id, target.id, institutionId);
		}
	}

	// Clean up records with RESTRICT FK references before deleting the class
	await db
		.delete(schema.studentCourseEnrollments)
		.where(eq(schema.studentCourseEnrollments.sourceClassId, id));
	await db
		.delete(schema.promotionExecutions)
		.where(
			or(
				eq(schema.promotionExecutions.sourceClassId, id),
				eq(schema.promotionExecutions.targetClassId, id),
			),
		);
	await db
		.delete(schema.deliberations)
		.where(eq(schema.deliberations.classId, id));

	await repo.remove(id, institutionId);
}

export async function listClasses(
	opts: Parameters<typeof repo.list>[1],
	institutionId: string,
) {
	const result = await repo.list(institutionId, opts);
	const classIds = result.items.map((c) => c.id);
	const assignedCreditsMap = await repo.getAssignedCredits(classIds);
	return {
		...result,
		items: result.items.map((c) => ({
			...c,
			assignedCredits: assignedCreditsMap[c.id] ?? 0,
		})),
	};
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

/**
 * Returns true if `classId` is at the last cycle level (no level with a
 * higher orderIndex exists in the same cycle).
 */
async function isClassLastLevel(classId: string): Promise<boolean> {
	const klass = await repo.findById(classId);
	if (!klass?.cycleLevel || !klass.cycle) return false;
	const nextLevel = await db.query.cycleLevels.findFirst({
		where: and(
			eq(schema.cycleLevels.cycleId, klass.cycle.id),
			eq(schema.cycleLevels.orderIndex, (klass.cycleLevel.orderIndex ?? 0) + 1),
		),
	});
	return nextLevel === undefined;
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

	const closingStatus = (await isClassLastLevel(student.class))
		? "graduated"
		: "completed";

	await transaction(async (tx) => {
		await tx
			.update(schema.students)
			.set({ class: toClassId })
			.where(eq(schema.students.id, studentId));
	});
	await enrollmentsRepo.closeActive(studentId, closingStatus, institutionId);
	await enrollmentsRepo.create({
		studentId,
		classId: toClassId,
		academicYearId: target.academicYear,
		institutionId,
		status: "active",
	});
	return studentsRepo.findById(studentId, institutionId);
}

export async function getPromoTargets(
	sourceClassId: string,
	institutionId: string,
	targetAcademicYearId?: string,
) {
	const source = await repo.findById(sourceClassId, institutionId);
	if (!source) throw notFound("Source class not found");

	// All academic years for the institution so the UI can show a year picker
	const availableYears = await db.query.academicYears.findMany({
		where: eq(schema.academicYears.institutionId, institutionId),
		orderBy: (ay, { desc }) => desc(ay.startDate),
	});

	// Next cycle level (orderIndex + 1) in the same cycle
	const nextLevel = source.cycleLevel
		? await db.query.cycleLevels.findFirst({
				where: and(
					eq(schema.cycleLevels.cycleId, source.cycle?.id ?? ""),
					eq(
						schema.cycleLevels.orderIndex,
						(source.cycleLevel.orderIndex ?? 0) + 1,
					),
				),
			})
		: null;

	const isLastLevel = nextLevel == null; // findFirst returns undefined, not null

	// Only search target classes once the admin has chosen a year
	const targetClasses =
		targetAcademicYearId && !isLastLevel && nextLevel
			? (
					await repo.list(institutionId, {
						programId: source.program,
						academicYearId: targetAcademicYearId,
						cycleLevelId: nextLevel.id,
					})
				).items
			: [];

	return { targetClasses, isLastLevel, sourceClass: source, availableYears };
}

export async function promotionPreview(
	sourceClassId: string,
	institutionId: string,
	opts: { cursor?: string; limit?: number },
) {
	const source = await repo.findById(sourceClassId, institutionId);
	if (!source) throw notFound("Source class not found");

	// Get students in source class (paginated)
	const { items: students, nextCursor } = await studentsRepo.list({
		classId: sourceClassId,
		institutionId,
		cursor: opts.cursor,
		limit: opts.limit ?? 50,
	});

	if (students.length === 0) {
		return { items: [], nextCursor: undefined };
	}

	// Find the latest signed annual deliberation for this class
	const deliberation = await db.query.deliberations.findFirst({
		where: and(
			eq(schema.deliberations.classId, sourceClassId),
			eq(schema.deliberations.institutionId, institutionId),
			eq(schema.deliberations.type, "annual"),
			eq(schema.deliberations.status, "signed"),
		),
		orderBy: (d, { desc }) => desc(d.createdAt),
	});

	// Fetch deliberation results for all students in one query
	const studentIds = students.map((s) => s!.id);
	const deliberationResults = deliberation
		? await db.query.deliberationStudentResults.findMany({
				where: and(
					eq(schema.deliberationStudentResults.deliberationId, deliberation.id),
					inArray(schema.deliberationStudentResults.studentId, studentIds),
				),
				orderBy: asc(schema.deliberationStudentResults.rank),
			})
		: [];

	const resultByStudentId = new Map(
		deliberationResults.map((r) => [r.studentId, r]),
	);

	const items = students.map((student) => {
		const result = student ? resultByStudentId.get(student.id) : undefined;
		return {
			student: student!,
			deliberationResult: result
				? {
						id: result.id,
						generalAverage: result.generalAverage,
						totalCreditsEarned: result.totalCreditsEarned,
						totalCreditsPossible: result.totalCreditsPossible,
						finalDecision: result.finalDecision,
						mention: result.mention,
						rank: result.rank,
					}
				: null,
		};
	});

	return { items, nextCursor, deliberationId: deliberation?.id ?? null };
}

export async function bulkTransfer(
	studentIds: string[],
	toClassId: string,
	institutionId: string,
) {
	const target = await repo.findById(toClassId, institutionId);
	if (!target) throw notFound("Target class not found");

	const students = await db.query.students.findMany({
		where: and(
			inArray(schema.students.id, studentIds),
			eq(schema.students.institutionId, institutionId),
		),
	});

	if (students.length !== studentIds.length) {
		throw notFound("One or more students not found");
	}

	// Check per source class whether it's the last level (group by class to avoid N queries)
	const sourceClassIds = [...new Set(students.map((s) => s.class))];
	const lastLevelFlags = await Promise.all(
		sourceClassIds.map(async (id) => [id, await isClassLastLevel(id)] as const),
	);
	const isLastLevelMap = new Map(lastLevelFlags);

	await transaction(async (tx) => {
		await tx
			.update(schema.students)
			.set({ class: toClassId })
			.where(inArray(schema.students.id, studentIds));
	});

	for (const student of students) {
		const closingStatus = isLastLevelMap.get(student.class)
			? "graduated"
			: "completed";
		await enrollmentsRepo.closeActive(student.id, closingStatus, institutionId);
		await enrollmentsRepo.create({
			studentId: student.id,
			classId: toClassId,
			academicYearId: target.academicYear,
			institutionId,
			status: "active",
		});
	}

	return { transferred: students.length };
}

export async function listGraduatedStudents(
	institutionId: string,
	opts: {
		programId?: string;
		cycleId?: string;
		cursor?: string;
		limit?: number;
	},
) {
	const limit = opts.limit ?? 50;
	const { items: enrollments, nextCursor } = await enrollmentsRepo.list({
		institutionId,
		status: "graduated",
		cursor: opts.cursor,
		limit,
	});

	if (enrollments.length === 0) {
		return { items: [], nextCursor: undefined };
	}

	// Enrich with student + class + credit info
	const enriched = await Promise.all(
		enrollments.map(async (enrollment) => {
			const student = await studentsRepo.findById(
				enrollment.studentId,
				institutionId,
			);
			const klass = await repo.findById(enrollment.classId, institutionId);
			const creditLedger = await db.query.studentCreditLedgers.findFirst({
				where: and(
					eq(schema.studentCreditLedgers.studentId, enrollment.studentId),
					eq(
						schema.studentCreditLedgers.academicYearId,
						enrollment.academicYearId,
					),
				),
			});
			return { enrollment, student, klass, creditLedger };
		}),
	);

	// Filter by programId / cycleId if requested
	const filtered = enriched.filter(({ klass }) => {
		if (opts.programId && klass?.program !== opts.programId) return false;
		if (opts.cycleId && klass?.cycle?.id !== opts.cycleId) return false;
		return true;
	});

	return { items: filtered, nextCursor };
}

export async function searchClasses(
	opts: Parameters<typeof repo.search>[0],
	institutionId: string,
) {
	return repo.search(opts, institutionId);
}

export async function bulkGenerateClasses(
	academicYearId: string,
	institutionId: string,
	cycleLevelIds?: string[],
	sourceAcademicYearId?: string,
) {
	const year = await db.query.academicYears.findFirst({
		where: and(
			eq(schema.academicYears.id, academicYearId),
			eq(schema.academicYears.institutionId, institutionId),
		),
	});
	if (!year) throw notFound("Academic year not found");

	// All programs with their options and linked cycle levels
	const allPrograms = await db.query.programs.findMany({
		where: eq(schema.programs.institutionId, institutionId),
		with: { options: true },
	});

	// All cycles with their levels (indexed by cycleId for fast lookup)
	const cycles = await db.query.studyCycles.findMany({
		where: eq(schema.studyCycles.institutionId, institutionId),
		with: { levels: true },
	});
	const levelsByCycle = new Map(cycles.map((c) => [c.id, c.levels]));

	// Existing classes this year
	const existingClasses = await db.query.classes.findMany({
		where: and(
			eq(schema.classes.academicYear, academicYearId),
			eq(schema.classes.institutionId, institutionId),
		),
	});
	const existingKeys = new Set(
		existingClasses.map(
			(c) => `${c.program}::${c.programOptionId}::${c.cycleLevelId}`,
		),
	);
	const existingCodes = new Set(existingClasses.map((c) => c.code));

	let created = 0;
	let skipped = 0;

	for (const program of allPrograms) {
		const options = (
			program as typeof program & {
				options: { id: string; name: string; code: string }[];
			}
		).options;
		if (!options || options.length === 0) {
			skipped++;
			continue;
		}

		// Skip programs with no assigned cycle
		if (!program.cycleId) {
			skipped++;
			continue;
		}

		let programLevels = levelsByCycle.get(program.cycleId) ?? [];
		if (cycleLevelIds && cycleLevelIds.length > 0) {
			programLevels = programLevels.filter((l) => cycleLevelIds.includes(l.id));
		}
		if (programLevels.length === 0) {
			skipped++;
			continue;
		}

		for (const option of options) {
			for (const level of programLevels) {
				const key = `${program.id}::${option.id}::${level.id}`;
				if (existingKeys.has(key)) {
					skipped++;
					continue;
				}

				// Generate a unique code
				const baseCode = normalizeCode(`${program.code}-${level.code}`);
				let code = baseCode;
				let counter = 1;
				while (existingCodes.has(code)) {
					code = `${baseCode}-${String(counter).padStart(2, "0")}`;
					counter++;
				}
				existingCodes.add(code);
				existingKeys.add(key);

				const yearShort = `${new Date(year.startDate).getFullYear()}`;
				const name = `${program.name} ${level.code} (${yearShort})`;

				const newClass = await repo.create({
					code,
					name,
					program: program.id,
					academicYear: academicYearId,
					institutionId,
					cycleLevelId: level.id,
					programOptionId: option.id,
					semesterId: undefined,
					totalCredits: 0,
				});

				created++;

				if (sourceAcademicYearId && newClass) {
					// Find the corresponding class in the source academic year
					const sourceClasses = await db.query.classes.findMany({
						where: and(
							eq(schema.classes.program, program.id),
							eq(schema.classes.cycleLevelId, level.id),
							eq(schema.classes.programOptionId, option.id),
							eq(schema.classes.academicYear, sourceAcademicYearId),
							eq(schema.classes.institutionId, institutionId),
						),
					});

					for (const sourceClass of sourceClasses) {
						const sourceClassCourses = await db.query.classCourses.findMany({
							where: eq(schema.classCourses.class, sourceClass.id),
						});

						for (const sourceCC of sourceClassCourses) {
							const clonedCode = normalizeCode(
								`${sourceCC.code}-${new Date(year.startDate).getFullYear()}`,
							);
							await db
								.insert(schema.classCourses)
								.values({
									code: clonedCode,
									institutionId,
									class: newClass.id,
									course: sourceCC.course,
									teacher: sourceCC.teacher,
									semesterId: sourceCC.semesterId,
									coefficient: sourceCC.coefficient,
								})
								.onConflictDoNothing();
						}
					}
				}
			}
		}
	}

	return { created, skipped };
}

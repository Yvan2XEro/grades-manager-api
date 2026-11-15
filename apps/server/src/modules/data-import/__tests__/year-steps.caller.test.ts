import { describe, expect, it } from "bun:test";
import { and, eq, inArray } from "drizzle-orm";
import ExcelJS from "exceljs";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";
import {
	createAcademicYear,
	createCycleLevel,
	createDomainUser,
	createProgram,
	createStudyCycle,
	makeTestContext,
} from "../../../lib/test-utils";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);
type Caller = ReturnType<typeof createCaller>;

async function admin() {
	const profile = await createDomainUser();
	const ctx = await makeTestContext({
		role: "administrator",
		profileOverrides: { id: profile.id },
	});
	return { ctx, caller: createCaller(ctx) };
}

async function upload(caller: Caller, sheets: Record<string, string[][]>) {
	const wb = new ExcelJS.Workbook();
	for (const [name, rows] of Object.entries(sheets)) {
		const ws = wb.addWorksheet(name);
		for (const row of rows) ws.addRow(row);
	}
	const data = Buffer.from(await wb.xlsx.writeBuffer()).toString("base64");
	return (await caller.dataImport.upload({ name: "import.xlsx", data })).fileId;
}

type Summary = {
	sheets: { create: number; update: number; unchanged: number }[];
	issues: { row: number; column?: string; level: string; code?: string }[];
};

async function importStep(
	caller: Caller,
	step: string,
	academicYearId: string,
	sheets: Record<string, string[][]>,
	run = true,
) {
	const fileId = await upload(caller, sheets);
	const job = await caller.batchJobs.preview({
		type: "import.step",
		params: { step, fileId, academicYearId },
	});
	const summary = job.previewResult as unknown as Summary;
	if (run)
		expect((await caller.batchJobs.run({ jobId: job.id }))?.status).toBe(
			"completed",
		);
	return summary;
}

const suffix = () => Date.now().toString(36).toUpperCase();

/** A program with a cycle (L1, L2) and two academic years of the institution. */
async function fixture(institutionId: string) {
	const s = suffix();
	const cycle = await createStudyCycle({ institutionId, code: `LIC${s}` });
	await createCycleLevel({ cycleId: cycle.id, code: "L1", orderIndex: 1 });
	await createCycleLevel({ cycleId: cycle.id, code: "L2", orderIndex: 2 });
	const program = await createProgram({
		institutionId,
		code: `IGL${s}`,
		cycleId: cycle.id,
	});
	const past = await createAcademicYear({
		institutionId,
		name: `2022-${s}`,
		startDate: "2022-10-01",
		endDate: "2023-07-31",
	});
	const later = await createAcademicYear({
		institutionId,
		name: `2023-${s}`,
		startDate: "2023-10-01",
		endDate: "2024-07-31",
	});
	return { s, program, past, later };
}

const CLASS_HEADERS = ["Code", "Nom", "Code programme", "Code niveau"];
const STUDENT_HEADERS = [
	"Matricule",
	"Nom",
	"Prénom",
	"Né le",
	"Sexe",
	"Email",
	"Classe",
];

describe("guided import — academic year steps", () => {
	it("imports the classes and students of a past year, then of the next year", async () => {
		const { ctx, caller } = await admin();
		const institutionId = ctx.institution!.id;
		const { s, program, past, later } = await fixture(institutionId);

		const classes = await importStep(caller, "year.classes", past.id, {
			Classes: [
				CLASS_HEADERS,
				[`A${s}-L1`, `IGL 1 ${s}`, program.code, "l1"],
				[`A${s}-L2`, `IGL 2 ${s}`, program.code, "L9"],
			],
		});
		expect(classes.issues.filter((i) => i.level === "error")).toEqual([
			expect.objectContaining({ row: 3, code: "unknownLevel" }),
		]);
		expect(classes.sheets[0]).toMatchObject({ create: 1 });

		const students = await importStep(caller, "year.students", past.id, {
			Étudiants: [
				STUDENT_HEADERS,
				[
					`M${s}1`,
					"Kamga",
					"Paul",
					"03/05/2003",
					"M",
					`paul${s}@x.cm`,
					`A${s}-L1`,
				],
				[`M${s}2`, "Ngo", "Marie", "2004-01-12", "F", "", `a${s}-l1`],
				[`M${s}3`, "Inconnu", "Jean", "", "", "", "NOPE"],
			],
		});
		expect(students.issues.filter((i) => i.level === "error")).toEqual([
			expect.objectContaining({ row: 4, code: "unknownClass" }),
		]);
		expect(students.sheets[0]).toMatchObject({ create: 2 });

		const paul = await db.query.students.findFirst({
			where: eq(schema.students.registrationNumber, `M${s}1`),
			with: { profile: true },
		});
		expect(paul?.profile).toMatchObject({
			lastName: "Kamga",
			dateOfBirth: "2003-05-03",
			gender: "male",
		});
		const pastEnrollment = await db.query.enrollments.findFirst({
			where: and(
				eq(schema.enrollments.studentId, paul!.id),
				eq(schema.enrollments.academicYearId, past.id),
			),
		});
		// The year is over: the enrollment is imported as closed
		expect(pastEnrollment?.status).toBe("completed");

		// Next year: Paul found by email (no registration number), now in L2
		await importStep(caller, "year.classes", later.id, {
			Classes: [CLASS_HEADERS, [`B${s}-L2`, `IGL 2 ${s}`, program.code, "L2"]],
		});
		const next = await importStep(caller, "year.students", later.id, {
			Étudiants: [
				STUDENT_HEADERS,
				["", "Kamga", "Paul", "", "", `PAUL${s}@x.cm`, `B${s}-L2`],
			],
		});
		expect(next.issues.filter((i) => i.level === "error")).toHaveLength(0);
		expect(next.sheets[0]).toMatchObject({ create: 0, update: 1 });
		const moved = await db.query.students.findFirst({
			where: eq(schema.students.id, paul!.id),
			with: { classRef: true },
		});
		expect(moved?.classRef?.code).toBe(`B${s}-L2`);

		// Re-importing the past year does not move Paul back to his old class
		const again = await importStep(caller, "year.students", past.id, {
			Étudiants: [
				STUDENT_HEADERS,
				[
					`M${s}1`,
					"Kamga",
					"Paul",
					"03/05/2003",
					"M",
					`paul${s}@x.cm`,
					`A${s}-L1`,
				],
			],
		});
		expect(again.sheets[0]).toMatchObject({
			create: 0,
			update: 0,
			unchanged: 1,
		});
		const still = await db.query.students.findFirst({
			where: eq(schema.students.id, paul!.id),
		});
		expect(still?.class).toBe(moved!.class);
	});

	it("refuses a registration number that contradicts a known person", async () => {
		const { ctx, caller } = await admin();
		const { s, program, past } = await fixture(ctx.institution!.id);
		await importStep(caller, "year.classes", past.id, {
			Classes: [CLASS_HEADERS, [`C${s}`, `C ${s}`, program.code, "L1"]],
		});
		await importStep(caller, "year.students", past.id, {
			Étudiants: [
				STUDENT_HEADERS,
				[`R${s}1`, "Ewane", "Luc", "", "", `luc${s}@x.cm`, `C${s}`],
			],
		});
		const summary = await importStep(
			caller,
			"year.students",
			past.id,
			{
				Étudiants: [
					STUDENT_HEADERS,
					[`R${s}9`, "Ewane", "Luc", "", "", `luc${s}@x.cm`, `C${s}`],
				],
			},
			false,
		);
		expect(summary.issues).toEqual([
			expect.objectContaining({ code: "registrationMismatch", level: "error" }),
		]);
	});
});

describe("guided import — sending a fixed file again", () => {
	it("supersedes the previous analysis that was never imported", async () => {
		const { ctx, caller } = await admin();
		const { s, program, past } = await fixture(ctx.institution!.id);
		const sheets = {
			Classes: [CLASS_HEADERS, [`D${s}`, `D ${s}`, program.code, "L1"]],
		};
		await importStep(caller, "year.classes", past.id, sheets, false);
		const again = await importStep(caller, "year.classes", past.id, sheets);
		expect(again.sheets[0]).toMatchObject({ create: 1 });
	});
});

describe("guided import — generated registration numbers", () => {
	it("issues a registration number when the row has none", async () => {
		const { ctx, caller } = await admin();
		const { s, program, past } = await fixture(ctx.institution!.id);
		await caller.registrationNumbers.create({
			name: `Import ${s}`,
			definition: {
				segments: [
					{ kind: "literal", value: `G${s}-` },
					{ kind: "counter", width: 3, scope: ["class"] },
				],
			},
			isActive: true,
		});
		await importStep(caller, "year.classes", past.id, {
			Classes: [CLASS_HEADERS, [`G${s}`, `G ${s}`, program.code, "L1"]],
		});
		const summary = await importStep(caller, "year.students", past.id, {
			Étudiants: [STUDENT_HEADERS, ["", "Abena", "Rose", "", "", "", `G${s}`]],
		});
		expect(summary.sheets[0]).toMatchObject({ create: 1 });
		const klass = await db.query.classes.findFirst({
			where: eq(schema.classes.code, `G${s}`),
		});
		const student = await db.query.students.findFirst({
			where: eq(schema.students.class, klass!.id),
		});
		expect(student?.registrationNumber).toStartWith(`G${s}-`);
	});
});

describe("guided import — class courses and exams", () => {
	it("generates the courses of each class from the curriculum, then its exams from the model", async () => {
		const { ctx, caller } = await admin();
		const institutionId = ctx.institution!.id;
		const { s, program, past } = await fixture(institutionId);
		const levels = await db.query.cycleLevels.findMany({
			where: eq(schema.cycleLevels.cycleId, program.cycleId!),
		});
		const l1 = levels.find((l) => l.code === "L1")!;
		const [unit] = await db
			.insert(schema.teachingUnits)
			.values({
				programId: program.id,
				code: `UE${s}`,
				name: "Algo",
				credits: 6,
				semester: "fall",
				cycleLevelId: l1.id,
			})
			.returning();
		const [unleveled] = await db
			.insert(schema.teachingUnits)
			.values({ programId: program.id, code: `UX${s}`, name: "X", credits: 2 })
			.returning();
		await db.insert(schema.courses).values([
			{
				program: program.id,
				teachingUnitId: unit.id,
				code: `A${s}1`,
				name: "Algo 1",
				hours: 30,
			},
			{
				program: program.id,
				teachingUnitId: unit.id,
				code: `A${s}2`,
				name: "Algo 2",
				hours: 30,
			},
			{
				program: program.id,
				teachingUnitId: unleveled.id,
				code: `X${s}`,
				name: "Hors niveau",
				hours: 10,
			},
		]);
		await importStep(caller, "year.classes", past.id, {
			Classes: [CLASS_HEADERS, [`K${s}`, `K ${s}`, program.code, "L1"]],
		});
		await importStep(caller, "year.students", past.id, {
			Étudiants: [
				STUDENT_HEADERS,
				[`S${s}1`, "Fotso", "Ana", "", "", "", `K${s}`],
				[`S${s}2`, "Mbida", "Eric", "", "", "", `K${s}`],
			],
		});

		const courses = await importStep(caller, "year.courses", past.id, {
			Cours: [
				[
					"Code classe",
					"Code EC",
					"E-mail enseignant",
					"Coefficient",
					"Non enseigné",
				],
				[`K${s}`, `A${s}2`, "", "3", ""],
			],
		});
		expect(courses.sheets[0]).toMatchObject({ create: 2 });
		expect(courses.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: "unitsWithoutLevel" }),
				expect.objectContaining({ code: "coursesWithoutTeacher" }),
			]),
		);
		const klass = await db.query.classes.findFirst({
			where: eq(schema.classes.code, `K${s}`),
		});
		const classCourses = await db.query.classCourses.findMany({
			where: eq(schema.classCourses.class, klass!.id),
		});
		expect(
			classCourses.map((c) => [c.code, Number(c.coefficient)]).sort(),
		).toEqual([
			[`A${s}1`, 1],
			[`A${s}2`, 3],
		]);
		const courseEnrollments = await db.query.studentCourseEnrollments.findMany({
			where: eq(schema.studentCourseEnrollments.sourceClassId, klass!.id),
		});
		expect(courseEnrollments).toHaveLength(4);

		const exams = await importStep(caller, "year.exams", past.id, {
			Modèle: [
				["Type d'examen", "Pondération (%)", "Rattrapage de", "Note retenue"],
				[`CC${s}`, "40", "", ""],
				[`EX${s}`, "60", "", ""],
				[`RA${s}`, "", `EX${s}`, "meilleure note"],
			],
			Exceptions: [
				[
					"Code classe",
					"Code EC",
					"Type d'examen",
					"Pondération (%)",
					"Date",
					"N'a pas lieu",
				],
				[`K${s}`, `A${s}2`, `CC${s}`, "", "", "oui"],
			],
		});
		expect(exams.issues.filter((i) => i.level === "error")).toHaveLength(0);
		expect(exams.sheets[0]).toMatchObject({ create: 5, skipped: 1 });
		const created = await db.query.exams.findMany({
			where: inArray(
				schema.exams.classCourse,
				classCourses.map((c) => c.id),
			),
		});
		const retake = created.find((e) => e.type === `RA${s}`)!;
		const parent = created.find((e) => e.id === retake.parentExamId);
		expect(parent?.type).toBe(`EX${s}`);
		expect(retake).toMatchObject({
			sessionType: "retake",
			scoringPolicy: "best_of",
			status: "approved",
			percentage: "60.00",
		});
		// Grades: download the grid, fill it, import it
		const template = await caller.dataImport.template({
			step: "year.grades",
			academicYearId: past.id,
		});
		const wb = new ExcelJS.Workbook();
		await wb.xlsx.load(Buffer.from(template.data, "base64") as never);
		const grid = wb.getWorksheet(`K${s}`)!;
		const headers = (grid.getRow(1).values as string[]).slice(1);
		expect(headers).toEqual(
			expect.arrayContaining([
				`A${s}1 | CC${s}`,
				`A${s}1 | RA${s}`,
				`A${s}2 | EX${s}`,
			]),
		);
		expect(headers).not.toContain(`A${s}2 | CC${s}`);
		const col = (h: string) => headers.indexOf(h) + 1;
		grid.eachRow((row, n) => {
			if (n === 1) return;
			const ana = row.getCell(1).text === `S${s}1`;
			row.getCell(col(`A${s}1 | CC${s}`)).value = ana ? "12,5" : "ABS";
			row.getCell(col(`A${s}1 | EX${s}`)).value = ana ? 14 : 25;
		});
		const long = wb.getWorksheet("Notes")!;
		long.addRow([`S${s}2`, `K${s}`, `A${s}2`, `EX${s}`, "8"]);
		const data = Buffer.from(await wb.xlsx.writeBuffer()).toString("base64");
		const { fileId } = await caller.dataImport.upload({
			name: "notes.xlsx",
			data,
		});
		const gradeJob = await caller.batchJobs.preview({
			type: "import.step",
			params: { step: "year.grades", fileId, academicYearId: past.id },
		});
		const gradeSummary = gradeJob.previewResult as unknown as Summary & {
			sheets: { sheet: string; create: number; skipped: number }[];
		};
		expect(gradeSummary.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: "invalidScore", level: "error" }),
				expect.objectContaining({ code: "absencesAsZero" }),
			]),
		);
		expect(gradeSummary.sheets).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ sheet: `K${s}`, create: 3, skipped: 1 }),
				expect.objectContaining({ sheet: "Notes", create: 1 }),
			]),
		);
		expect((await caller.batchJobs.run({ jobId: gradeJob.id }))?.status).toBe(
			"completed",
		);
		const ana = await db.query.students.findFirst({
			where: eq(schema.students.registrationNumber, `S${s}1`),
		});
		const anaGrades = await db.query.grades.findMany({
			where: eq(schema.grades.student, ana!.id),
		});
		expect(anaGrades.map((g) => g.score).sort()).toEqual(["12.50", "14.00"]);

		// Closing: exams locked, one annual deliberation computed per class
		const closing = await caller.dataImport.closeYear({
			academicYearId: past.id,
		});
		expect(closing.lockedExams).toBe(5);
		expect(closing.deliberations.created).toBe(1);
		const delib = await db.query.deliberations.findFirst({
			where: eq(schema.deliberations.classId, klass!.id),
		});
		expect(delib).toMatchObject({ type: "annual", status: "open" });
		const locked = await caller.batchJobs.preview({
			type: "import.step",
			params: { step: "year.grades", fileId, academicYearId: past.id },
		});
		expect(
			(locked.previewResult as unknown as Summary).issues.some(
				(i) => i.code === "examLocked",
			),
		).toBe(true);

		// Official decisions: a gap is reported, then kept as an override
		const decisions = await importStep(caller, "year.decisions", past.id, {
			Décisions: [
				["Matricule", "Décision", "Motif"],
				[`S${s}1`, "Exclu", "PV du 12/07"],
				[`S${s}9`, "Admis", ""],
			],
		});
		expect(decisions.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: "decisionGap", level: "warning" }),
				expect.objectContaining({
					code: "noDeliberationResult",
					level: "error",
				}),
			]),
		);
		const result = await db.query.deliberationStudentResults.findFirst({
			where: and(
				eq(schema.deliberationStudentResults.deliberationId, delib!.id),
				eq(schema.deliberationStudentResults.studentId, ana!.id),
			),
		});
		expect(result).toMatchObject({
			finalDecision: "excluded",
			isOverridden: true,
			overrideReason: "PV du 12/07",
		});

		// Same file again: nothing to do
		const again = await importStep(
			caller,
			"year.exams",
			past.id,
			{
				Modèle: [
					["Type d'examen", "Pondération (%)", "Rattrapage de", "Note retenue"],
					[`CC${s}`, "40", "", ""],
					[`EX${s}`, "60", "", ""],
					[`RA${s}`, "", `EX${s}`, "meilleure note"],
				],
			},
			false,
		);
		expect(again.sheets[0]).toMatchObject({ create: 1, unchanged: 5 });
	});
});

describe("guided import — undo", () => {
	it("undoes an import, refusing while later imports depend on it", async () => {
		const { ctx, caller } = await admin();
		const { s, program, past } = await fixture(ctx.institution!.id);
		const run = async (step: string, sheets: Record<string, string[][]>) => {
			const fileId = await upload(caller, sheets);
			const job = await caller.batchJobs.preview({
				type: "import.step",
				params: { step, fileId, academicYearId: past.id },
			});
			await caller.batchJobs.run({ jobId: job.id });
			return job.id;
		};
		const classesJob = await run("year.classes", {
			Classes: [CLASS_HEADERS, [`U${s}`, `U ${s}`, program.code, "L1"]],
		});
		const studentsJob = await run("year.students", {
			Étudiants: [
				STUDENT_HEADERS,
				[`V${s}1`, "Nana", "Lea", "", "", "", `U${s}`],
			],
		});
		// Renaming the class is undone with its import, back to the old name
		await run("year.classes", {
			Classes: [CLASS_HEADERS, [`U${s}`, `U renamed ${s}`, program.code, "L1"]],
		});

		const refused = await caller.batchJobs.rollback({ jobId: classesJob });
		expect(refused?.status).toBe("failed");
		expect(
			(
				await db.query.batchJobs.findFirst({
					where: eq(schema.batchJobs.id, classesJob),
				})
			)?.status,
		).toBe("completed");

		const undone = await caller.batchJobs.rollback({ jobId: studentsJob });
		expect(undone?.status).toBe("completed");
		expect(
			await db.query.students.findFirst({
				where: eq(schema.students.registrationNumber, `V${s}1`),
			}),
		).toBeUndefined();

		// The rename (third job) is undone, then the creation
		const jobs = await db.query.batchJobs.findMany({
			where: and(
				eq(schema.batchJobs.type, "import.step"),
				eq(schema.batchJobs.status, "completed"),
			),
		});
		const rename = jobs.find(
			(j) =>
				j.id !== classesJob &&
				(j.params as { step: string }).step === "year.classes" &&
				(j.params as { academicYearId: string }).academicYearId === past.id,
		)!;
		await caller.batchJobs.rollback({ jobId: rename.id });
		expect(
			(
				await db.query.classes.findFirst({
					where: eq(schema.classes.code, `U${s}`),
				})
			)?.name,
		).toBe(`U ${s}`);
		expect(
			(await caller.batchJobs.rollback({ jobId: classesJob }))?.status,
		).toBe("completed");
		expect(
			await db.query.classes.findFirst({
				where: eq(schema.classes.code, `U${s}`),
			}),
		).toBeUndefined();
	});
});

describe("guided import — teachers and parents", () => {
	it("creates teachers without account, assigns them to courses, links parents", async () => {
		const { ctx, caller } = await admin();
		const { s, program, past } = await fixture(ctx.institution!.id);
		const teachers = await importStep(caller, "year.teachers", past.id, {
			Enseignants: [
				["Nom", "Prénom", "E-mail", "Téléphone", "Sexe"],
				["Owona", "Jean", `owona${s}@x.cm`, "", "M"],
			],
		});
		expect(teachers.sheets[0]).toMatchObject({ create: 1 });
		const again = await importStep(caller, "year.teachers", past.id, {
			Enseignants: [
				["Nom", "Prénom", "E-mail", "Téléphone", "Sexe"],
				["Owona", "Jean", `OWONA${s}@x.cm`, "699000000", "M"],
			],
		});
		expect(again.sheets[0]).toMatchObject({ create: 0, update: 1 });

		const [unit] = await db
			.insert(schema.teachingUnits)
			.values({ programId: program.id, code: `T${s}`, name: "T", credits: 3 })
			.returning();
		await db.insert(schema.courses).values({
			program: program.id,
			teachingUnitId: unit.id,
			code: `TC${s}`,
			name: "Cours T",
			hours: 20,
		});
		await importStep(caller, "year.classes", past.id, {
			Classes: [CLASS_HEADERS, [`P${s}`, `P ${s}`, program.code, "L1"]],
		});
		const courses = await importStep(caller, "year.courses", past.id, {
			Cours: [
				["Code classe", "Code EC", "E-mail enseignant"],
				[`P${s}`, `TC${s}`, `owona${s}@x.cm`],
			],
		});
		expect(
			courses.issues.filter((i) => i.code === "unknownTeacher"),
		).toHaveLength(0);
		const teacher = await db.query.domainUsers.findFirst({
			where: eq(
				schema.domainUsers.primaryEmail,
				`owona${s}@x.cm`.toLowerCase(),
			),
		});
		expect(teacher?.phone).toBe("699000000");
		const klass = await db.query.classes.findFirst({
			where: eq(schema.classes.code, `P${s}`),
		});
		const cc = await db.query.classCourses.findFirst({
			where: eq(schema.classCourses.class, klass!.id),
		});
		expect(cc?.teacher).toBe(teacher!.id);

		await importStep(caller, "year.students", past.id, {
			Étudiants: [
				STUDENT_HEADERS,
				[`Q${s}1`, "Bella", "Zoe", "", "", "", `P${s}`],
			],
		});
		const parents = await importStep(caller, "year.guardians", past.id, {
			Parents: [
				[
					"Matricule",
					"Nom du parent",
					"Prénom du parent",
					"Lien",
					"E-mail",
					"Téléphone",
				],
				[`Q${s}1`, "Bella", "Paul", "Père", "", "677 11 22 33"],
				[`Q${s}1`, "Bella", "Anne", "Cousine", `anne${s}@x.cm`, ""],
			],
		});
		expect(parents.sheets[0]).toMatchObject({ create: 1, skipped: 1 });
		expect(parents.issues).toEqual([
			expect.objectContaining({ code: "unknownRelationship" }),
		]);
	});
});

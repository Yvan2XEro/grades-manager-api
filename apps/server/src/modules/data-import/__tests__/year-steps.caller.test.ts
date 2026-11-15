import { describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
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

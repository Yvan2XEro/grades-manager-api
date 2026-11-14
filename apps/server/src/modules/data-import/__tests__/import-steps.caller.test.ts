import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";
import { createDomainUser, makeTestContext } from "../../../lib/test-utils";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

async function admin() {
	const profile = await createDomainUser();
	const ctx = await makeTestContext({
		role: "administrator",
		profileOverrides: { id: profile.id },
	});
	return { ctx, caller: createCaller(ctx) };
}

/** Uploads a workbook (sheet name → rows, first row = headers) through the router. */
async function upload(
	caller: ReturnType<typeof createCaller>,
	sheets: Record<string, (string | number)[][]>,
) {
	const wb = new ExcelJS.Workbook();
	for (const [name, rows] of Object.entries(sheets)) {
		const ws = wb.addWorksheet(name);
		for (const row of rows) ws.addRow(row);
	}
	const data = Buffer.from(await wb.xlsx.writeBuffer()).toString("base64");
	return (await caller.dataImport.upload({ name: "import.xlsx", data })).fileId;
}

type Summary = {
	sheets: {
		sheet: string;
		create: number;
		update: number;
		unchanged: number;
	}[];
	issues: {
		sheet: string;
		row: number;
		column?: string;
		level: string;
		message: string;
	}[];
};

async function preview(
	caller: ReturnType<typeof createCaller>,
	step: string,
	fileId: string,
) {
	const job = await caller.batchJobs.preview({
		type: "import.step",
		params: { step, fileId },
	});
	return { job, summary: job.previewResult as Summary };
}

const suffix = () => Date.now().toString(36).toUpperCase();

describe("guided import — foundation steps", () => {
	it("imports cycles and levels, then reports them unchanged on re-import", async () => {
		const { ctx, caller } = await admin();
		const code = `L${suffix()}`;
		const sheets = {
			Cycles: [
				[
					"Code *",
					"Nom *",
					"Nom (anglais)",
					"Durée (années) *",
					"Crédits requis",
				],
				[code, "Licence", "Bachelor", 3, 180],
			],
			Niveaux: [
				["Code cycle", "Code niveau", "Nom", "Ordre", "Crédits minimum"],
				[code, "L1", "Licence 1", 1, 60],
				[code, "L2", "Licence 2", 2, 60],
			],
		};
		const first = await preview(
			caller,
			"foundation.cycles",
			await upload(caller, sheets),
		);
		expect(
			first.summary.issues.filter((i) => i.level === "error"),
		).toHaveLength(0);
		expect(first.summary.sheets).toEqual([
			{ sheet: "Cycles", create: 1, update: 0, unchanged: 0, skipped: 0 },
			{ sheet: "Niveaux", create: 2, update: 0, unchanged: 0, skipped: 0 },
		] as never);
		expect((await caller.batchJobs.run({ jobId: first.job.id }))?.status).toBe(
			"completed",
		);

		const cycle = await db.query.studyCycles.findFirst({
			where: eq(schema.studyCycles.code, code),
		});
		expect(cycle?.institutionId).toBe(ctx.institution!.id);
		const levels = await db.query.cycleLevels.findMany({
			where: eq(schema.cycleLevels.cycleId, cycle!.id),
		});
		expect(levels.map((l) => l.code).sort()).toEqual(["L1", "L2"]);

		const again = await preview(
			caller,
			"foundation.cycles",
			await upload(caller, sheets),
		);
		expect(again.summary.sheets.map((s) => s.unchanged)).toEqual([1, 2]);
	});

	it("reports row-level errors and does not import invalid rows", async () => {
		const { caller } = await admin();
		const code = `P${suffix()}`;
		const fileId = await upload(caller, {
			Programmes: [
				["Code", "Nom", "Code cycle"],
				[code, `Programme ${code}`, "UNKNOWN-CYCLE"],
				["", "Sans code", ""],
			],
			Options: [
				["Code programme", "Code option", "Nom"],
				["NOPE", "GEN", "Générale"],
			],
		});
		const { job, summary } = await preview(
			caller,
			"foundation.programs",
			fileId,
		);
		const errors = summary.issues.filter((i) => i.level === "error");
		expect(errors.map((e) => `${e.sheet}:${e.row}:${e.column}`).sort()).toEqual(
			[
				"Options:2:Code programme",
				"Programmes:2:Code cycle",
				"Programmes:3:Code",
			],
		);
		expect(summary.sheets.find((s) => s.sheet === "Programmes")?.create).toBe(
			0,
		);
		await caller.batchJobs.run({ jobId: job.id });
		const created = await db.query.programs.findFirst({
			where: eq(schema.programs.code, code),
		});
		expect(created).toBeUndefined();
	});

	it("imports programmes, options, UE and EC in order", async () => {
		const { ctx, caller } = await admin();
		const code = `G${suffix()}`;
		const programs = await preview(
			caller,
			"foundation.programs",
			await upload(caller, {
				Programmes: [
					["Code", "Nom"],
					[code, `Génie ${code}`],
				],
				Options: [
					["Code programme", "Code option", "Nom"],
					[code, "RES", "Réseaux"],
				],
			}),
		);
		await caller.batchJobs.run({ jobId: programs.job.id });
		const program = await db.query.programs.findFirst({
			where: eq(schema.programs.code, code),
		});
		expect(program?.institutionId).toBe(ctx.institution!.id);
		const options = await db.query.programOptions.findMany({
			where: eq(schema.programOptions.programId, program!.id),
		});
		expect(options.map((o) => o.code).sort()).toEqual(["RES", "default"]);

		const curriculum = await preview(
			caller,
			"foundation.curriculum",
			await upload(caller, {
				UE: [
					["Code programme", "Code UE", "Nom", "Crédits", "Semestre"],
					[code, "UE1", "Fondamentaux", 6, "s1"],
				],
				EC: [
					[
						"Code programme",
						"Code UE",
						"Code EC",
						"Nom",
						"Heures",
						"Coefficient",
					],
					[code, "UE1", "EC1", "Algorithmique", 40, "1,5"],
					[code, "UE9", "EC2", "Orpheline", 20, ""],
				],
			}),
		);
		const errors = curriculum.summary.issues.filter((i) => i.level === "error");
		expect(errors.map((e) => `${e.sheet}:${e.row}:${e.column}`)).toEqual([
			"EC:3:Code UE",
		]);
		await caller.batchJobs.run({ jobId: curriculum.job.id });
		const unit = await db.query.teachingUnits.findFirst({
			where: eq(schema.teachingUnits.programId, program!.id),
		});
		expect(unit?.semester).toBe("fall");
		const courses = await db.query.courses.findMany({
			where: eq(schema.courses.program, program!.id),
		});
		expect(courses.map((c) => [c.code, Number(c.defaultCoefficient)])).toEqual([
			["EC1", 1.5],
		]);
	});

	it("builds a template pre-filled with the current data", async () => {
		const { caller } = await admin();
		const template = await caller.dataImport.template({
			step: "foundation.cycles",
		});
		const wb = new ExcelJS.Workbook();
		await wb.xlsx.load(
			Buffer.from(template.data, "base64") as unknown as ArrayBuffer,
		);
		expect(wb.getWorksheet("Cycles")?.getRow(1).getCell(1).value).toBe(
			"Code *",
		);
		expect(wb.getWorksheet("Niveaux")).toBeTruthy();
	});

	it("rejects non-admins", async () => {
		const ctx = await makeTestContext({ role: "teacher" });
		await expect(createCaller(ctx).dataImport.overview()).rejects.toThrow();
	});
});

import { TRPCError } from "@trpc/server";
import { and, count, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { adminProcedure, router, tenantAdminProcedure } from "@/lib/trpc";
import { saveImportFile } from "./import-file-storage";
import { FOUNDATION_STEPS, getImportStep, IMPORT_STEP_KEYS } from "./steps";
import { buildTemplate } from "./steps/workbook";

const TEMPLATE_TYPES = [
	"academic-structure",
	"people",
	"enrollments",
	"grades-bulk",
] as const;

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type ImportMetadata = { importSkippedSteps?: string[] };

async function skippedSteps(institutionId: string) {
	const institution = await db.query.institutions.findFirst({
		where: eq(schema.institutions.id, institutionId),
	});
	return (
		((institution?.metadata ?? {}) as ImportMetadata).importSkippedSteps ?? []
	);
}

/** Row counts behind the status of each foundation step. */
async function foundationCounts(institutionId: string) {
	const [cycles, programs, options] = await Promise.all([
		db.query.studyCycles.findMany({
			where: eq(schema.studyCycles.institutionId, institutionId),
			columns: { id: true },
		}),
		db.query.programs.findMany({
			where: eq(schema.programs.institutionId, institutionId),
			columns: { id: true },
		}),
		db
			.select({ n: count() })
			.from(schema.programOptions)
			.where(eq(schema.programOptions.institutionId, institutionId)),
	]);
	const cycleIds = cycles.map((c) => c.id);
	const programIds = programs.map((p) => p.id);
	const countWhere = async (
		table:
			| typeof schema.cycleLevels
			| typeof schema.teachingUnits
			| typeof schema.courses,
		column: Parameters<typeof inArray>[0],
		ids: string[],
	) =>
		ids.length
			? ((
					await db
						.select({ n: count() })
						.from(table)
						.where(inArray(column, ids))
				)[0]?.n ?? 0)
			: 0;
	const [levels, units, courses] = await Promise.all([
		countWhere(schema.cycleLevels, schema.cycleLevels.cycleId, cycleIds),
		countWhere(
			schema.teachingUnits,
			schema.teachingUnits.programId,
			programIds,
		),
		countWhere(schema.courses, schema.courses.program, programIds),
	]);
	return {
		"foundation.cycles": { Cycles: cycles.length, Niveaux: levels },
		"foundation.programs": {
			Programmes: programs.length,
			Options: options[0]?.n ?? 0,
		},
		"foundation.curriculum": { UE: units, EC: courses },
	} as Record<string, Record<string, number>>;
}

/** What already exists in an academic year (status of the yearly steps). */
async function yearCounts(institutionId: string) {
	const years = await db.query.academicYears.findMany({
		where: eq(schema.academicYears.institutionId, institutionId),
		orderBy: schema.academicYears.startDate,
	});
	return Promise.all(
		years.map(async (year) => {
			const classes = await db.query.classes.findMany({
				where: eq(schema.classes.academicYear, year.id),
				columns: { id: true },
			});
			const classIds = classes.map((c) => c.id);
			const classCourses = classIds.length
				? await db.query.classCourses.findMany({
						where: inArray(schema.classCourses.class, classIds),
						columns: { id: true },
					})
				: [];
			const classCourseIds = classCourses.map((c) => c.id);
			const exams = classCourseIds.length
				? await db.query.exams.findMany({
						where: inArray(schema.exams.classCourse, classCourseIds),
						columns: { id: true },
					})
				: [];
			const examIds = exams.map((e) => e.id);
			const [enrollments, grades] = await Promise.all([
				db
					.select({ n: count() })
					.from(schema.enrollments)
					.where(and(eq(schema.enrollments.academicYearId, year.id))),
				examIds.length
					? db
							.select({ n: count() })
							.from(schema.grades)
							.where(inArray(schema.grades.exam, examIds))
					: Promise.resolve([{ n: 0 }]),
			]);
			return {
				id: year.id,
				name: year.name,
				isActive: year.isActive,
				startDate: year.startDate,
				counts: {
					classes: classIds.length,
					classCourses: classCourseIds.length,
					enrollments: enrollments[0]?.n ?? 0,
					exams: examIds.length,
					grades: grades[0]?.n ?? 0,
				},
			};
		}),
	);
}

export const dataImportRouter = router({
	getTemplateUrl: adminProcedure
		.input(z.object({ type: z.enum(TEMPLATE_TYPES) }))
		.query(({ input }) => {
			const base = process.env.SERVER_PUBLIC_URL ?? "";
			return { url: `${base}/api/import/template/${input.type}` };
		}),

	/** Progress of the guided import: foundation steps and academic years. */
	overview: tenantAdminProcedure.query(async ({ ctx }) => {
		const institutionId = ctx.institution.id;
		const [counts, skipped, years] = await Promise.all([
			foundationCounts(institutionId),
			skippedSteps(institutionId),
			yearCounts(institutionId),
		]);
		return {
			foundations: FOUNDATION_STEPS.map((step) => ({
				key: step.key,
				label: step.label,
				counts: counts[step.key] ?? {},
				skipped: skipped.includes(step.key),
			})),
			years,
		};
	}),

	/** Description of a step: its sheets and columns, for the wizard. */
	step: tenantAdminProcedure
		.input(z.object({ step: z.enum(IMPORT_STEP_KEYS) }))
		.query(({ input }) => {
			const step = getImportStep(input.step);
			return { key: step.key, label: step.label, sheets: step.sheets };
		}),

	/** Pre-filled template of a step (base64 xlsx): current data + dropdowns. */
	template: tenantAdminProcedure
		.input(z.object({ step: z.enum(IMPORT_STEP_KEYS) }))
		.query(async ({ ctx, input }) => {
			const step = getImportStep(input.step);
			const buffer = await buildTemplate(step, {
				institutionId: ctx.institution.id,
			});
			return {
				data: buffer.toString("base64"),
				filename: `import-${step.key.replace(".", "-")}.xlsx`,
				mimeType:
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			};
		}),

	/** Stores an uploaded workbook (base64) and returns its id for the batch job. */
	upload: tenantAdminProcedure
		.input(z.object({ name: z.string(), data: z.string() }))
		.mutation(async ({ input }) => {
			if (!/\.xlsx$/i.test(input.name))
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Seuls les fichiers Excel (.xlsx) sont acceptés.",
				});
			const buffer = Buffer.from(input.data, "base64");
			if (buffer.length > MAX_UPLOAD_BYTES)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Le fichier dépasse 10 Mo.",
				});
			return { fileId: await saveImportFile(buffer, ".xlsx") };
		}),

	/** Marks a step as not applicable (or applicable again). */
	setStepSkipped: tenantAdminProcedure
		.input(z.object({ step: z.string(), skipped: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const institution = await db.query.institutions.findFirst({
				where: eq(schema.institutions.id, ctx.institution.id),
			});
			const metadata = (institution?.metadata ?? {}) as ImportMetadata &
				Record<string, unknown>;
			const current = new Set(metadata.importSkippedSteps ?? []);
			if (input.skipped) current.add(input.step);
			else current.delete(input.step);
			await db
				.update(schema.institutions)
				.set({
					metadata: { ...metadata, importSkippedSteps: [...current] } as never,
				})
				.where(eq(schema.institutions.id, ctx.institution.id));
			return { skipped: [...current] };
		}),
});

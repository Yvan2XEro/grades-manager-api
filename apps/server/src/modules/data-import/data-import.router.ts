import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { router, tenantAdminProcedure } from "@/lib/trpc";
import { readImportFile, saveImportFile } from "./import-file-storage";
import {
	FOUNDATION_STEPS,
	getImportStep,
	IMPORT_STEP_KEYS,
	YEAR_STEPS,
} from "./steps";
import { annotateWorkbook, buildTemplate, normalize } from "./steps/workbook";
import { requireYear } from "./steps/year-context";
import { closeImportedYear } from "./year-closing";

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
			const delibs = await db.query.deliberations.findMany({
				where: and(
					eq(schema.deliberations.academicYearId, year.id),
					eq(schema.deliberations.type, "annual"),
				),
				columns: { id: true },
			});
			const overrides = delibs.length
				? ((
						await db
							.select({ n: count() })
							.from(schema.deliberationStudentResults)
							.where(
								and(
									inArray(
										schema.deliberationStudentResults.deliberationId,
										delibs.map((d) => d.id),
									),
									eq(schema.deliberationStudentResults.isOverridden, true),
								),
							)
					)[0]?.n ?? 0)
				: 0;
			const assigned = classIds.length
				? await db
						.selectDistinct({ teacher: schema.classCourses.teacher })
						.from(schema.classCourses)
						.innerJoin(
							schema.domainUsers,
							eq(schema.domainUsers.id, schema.classCourses.teacher),
						)
						.where(
							and(
								inArray(schema.classCourses.class, classIds),
								sql`${schema.domainUsers.primaryEmail} not like '%.invalid'`,
							),
						)
				: [];
			const guardianLinks = classIds.length
				? ((
						await db
							.select({ n: count() })
							.from(schema.studentGuardians)
							.innerJoin(
								schema.enrollments,
								eq(
									schema.enrollments.studentId,
									schema.studentGuardians.studentId,
								),
							)
							.where(
								and(
									eq(schema.enrollments.academicYearId, year.id),
									inArray(schema.enrollments.classId, classIds),
								),
							)
					)[0]?.n ?? 0)
				: 0;
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
				endDate: year.endDate,
				counts: {
					classes: classIds.length,
					classCourses: classCourseIds.length,
					enrollments: enrollments[0]?.n ?? 0,
					exams: examIds.length,
					grades: grades[0]?.n ?? 0,
					deliberations: delibs.length,
					teachers: assigned.length,
					fees:
						(
							await db
								.select({ n: count() })
								.from(schema.studentFeeAssignments)
								.where(eq(schema.studentFeeAssignments.academicYearId, year.id))
						)[0]?.n ?? 0,
					guardians: guardianLinks,
					overrides,
				},
			};
		}),
	);
}

export const dataImportRouter = router({
	/** Progress of the guided import: foundation steps and academic years. */
	overview: tenantAdminProcedure.query(async ({ ctx }) => {
		const institutionId = ctx.institution.id;
		const [counts, skipped, years] = await Promise.all([
			foundationCounts(institutionId),
			skippedSteps(institutionId),
			yearCounts(institutionId),
		]);
		const inst = ctx.institution;
		return {
			/** What the institution profile already has (first setup step). */
			profile: {
				name: inst.nameFr,
				hasLogo: Boolean(inst.logoUrl || inst.logoSvg),
				hasContact: Boolean(inst.contactEmail || inst.contactPhone),
				hasAddress: Boolean(inst.addressFr),
			},
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
			return {
				key: step.key,
				label: step.label,
				scope: step.scope ?? "institution",
				sheets: step.sheets,
			};
		}),

	/** Pre-filled template of a step (base64 xlsx): current data + dropdowns. */
	template: tenantAdminProcedure
		.input(
			z.object({
				step: z.enum(IMPORT_STEP_KEYS),
				academicYearId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const step = getImportStep(input.step);
			const context = {
				institutionId: ctx.institution.id,
				academicYearId: input.academicYearId,
			};
			const buffer = step.template
				? await step.template(context)
				: await buildTemplate(step, context);
			const year =
				step.scope === "year" ? `-${(await requireYear(context)).name}` : "";
			return {
				data: buffer.toString("base64"),
				filename: `import-${step.key.replace(".", "-")}${year}.xlsx`,
				mimeType:
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			};
		}),

	/** Stores an uploaded workbook (base64) and returns its id for the batch job. */
	upload: tenantAdminProcedure
		.input(z.object({ name: z.string(), data: z.string() }))
		.mutation(async ({ ctx, input }) => {
			if (!/\.xlsx$/i.test(input.name))
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Only Excel files (.xlsx) are accepted.",
				});
			const buffer = Buffer.from(input.data, "base64");
			if (buffer.length > MAX_UPLOAD_BYTES)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "The file exceeds 10 MB.",
				});
			return {
				fileId: await saveImportFile(buffer, ".xlsx", ctx.institution.id),
			};
		}),

	/** End of the import of a year: lock (past year), credits, deliberations. */
	closeYear: tenantAdminProcedure
		.input(z.object({ academicYearId: z.string() }))
		.mutation(({ ctx, input }) => {
			if (!ctx.profile)
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "A profile is required to compute deliberations",
				});
			return closeImportedYear({
				institutionId: ctx.institution.id,
				academicYearId: input.academicYearId,
				actorId: ctx.profile.id,
			});
		}),

	/**
	 * The uploaded workbook with each problem as a note on its cell (red),
	 * so the client fixes the file where it is wrong. Texts come translated
	 * from the caller.
	 */
	annotate: tenantAdminProcedure
		.input(
			z.object({
				fileId: z.string(),
				notes: z
					.array(
						z.object({
							sheet: z.string(),
							row: z.number().int(),
							column: z.string().optional(),
							level: z.enum(["error", "warning"]),
							text: z.string(),
						}),
					)
					.max(20000),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const buffer = await readImportFile(input.fileId, ctx.institution.id);
			return {
				data: (await annotateWorkbook(buffer, input.notes)).toString("base64"),
				mimeType:
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			};
		}),

	/**
	 * Steps of a year found in one workbook (single file for the whole year):
	 * a step is covered when one of its sheets is there; grades when a sheet
	 * is named after a class of the year (or "Notes").
	 */
	workbookSteps: tenantAdminProcedure
		.input(z.object({ fileId: z.string(), academicYearId: z.string() }))
		.query(async ({ ctx, input }) => {
			const year = await requireYear({
				institutionId: ctx.institution.id,
				academicYearId: input.academicYearId,
			});
			const wb = new ExcelJS.Workbook();
			await wb.xlsx.load(
				(await readImportFile(
					input.fileId,
					ctx.institution.id,
				)) as unknown as ArrayBuffer,
			);
			const names = new Set(
				wb.worksheets
					.filter((w) => w.state === "visible")
					.map((w) => normalize(w.name)),
			);
			const classCodes = (
				await db.query.classes.findMany({
					where: eq(schema.classes.academicYear, year.id),
					columns: { code: true },
				})
			).map((c) => normalize(c.code));
			return YEAR_STEPS.filter((step) =>
				step.key === "year.grades"
					? names.has(normalize("Notes")) ||
						classCodes.some((code) => names.has(code))
					: step.sheets.some((sheet) => names.has(normalize(sheet.name))),
			).map((step) => step.key);
		}),

	/** Imports of a year, latest first, with what they did (for undo). */
	history: tenantAdminProcedure
		.input(z.object({ academicYearId: z.string() }))
		.query(async ({ ctx, input }) => {
			const jobs = await db.query.batchJobs.findMany({
				where: and(
					eq(schema.batchJobs.institutionId, ctx.institution.id),
					eq(schema.batchJobs.type, "import.step"),
					inArray(schema.batchJobs.status, ["completed", "rolled_back"]),
					sql`${schema.batchJobs.params}->>'academicYearId' = ${input.academicYearId}`,
					isNull(schema.batchJobs.parentJobId),
				),
				orderBy: desc(schema.batchJobs.completedAt),
				with: { createdByRef: true },
			});
			// Imports made before the journal existed cannot be undone
			const journaled = jobs.length
				? new Set(
						(
							await db
								.selectDistinct({ jobId: schema.importJournalEntries.jobId })
								.from(schema.importJournalEntries)
								.where(
									inArray(
										schema.importJournalEntries.jobId,
										jobs.map((j) => j.id),
									),
								)
						).map((e) => e.jobId),
					)
				: new Set<string>();
			return jobs.map((job) => {
				const preview = (job.previewResult ?? {}) as {
					sheets?: { create: number; update: number }[];
				};
				return {
					id: job.id,
					step: (job.params as { step: string }).step,
					status: job.status,
					completedAt: job.completedAt,
					rolledBackAt: job.rolledBackAt,
					undoable: journaled.has(job.id),
					created: (preview.sheets ?? []).reduce((n, s) => n + s.create, 0),
					updated: (preview.sheets ?? []).reduce((n, s) => n + s.update, 0),
					by: job.createdByRef
						? `${job.createdByRef.firstName} ${job.createdByRef.lastName}`
						: null,
				};
			});
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

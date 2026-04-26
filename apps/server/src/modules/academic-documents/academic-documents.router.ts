import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { ExportTemplateType } from "../../db/schema/app-schema";
import {
	router,
	tenantAdminProcedure,
	tenantGradingProcedure,
	tenantProcedure,
} from "../../lib/trpc";
import * as expoTplRepo from "../export-templates/export-templates.repo";
import { loadTemplate } from "../exports/template-helper";
import {
	getDefaultTheme,
	isDocumentThemeKind,
	type ThemeKind,
} from "../exports/themes";
import { getDefaultThemePayload } from "../exports/themes/presets-payload";
import * as service from "./academic-documents.service";
import * as zod from "./academic-documents.zod";

// All 7 export-template types — academic documents (diploma/transcript/
// attestation) carry a full theme schema, the four other types (pv,
// evaluation, ue, deliberation) ship a static HTML body without a custom
// theme payload.
const SYSTEM_TEMPLATES: ReadonlyArray<{
	type: ExportTemplateType;
	name: string;
	description: string;
}> = [
	{
		type: "student_list",
		name: "Liste d'étudiants — Modèle officiel",
		description:
			"Liste/roster d'étudiants par classe, programme ou année. Colonnes configurables (matricule, genre, date de naissance, classe, etc.).",
	},
	{
		type: "diploma",
		name: "Diplôme — Modèle officiel",
		description:
			"Modèle officiel de diplôme inspiré du modèle DIPLOMATION (FMSP/UDo). Format A4 paysage, bilingue FR/EN.",
	},
	{
		type: "transcript",
		name: "Relevé de notes — Modèle officiel",
		description:
			"Relevé de notes officiel avec notes par UE/EC et mention. Format A4 portrait, bilingue.",
	},
	{
		type: "attestation",
		name: "Attestation — Modèle officiel",
		description:
			"Attestation de réussite avec résultats résumés. Format A4 portrait, bilingue.",
	},
	{
		type: "pv",
		name: "Procès-verbal — Modèle officiel",
		description:
			"Procès-verbal de délibération de jury. Liste des étudiants avec décisions, mentions et signatures.",
	},
	{
		type: "evaluation",
		name: "Publication d'évaluation — Modèle officiel",
		description:
			"Publication des résultats d'une évaluation (CC, TP, examen) — par classe et par cours.",
	},
	{
		type: "ue",
		name: "Publication d'UE — Modèle officiel",
		description:
			"Publication des résultats par unité d'enseignement (moyennes UE, décisions par UE).",
	},
	{
		type: "deliberation",
		name: "Délibération — Modèle officiel",
		description:
			"Document de délibération détaillé : résultats par étudiant, décisions, mentions, statistiques.",
	},
];

export const academicDocumentsRouter = router({
	/** Generate a single diploma/transcript/attestation for a student. */
	generate: tenantGradingProcedure
		.input(zod.generateDocumentSchema)
		.mutation(async ({ ctx, input }) => {
			const result = await service.generateDocument(ctx.institution.id, input);
			const ext = input.format === "html" ? "html" : "pdf";
			return {
				data: result.content,
				filename: `${input.kind}_${input.studentId}_${new Date()
					.toISOString()
					.slice(0, 10)}.${ext}`,
				mimeType: result.mimeType,
			};
		}),

	/**
	 * Generate a roster (class list, program list, year list).
	 * Provide at least one filter (classId, programId, academicYearId or
	 * studentIds). Uses the `student_list` template assigned to the class
	 * (when classId is given), otherwise the institution default.
	 */
	generateStudentList: tenantGradingProcedure
		.input(zod.generateStudentListSchema)
		.mutation(async ({ ctx, input }) => {
			const result = await service.generateStudentList(
				ctx.institution.id,
				input,
			);
			const ext = input.format === "html" ? "html" : "pdf";
			const scope = input.classId ?? input.programId ?? "all";
			return {
				data: result.content,
				filename: `liste_etudiants_${scope}_${new Date()
					.toISOString()
					.slice(0, 10)}.${ext}`,
				mimeType: result.mimeType,
			};
		}),

	/** Preview as HTML using the resolved/saved template (read-only). */
	preview: tenantGradingProcedure
		.input(zod.previewDocumentSchema)
		.query(async ({ ctx, input }) => {
			const result = await service.generateDocument(ctx.institution.id, {
				...input,
				format: "html",
			});
			return { html: result.content };
		}),

	/**
	 * Preview a draft template body (used by the template editor).
	 * Accepts inline HTML — does NOT require the template to be saved.
	 */
	previewBody: tenantAdminProcedure
		.input(zod.previewDocumentBodySchema)
		.mutation(async ({ ctx, input }) => {
			const html = await service.previewTemplateBody(ctx.institution.id, input);
			return { html };
		}),

	/** Show the resolved (template, theme) for a class — useful for the UI. */
	resolveForClass: tenantProcedure
		.input(zod.resolveTemplateForClassSchema)
		.query(async ({ ctx, input }) => {
			const resolved = await service.resolveDocumentTemplate(
				ctx.institution.id,
				input.classId,
				input.kind,
			);
			return {
				template: resolved.template,
				theme: resolved.theme,
				themeStack: resolved.themeStack,
			};
		}),

	/** Returns the bundled, read-only HTML body for a kind (used as editor seed). */
	getBundledTemplateBody: tenantAdminProcedure
		.input(z.object({ kind: zod.documentKindSchema }))
		.query(({ input }) => {
			return {
				kind: input.kind,
				templateBody: loadTemplate(input.kind),
				themeDefaults: getDefaultTheme(input.kind),
			};
		}),

	/**
	 * Seed the system-default templates for all 7 export-template types
	 * (diploma, transcript, attestation, pv, evaluation, ue, deliberation)
	 * if they do not exist yet. Idempotent — safe to call multiple times.
	 * Useful on first login for an institution that just enabled the feature.
	 */
	seedSystemDefaults: tenantAdminProcedure.mutation(async ({ ctx }) => {
		if (!ctx.permissions.canManageCatalog) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You do not have permission to seed templates",
			});
		}
		const userId = ctx.profile?.id;
		if (!userId) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Profile required to seed",
			});
		}

		const created: string[] = [];
		const skipped: string[] = [];
		for (const def of SYSTEM_TEMPLATES) {
			// Skip if a template with the same name already exists for this
			// institution+type.
			const list = await expoTplRepo.findTemplatesByInstitution(
				ctx.institution.id,
				def.type,
				undefined,
				undefined,
				100,
			);
			const exists = list.items.some((t) => t.name === def.name);
			if (exists) {
				skipped.push(def.type);
				continue;
			}

			// Only academic-document types (diploma/transcript/attestation) carry
			// a structured theme payload. Other types ship without one.
			const themeDefaults: Record<string, unknown> = isDocumentThemeKind(
				def.type,
			)
				? getDefaultThemePayload(def.type as ThemeKind)
				: {};

			await expoTplRepo.createTemplate({
				institutionId: ctx.institution.id,
				name: def.name,
				type: def.type,
				isDefault: true,
				isSystemDefault: true,
				description: def.description,
				templateBody: loadTemplate(def.type),
				themeDefaults,
				createdBy: userId,
				updatedBy: userId,
			});

			// Make it the institution default for that type.
			const justCreated = await expoTplRepo.findTemplatesByInstitution(
				ctx.institution.id,
				def.type,
				true,
				undefined,
				1,
			);
			if (justCreated.items[0]) {
				await expoTplRepo.setDefaultTemplate(
					ctx.institution.id,
					justCreated.items[0].id,
					def.type,
				);
			}
			created.push(def.type);
		}
		return { created, skipped };
	}),
});

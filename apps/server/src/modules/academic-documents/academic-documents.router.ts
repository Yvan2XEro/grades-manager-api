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
import { loadTemplate, type TemplateVariant } from "../exports/template-helper";
import {
	getDefaultTheme,
	isDocumentThemeKind,
	type ThemeKind,
} from "../exports/themes";
import { getDefaultThemePayload } from "../exports/themes/presets-payload";
import * as service from "./academic-documents.service";
import * as zod from "./academic-documents.zod";

// System-default templates created by `seedSystemDefaults`.
//
// Each entry can declare a `variant` to choose between:
//   - `"standard"` — header with institution + tutelle (faculty + university +
//     ministry). Used for programs without a `centerId`.
//   - `"center"`   — header with institution + center data only (no tutelle).
//     Used for programs attached to a center (`programs.centerId`).
//
// At seed time we create both variants for the 4 student-facing kinds
// (student_list, diploma, transcript, attestation) so admins can pick
// the right one per program/class without editing HTML.
const SYSTEM_TEMPLATES: ReadonlyArray<{
	type: ExportTemplateType;
	variant?: TemplateVariant;
	name: string;
	description: string;
}> = [
	// Standard variants
	{
		type: "student_list",
		variant: "standard",
		name: "Liste d'étudiants — Modèle officiel",
		description:
			"Liste/roster d'étudiants par classe, programme ou année. Colonnes configurables (matricule, genre, date de naissance, classe, etc.).",
	},
	{
		type: "diploma",
		variant: "standard",
		name: "Diplôme — Modèle officiel",
		description:
			"Modèle officiel de diplôme inspiré du modèle DIPLOMATION (FMSP/UDo). Format A4 paysage, bilingue FR/EN.",
	},
	{
		type: "transcript",
		variant: "standard",
		name: "Relevé de notes — Modèle officiel",
		description:
			"Relevé de notes officiel avec notes par UE/EC et mention. Format A4 portrait, bilingue.",
	},
	{
		type: "attestation",
		variant: "standard",
		name: "Attestation — Modèle officiel",
		description:
			"Attestation de réussite avec résultats résumés. Format A4 portrait, bilingue.",
	},
	// Center variants — same kinds, but the header carries only institution +
	// center data (admin instances + legal text + center logo). Pick these
	// when a program is attached to a center.
	{
		type: "student_list",
		variant: "center",
		name: "Liste d'étudiants — Modèle Centre",
		description:
			"Variante CENTRE : utilise les informations du centre (table centers) au lieu des tutelles (faculté/université).",
	},
	{
		type: "diploma",
		variant: "center",
		name: "Diplôme — Modèle Centre",
		description:
			"Variante CENTRE pour les programmes rattachés à un centre. En-tête simplifié sans tutelle, données du centre intégrées.",
	},
	{
		type: "transcript",
		variant: "center",
		name: "Relevé de notes — Modèle Centre",
		description:
			"Variante CENTRE : en-tête institut + centre, sans faculté ni université de tutelle.",
	},
	{
		type: "attestation",
		variant: "center",
		name: "Attestation — Modèle Centre",
		description:
			"Variante CENTRE : en-tête institut + centre, signataire = directeur du centre.",
	},
	// PV / Évaluation / UE / Délibération — standard variants.
	{
		type: "pv",
		variant: "standard",
		name: "Procès-verbal — Modèle officiel",
		description:
			"Procès-verbal de délibération de jury. Liste des étudiants avec décisions, mentions et signatures.",
	},
	{
		type: "evaluation",
		variant: "standard",
		name: "Publication d'évaluation — Modèle officiel",
		description:
			"Publication des résultats d'une évaluation (CC, TP, examen) — par classe et par cours.",
	},
	{
		type: "ue",
		variant: "standard",
		name: "Publication d'UE — Modèle officiel",
		description:
			"Publication des résultats par unité d'enseignement (moyennes UE, décisions par UE).",
	},
	{
		type: "deliberation",
		variant: "standard",
		name: "Délibération — Modèle officiel",
		description:
			"Document de délibération détaillé : résultats par étudiant, décisions, mentions, statistiques.",
	},
	// PV / Évaluation / UE / Délibération — center variants.
	// They reuse the same HTML body as the standard variants — those templates
	// already carry an `{{#if center}}…{{else}}…{{/if}}` branch in the header,
	// and `exports.service.renderTemplate` injects the center payload into the
	// Handlebars context. Marking these records `variant: "center"` only
	// changes how the program form filters them.
	{
		type: "pv",
		variant: "center",
		name: "Procès-verbal — Modèle Centre",
		description:
			"Variante CENTRE : en-tête institut + données du centre (sans tutelle).",
	},
	{
		type: "evaluation",
		variant: "center",
		name: "Publication d'évaluation — Modèle Centre",
		description:
			"Variante CENTRE : en-tête institut + données du centre (sans tutelle).",
	},
	{
		type: "ue",
		variant: "center",
		name: "Publication d'UE — Modèle Centre",
		description:
			"Variante CENTRE : en-tête institut + données du centre (sans tutelle).",
	},
	{
		type: "deliberation",
		variant: "center",
		name: "Délibération — Modèle Centre",
		description:
			"Variante CENTRE : en-tête institut + données du centre (sans tutelle).",
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
				usedTemplate: result.usedTemplate,
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

		// Look up the institution.type once — used to pick the right standard
		// transcript/attestation template (IPES vs Faculté) at seed time.
		const { db } = await import("../../db");
		const schema = await import("../../db/schema/app-schema");
		const { eq } = await import("drizzle-orm");
		const [institutionRow] = await db
			.select({ type: schema.institutions.type })
			.from(schema.institutions)
			.where(eq(schema.institutions.id, ctx.institution.id))
			.limit(1);
		const establishmentType = (institutionRow?.type ?? "institution") as
			| "institution"
			| "faculty"
			| "university";

		const created: string[] = [];
		const skipped: string[] = [];
		const failed: Array<{ type: string; reason: string }> = [];
		for (const def of SYSTEM_TEMPLATES) {
			const label = `${def.type}${def.variant === "center" ? " (centre)" : ""}`;
			try {
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
					skipped.push(label);
					continue;
				}

				// Only academic-document types carry a structured theme payload.
				const themeDefaults: Record<string, unknown> = isDocumentThemeKind(
					def.type,
				)
					? getDefaultThemePayload(def.type as ThemeKind)
					: {};

				// Only the "standard" variant is marked as institution default —
				// center variants are alternatives admins assign per program/class.
				const isStandard = (def.variant ?? "standard") === "standard";

				await expoTplRepo.createTemplate({
					institutionId: ctx.institution.id,
					name: def.name,
					type: def.type,
					isDefault: isStandard,
					isSystemDefault: true,
					variant: def.variant ?? "standard",
					description: def.description,
					templateBody: loadTemplate(
						def.type,
						def.variant ?? "standard",
						// Only relevant for the standard transcript/attestation —
						// loadTemplate ignores it for other types/variants.
						establishmentType,
					),
					themeDefaults,
					createdBy: userId,
					updatedBy: userId,
				});

				if (isStandard) {
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
				}
				created.push(label);
			} catch (err) {
				const reason = err instanceof Error ? err.message : String(err);
				console.error(
					`[seedSystemDefaults] failed to seed ${label}: ${reason}`,
				);
				failed.push({ type: label, reason });
			}
		}
		return { created, skipped, failed };
	}),
});

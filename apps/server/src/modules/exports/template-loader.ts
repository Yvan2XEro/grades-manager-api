import type {
	ExportTemplate,
	ExportTemplateType,
} from "../../db/schema/app-schema";
import * as exportTemplatesService from "../export-templates/export-templates.service";

type ExportHeaderConfig = {
	showLogo?: boolean;
	logoPosition?: "left" | "center" | "right";
	title?: string;
	titleFr?: string;
	titleEn?: string;
	subtitle?: string;
	subtitleFr?: string;
	subtitleEn?: string;
	showInstitutionName?: boolean;
	showFacultyName?: boolean;
	showAcademicYear?: boolean;
	showSemester?: boolean;
	showClassName?: boolean;
	customFields?: Array<{
		key: string;
		label: string;
		labelFr?: string;
		labelEn?: string;
		value?: string;
		visible: boolean;
		order: number;
	}>;
};

type ExportStyleConfig = {
	fontFamily?: string;
	fontSize?: number;
	headerFontSize?: number;
	primaryColor?: string;
	secondaryColor?: string;
	headerBackgroundColor?: string;
	headerTextColor?: string;
	tableBorderColor?: string;
	tableBorderWidth?: number;
	alternateRowColor?: string;
	pageSize?: "A4" | "A3" | "Letter";
	pageOrientation?: "portrait" | "landscape";
	margins?: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
	watermark?: {
		enabled: boolean;
		text: string;
		opacity?: number;
		fontSize?: number;
		rotation?: number;
		/** Institution logo rendered as a background image (per-institution unique watermark). */
		logoUrl?: string;
		/** Optional secondary line shown under the watermark text, e.g. institution short name. */
		institutionName?: string;
	};
};

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { loadTemplate } from "./template-helper";

export type LoadTemplateScope = {
	classId?: string;
	programId?: string;
};

/**
 * Load export template configuration with the following resolution order:
 *   1. Explicit `templateId` (caller override)
 *   2. Program-scoped default for the requested type (program_export_templates)
 *      — resolved either from `scope.programId` or via `scope.classId → class.program`
 *   3. Institution-wide default template for the type
 *   4. Built-in HTML fallback
 *
 * When the resolved program belongs to a center, that center's branding is
 * merged into the styleConfig (watermark logo + name) and exposed to the
 * template as a top-level `center` object.
 */
export async function loadExportTemplate(
	institutionId: string,
	type: ExportTemplateType,
	templateId?: string,
	scope: LoadTemplateScope = {},
): Promise<TemplateConfiguration & { center?: CenterBranding | null }> {
	let template: ExportTemplate | undefined;

	// Resolve programId once — used both for template lookup AND center branding.
	const programId =
		scope.programId ??
		(scope.classId ? await resolveProgramIdFromClass(scope.classId) : null);
	const center = programId ? await resolveCenterFromProgram(programId) : null;

	// 1. Explicit override wins.
	let resolvedTemplateId = templateId;

	// 2. Program-scoped default for this exact template type.
	if (!resolvedTemplateId && programId) {
		const [row] = await db
			.select({
				templateId: schema.programExportTemplates.templateId,
			})
			.from(schema.programExportTemplates)
			.where(
				and(
					eq(schema.programExportTemplates.programId, programId),
					eq(schema.programExportTemplates.templateType, type),
				),
			)
			.limit(1);
		if (row?.templateId) {
			resolvedTemplateId = row.templateId;
		}
	}

	if (resolvedTemplateId) {
		template = await exportTemplatesService.getTemplate({
			id: resolvedTemplateId,
		});
	} else {
		// 3. Institution-wide default for this type.
		template = await exportTemplatesService.getDefaultTemplate(
			institutionId,
			type,
		);
	}

	let styleConfig = await mergeInstitutionBrandingIntoStyle(
		institutionId,
		getDefaultStyleConfig(type),
	);
	if (center) {
		styleConfig = mergeCenterBrandingIntoStyle(styleConfig, center);
	}

	// 4. Fallback to bundled HTML template.
	if (!template) {
		return {
			templateBody: loadTemplate(type),
			headerConfig: getDefaultHeaderConfig(type),
			styleConfig,
			center,
		};
	}

	return {
		templateBody: template.templateBody,
		headerConfig: getDefaultHeaderConfig(type),
		styleConfig,
		center,
	};
}

export type CenterBranding = {
	id: string;
	code: string;
	name: string;
	nameEn: string | null;
	shortName: string | null;
	logoUrl: string | null;
	adminInstanceLogoUrl: string | null;
	watermarkLogoUrl: string | null;
	authorizationOrderFr: string | null;
	authorizationOrderEn: string | null;
	postalBox: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	city: string | null;
	country: string | null;
	administrativeInstances: Array<{
		nameFr: string;
		nameEn: string;
		acronymFr: string | null;
		acronymEn: string | null;
		logoUrl: string | null;
		showOnTranscripts: boolean;
		showOnCertificates: boolean;
	}>;
	legalTexts: Array<{ textFr: string; textEn: string }>;
};

async function resolveProgramIdFromClass(
	classId: string,
): Promise<string | null> {
	const [row] = await db
		.select({ programId: schema.classes.program })
		.from(schema.classes)
		.where(eq(schema.classes.id, classId))
		.limit(1);
	return row?.programId ?? null;
}

async function resolveCenterFromProgram(
	programId: string,
): Promise<CenterBranding | null> {
	try {
		const [row] = await db
			.select({ centerId: schema.programs.centerId })
			.from(schema.programs)
			.where(eq(schema.programs.id, programId))
			.limit(1);
		const centerId = row?.centerId;
		if (!centerId) return null;
		const center = await db.query.centers.findFirst({
			where: eq(schema.centers.id, centerId),
		});
		if (!center) return null;
		const [adminInstances, legalTexts] = await Promise.all([
			db
				.select()
				.from(schema.centerAdministrativeInstances)
				.where(eq(schema.centerAdministrativeInstances.centerId, centerId))
				.orderBy(schema.centerAdministrativeInstances.orderIndex),
			db
				.select()
				.from(schema.centerLegalTexts)
				.where(eq(schema.centerLegalTexts.centerId, centerId))
				.orderBy(schema.centerLegalTexts.orderIndex),
		]);
		return {
			id: center.id,
			code: center.code,
			name: center.name,
			nameEn: center.nameEn,
			shortName: center.shortName,
			logoUrl: center.logoUrl,
			adminInstanceLogoUrl: center.adminInstanceLogoUrl,
			watermarkLogoUrl: center.watermarkLogoUrl,
			authorizationOrderFr: center.authorizationOrderFr,
			authorizationOrderEn: center.authorizationOrderEn,
			postalBox: center.postalBox,
			contactEmail: center.contactEmail,
			contactPhone: center.contactPhone,
			city: center.city,
			country: center.country,
			administrativeInstances: adminInstances.map((i) => ({
				nameFr: i.nameFr,
				nameEn: i.nameEn,
				acronymFr: i.acronymFr,
				acronymEn: i.acronymEn,
				logoUrl: i.logoUrl,
				showOnTranscripts: i.showOnTranscripts,
				showOnCertificates: i.showOnCertificates,
			})),
			legalTexts: legalTexts.map((l) => ({
				textFr: l.textFr,
				textEn: l.textEn,
			})),
		};
	} catch {
		return null;
	}
}

function mergeCenterBrandingIntoStyle(
	style: ExportStyleConfig,
	center: CenterBranding,
): ExportStyleConfig {
	const watermark = style.watermark ?? { enabled: true, text: "ORIGINAL" };
	return {
		...style,
		watermark: {
			...watermark,
			logoUrl: center.watermarkLogoUrl ?? center.logoUrl ?? watermark.logoUrl,
			institutionName:
				center.shortName ?? center.code ?? watermark.institutionName,
		},
	};
}

/**
 * Inject the institution logo and short name into the watermark style so the
 * generated PDF carries a unique-per-institution watermark.
 */
async function mergeInstitutionBrandingIntoStyle(
	institutionId: string,
	style: ExportStyleConfig,
): Promise<ExportStyleConfig> {
	try {
		const inst = await db.query.institutions.findFirst({
			where: eq(schema.institutions.id, institutionId),
		});
		if (!inst) return style;
		const watermark = style.watermark ?? { enabled: true, text: "ORIGINAL" };
		return {
			...style,
			watermark: {
				...watermark,
				logoUrl: watermark.logoUrl ?? inst.logoUrl ?? undefined,
				institutionName:
					watermark.institutionName ??
					inst.shortName ??
					inst.abbreviation ??
					inst.nameFr,
			},
		};
	} catch {
		return style;
	}
}

/**
 * Template configuration returned to services
 */
export type TemplateConfiguration = {
	templateBody: string;
	headerConfig: ExportHeaderConfig;
	styleConfig: ExportStyleConfig;
};

/**
 * Get default template configuration for a type
 */
function getDefaultTemplateConfig(
	type: ExportTemplateType,
): TemplateConfiguration {
	return {
		templateBody: loadTemplate(type),
		headerConfig: getDefaultHeaderConfig(type),
		styleConfig: getDefaultStyleConfig(type),
	};
}

/**
 * Default header configuration
 */
function getDefaultHeaderConfig(type: ExportTemplateType): ExportHeaderConfig {
	const baseConfig: ExportHeaderConfig = {
		showLogo: true,
		logoPosition: "left",
		showInstitutionName: true,
		showAcademicYear: true,
		showSemester: true,
		showClassName: true,
	};

	switch (type) {
		case "pv":
			return {
				...baseConfig,
				titleFr: "PROCÈS-VERBAL DE DÉLIBÉRATION",
				titleEn: "DELIBERATION MINUTES",
				showFacultyName: true,
			};

		case "evaluation":
			return {
				...baseConfig,
				titleFr: "PUBLICATION DES NOTES",
				titleEn: "GRADE PUBLICATION",
			};

		case "ue":
			return {
				...baseConfig,
				titleFr: "PUBLICATION UNITÉ D'ENSEIGNEMENT",
				titleEn: "TEACHING UNIT PUBLICATION",
			};

		case "deliberation":
			return {
				...baseConfig,
				titleFr: "PROCÈS-VERBAL DE DÉLIBÉRATION",
				titleEn: "DELIBERATION REPORT",
				showFacultyName: true,
			};

		default:
			return baseConfig;
	}
}

/**
 * Default style configuration
 */
function getDefaultStyleConfig(type: ExportTemplateType): ExportStyleConfig {
	const baseStyle: ExportStyleConfig = {
		fontFamily: "Arial, sans-serif",
		fontSize: 10,
		headerFontSize: 12,
		primaryColor: "#003366",
		secondaryColor: "#666666",
		headerBackgroundColor: "#003366",
		headerTextColor: "#FFFFFF",
		tableBorderColor: "#000000",
		tableBorderWidth: 1,
		alternateRowColor: "#F5F5F5",
		pageSize: "A4",
		margins: {
			top: 10,
			right: 10,
			bottom: 10,
			left: 10,
		},
		watermark: {
			enabled: true,
			text: "ORIGINAL",
			opacity: 0.1,
			fontSize: 80,
			rotation: -45,
		},
	};

	// PV and deliberation use landscape by default
	if (type === "pv" || type === "deliberation") {
		return {
			...baseStyle,
			pageOrientation: "landscape",
		};
	}

	return {
		...baseStyle,
		pageOrientation: "portrait",
	};
}

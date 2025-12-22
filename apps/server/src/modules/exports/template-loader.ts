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
	};
};
import { loadTemplate } from "./template-helper";

/**
 * Load export template configuration or use defaults
 */
export async function loadExportTemplate(
	institutionId: string,
	type: ExportTemplateType,
	templateId?: string,
): Promise<TemplateConfiguration> {
	let template: ExportTemplate | undefined;

	// Load specific template if ID provided
	if (templateId) {
		template = await exportTemplatesService.getTemplate({ id: templateId });
	} else {
		// Load default template for this type
		template = await exportTemplatesService.getDefaultTemplate(
			institutionId,
			type,
		);
	}

	// If no template found, return defaults
	if (!template) {
		return getDefaultTemplateConfig(type);
	}

	return {
		templateBody: template.templateBody,
		headerConfig: getDefaultHeaderConfig(type),
		styleConfig: getDefaultStyleConfig(type),
	};
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
function getDefaultHeaderConfig(
	type: ExportTemplateType,
): ExportHeaderConfig {
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

	// PV uses landscape by default
	if (type === "pv") {
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

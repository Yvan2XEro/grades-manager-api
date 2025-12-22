import type {
	ExportColumnConfig,
	ExportHeaderConfig,
	ExportStyleConfig,
	ExportTemplate,
	ExportTemplateType,
} from "../../db/schema/app-schema";
import * as exportTemplatesService from "../export-templates/export-templates.service";

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
		columns: template.columns,
		headerConfig: template.headerConfig ?? getDefaultHeaderConfig(type),
		styleConfig: template.styleConfig ?? getDefaultStyleConfig(type),
		customTemplate: template.customTemplate ?? undefined,
	};
}

/**
 * Template configuration returned to services
 */
export type TemplateConfiguration = {
	columns: ExportColumnConfig[];
	headerConfig: ExportHeaderConfig;
	styleConfig: ExportStyleConfig;
	customTemplate?: string;
};

/**
 * Get default template configuration for a type
 */
function getDefaultTemplateConfig(
	type: ExportTemplateType,
): TemplateConfiguration {
	return {
		columns: getDefaultColumns(type),
		headerConfig: getDefaultHeaderConfig(type),
		styleConfig: getDefaultStyleConfig(type),
	};
}

/**
 * Default columns for each export type
 */
function getDefaultColumns(type: ExportTemplateType): ExportColumnConfig[] {
	switch (type) {
		case "pv":
			return [
				{
					id: "rank",
					key: "rank",
					label: "Rang",
					labelFr: "Rang",
					labelEn: "Rank",
					width: 50,
					visible: true,
					order: 1,
					dataType: "number",
					alignment: "center",
				},
				{
					id: "registrationNumber",
					key: "registrationNumber",
					label: "Matricule",
					labelFr: "Matricule",
					labelEn: "Registration Number",
					width: 120,
					visible: true,
					order: 2,
					dataType: "text",
					alignment: "center",
				},
				{
					id: "fullName",
					key: "fullName",
					label: "Nom et Prénom(s)",
					labelFr: "Nom et Prénom(s)",
					labelEn: "Full Name",
					width: 200,
					visible: true,
					order: 3,
					dataType: "text",
					alignment: "left",
				},
				{
					id: "average",
					key: "average",
					label: "Moyenne",
					labelFr: "Moyenne",
					labelEn: "Average",
					width: 80,
					visible: true,
					order: 4,
					dataType: "number",
					format: "0.00",
					alignment: "center",
				},
				{
					id: "decision",
					key: "decision",
					label: "Décision",
					labelFr: "Décision",
					labelEn: "Decision",
					width: 100,
					visible: true,
					order: 5,
					dataType: "text",
					alignment: "center",
				},
				{
					id: "creditsEarned",
					key: "creditsEarned",
					label: "Crédits",
					labelFr: "Crédits",
					labelEn: "Credits",
					width: 80,
					visible: true,
					order: 6,
					dataType: "number",
					alignment: "center",
				},
			];

		case "evaluation":
			return [
				{
					id: "registrationNumber",
					key: "registrationNumber",
					label: "Matricule",
					labelFr: "Matricule",
					labelEn: "Registration Number",
					width: 120,
					visible: true,
					order: 1,
					dataType: "text",
					alignment: "center",
				},
				{
					id: "fullName",
					key: "fullName",
					label: "Nom et Prénom(s)",
					labelFr: "Nom et Prénom(s)",
					labelEn: "Full Name",
					width: 200,
					visible: true,
					order: 2,
					dataType: "text",
					alignment: "left",
				},
				{
					id: "score",
					key: "score",
					label: "Note",
					labelFr: "Note",
					labelEn: "Score",
					width: 80,
					visible: true,
					order: 3,
					dataType: "number",
					format: "0.00",
					alignment: "center",
				},
				{
					id: "appreciation",
					key: "appreciation",
					label: "Appréciation",
					labelFr: "Appréciation",
					labelEn: "Appreciation",
					width: 120,
					visible: true,
					order: 4,
					dataType: "text",
					alignment: "center",
				},
				{
					id: "observation",
					key: "observation",
					label: "Observation",
					labelFr: "Observation",
					labelEn: "Observation",
					width: 100,
					visible: true,
					order: 5,
					dataType: "text",
					alignment: "center",
				},
			];

		case "ue":
			return [
				{
					id: "fullName",
					key: "fullName",
					label: "Nom et Prénom(s)",
					labelFr: "Nom et Prénom(s)",
					labelEn: "Full Name",
					width: 200,
					visible: true,
					order: 1,
					dataType: "text",
					alignment: "left",
				},
				{
					id: "ueAverage",
					key: "ueAverage",
					label: "Moyenne UE",
					labelFr: "Moyenne UE",
					labelEn: "UE Average",
					width: 100,
					visible: true,
					order: 2,
					dataType: "number",
					format: "0.00",
					alignment: "center",
				},
				{
					id: "decision",
					key: "decision",
					label: "Décision",
					labelFr: "Décision",
					labelEn: "Decision",
					width: 100,
					visible: true,
					order: 3,
					dataType: "text",
					alignment: "center",
				},
				{
					id: "creditsEarned",
					key: "creditsEarned",
					label: "Crédits",
					labelFr: "Crédits",
					labelEn: "Credits",
					width: 80,
					visible: true,
					order: 4,
					dataType: "number",
					alignment: "center",
				},
			];

		case "excel_combined":
		case "excel_pv":
		case "excel_individual":
			return [
				{
					id: "lastName",
					key: "lastName",
					label: "Nom",
					labelFr: "Nom",
					labelEn: "Last Name",
					width: 150,
					visible: true,
					order: 1,
					dataType: "text",
					alignment: "left",
				},
				{
					id: "firstName",
					key: "firstName",
					label: "Prénom",
					labelFr: "Prénom",
					labelEn: "First Name",
					width: 150,
					visible: true,
					order: 2,
					dataType: "text",
					alignment: "left",
				},
				{
					id: "registrationNumber",
					key: "registrationNumber",
					label: "Matricule",
					labelFr: "Matricule",
					labelEn: "Registration Number",
					width: 120,
					visible: true,
					order: 3,
					dataType: "text",
					alignment: "center",
				},
				{
					id: "birthDate",
					key: "birthDate",
					label: "Date de naissance",
					labelFr: "Date de naissance",
					labelEn: "Birth Date",
					width: 120,
					visible: true,
					order: 4,
					dataType: "date",
					format: "DD/MM/YYYY",
					alignment: "center",
				},
				{
					id: "birthPlace",
					key: "birthPlace",
					label: "Lieu de naissance",
					labelFr: "Lieu de naissance",
					labelEn: "Birth Place",
					width: 200,
					visible: true,
					order: 5,
					dataType: "text",
					alignment: "left",
				},
				{
					id: "gender",
					key: "gender",
					label: "Sexe",
					labelFr: "Sexe",
					labelEn: "Gender",
					width: 80,
					visible: true,
					order: 6,
					dataType: "text",
					alignment: "center",
				},
			];

		default:
			return [];
	}
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

/**
 * Apply column formula if present
 */
export function applyColumnFormula(
	formula: string,
	data: Record<string, any>,
): number {
	try {
		// Simple formula parser for basic math operations
		// Support: CC * 0.4 + EXAM * 0.6, etc.
		let result = formula;

		// Replace variable names with values
		for (const [key, value] of Object.entries(data)) {
			if (typeof value === "number") {
				result = result.replace(new RegExp(key, "g"), value.toString());
			}
		}

		// Evaluate the expression
		// eslint-disable-next-line no-eval
		return eval(result);
	} catch (error) {
		console.error("Error applying formula:", formula, error);
		return 0;
	}
}

/**
 * Filter and sort columns based on configuration
 */
export function getVisibleColumns(
	columns: ExportColumnConfig[],
): ExportColumnConfig[] {
	return columns.filter((col) => col.visible).sort((a, b) => a.order - b.order);
}

/**
 * Format cell value based on column configuration
 */
export function formatCellValue(
	value: any,
	column: ExportColumnConfig,
): string {
	if (value === null || value === undefined) {
		return "";
	}

	switch (column.dataType) {
		case "number":
			if (typeof value === "number") {
				if (column.format) {
					// Simple format: "0.00" means 2 decimals
					const decimals = (column.format.match(/0/g) || []).length - 1;
					return value.toFixed(Math.max(0, decimals));
				}
				return value.toString();
			}
			return value.toString();

		case "date":
			if (value instanceof Date || typeof value === "string") {
				const date = new Date(value);
				if (column.format === "DD/MM/YYYY") {
					return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
				}
				return date.toLocaleDateString();
			}
			return value.toString();

		case "formula":
			// Formula should be pre-calculated
			return value.toString();

		default:
			return value.toString();
	}
}

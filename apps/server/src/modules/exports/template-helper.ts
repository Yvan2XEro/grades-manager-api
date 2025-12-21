import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
	Institution,
	InstitutionMetadata,
} from "../../db/schema/app-schema";

/**
 * Configuration interface for exports
 */
export interface ExportConfig {
	institution: {
		// Institute/Institution information
		name_fr: string;
		name_en: string;
		logo_url: string;
		contact_email?: string;
		fax?: string;
		postal_box?: string;
		// Supervising faculty/school information
		faculty_name_fr?: string;
		faculty_name_en?: string;
		// Parent university information
		university_name_fr?: string;
		university_name_en?: string;
		university_logo_url?: string;
		university_contact_email?: string;
		university_fax?: string;
		university_postal_box?: string;
	};
	grading: {
		appreciations: Array<{
			label: string;
			min: number;
			max: number;
		}>;
		passing_grade: number;
		scale: number;
	};
	signatures: {
		pv: Array<{ position: string; name: string }>;
		evaluation: Array<{ position: string; name: string }>;
		ue: Array<{ position: string; name: string }>;
	};
	exam_settings: {
		default_duration_hours: number;
		default_coefficient: number;
		exam_types: Record<
			string,
			{
				label: string;
				coefficient: number;
			}
		>;
	};
	watermark: {
		text: string;
		enabled: boolean;
	};
}

/**
 * Load export configuration from JSON file (fallback for compatibility)
 */
export function loadExportConfig(): ExportConfig {
	const configPath = join(import.meta.dir, "../../config/export-config.json");
	const configData = readFileSync(configPath, "utf-8");
	const jsonConfig = JSON.parse(configData);

	// Convert old format to new format
	return {
		institution: {
			name_fr: jsonConfig.institution?.university?.name_fr || "UNIVERSITÉ",
			name_en: jsonConfig.institution?.university?.name_en || "UNIVERSITY",
			logo_url: jsonConfig.institution?.university?.logo_url || "",
			faculty_name_fr: jsonConfig.institution?.faculty?.name_fr,
			faculty_name_en: jsonConfig.institution?.faculty?.name_en,
		},
		grading: jsonConfig.grading,
		signatures: jsonConfig.signatures,
		exam_settings: jsonConfig.exam_settings,
		watermark: jsonConfig.watermark,
	};
}

/**
 * Convert institution data from database to ExportConfig format
 * Handles 3-level hierarchy: University → Faculty/School → Institute
 */
export function institutionToExportConfig(
	institution: Institution & {
		faculty?: { name: string } | null;
		parentInstitution?: (Institution & { faculty?: { name: string } | null }) | null;
	},
): ExportConfig {
	const metadata = institution.metadata as InstitutionMetadata;
	const exportConfig = metadata?.export_config;

	// Extract university (parent institution) data
	const university = institution.parentInstitution;
	// Extract supervising faculty/school data
	const supervisingFaculty = institution.faculty;

	// Default values matching the old export-config.json
	return {
		institution: {
			// Institute/Institution information
			name_fr: institution.nameFr,
			name_en: institution.nameEn,
			logo_url: institution.logoUrl || "/logos/institution.png",
			contact_email: institution.contactEmail,
			fax: institution.fax,
			postal_box: institution.postalBox,
			// Supervising faculty/school information
			faculty_name_fr: supervisingFaculty?.name,
			faculty_name_en: supervisingFaculty?.name,
			// Parent university information
			university_name_fr: university?.nameFr,
			university_name_en: university?.nameEn,
			university_logo_url: university?.logoUrl,
			university_contact_email: university?.contactEmail,
			university_fax: university?.fax,
			university_postal_box: university?.postalBox,
		},
		grading: exportConfig?.grading || {
			appreciations: [
				{ label: "Excellent", min: 16, max: 20 },
				{ label: "Très Bien", min: 14, max: 15.99 },
				{ label: "Bien", min: 12, max: 13.99 },
				{ label: "Assez Bien", min: 10, max: 11.99 },
				{ label: "Passable", min: 8, max: 9.99 },
				{ label: "Insuffisant", min: 0, max: 7.99 },
			],
			passing_grade: 10,
			scale: 20,
		},
		signatures: exportConfig?.signatures || {
			pv: [
				{ position: "Le Rapporteur", name: "" },
				{ position: "Les Membres du Jury", name: "" },
				{ position: "Le Président du Jury", name: "" },
			],
			evaluation: [
				{ position: "L'Enseignant", name: "" },
				{ position: "Le Chef de Département", name: "" },
				{ position: "Le Directeur des Études", name: "" },
			],
			ue: [
				{ position: "Le Rapporteur", name: "" },
				{ position: "Les Membres du Jury", name: "" },
				{ position: "Le Président du Jury", name: "" },
			],
		},
		exam_settings: exportConfig?.exam_settings || {
			default_duration_hours: 2,
			default_coefficient: 1,
			exam_types: {
				CC: { label: "Contrôle Continu", coefficient: 0.4 },
				TPE: { label: "Travaux Pratiques Encadrés", coefficient: 0.3 },
				TP: { label: "Travaux Pratiques", coefficient: 0.3 },
				EXAMEN: { label: "Examen", coefficient: 0.6 },
				RATTRAPAGE: { label: "Rattrapage", coefficient: 1.0 },
			},
		},
		watermark: exportConfig?.watermark || {
			text: "ORIGINAL",
			enabled: true,
		},
	};
}

/**
 * Load HTML template from file
 */
export function loadTemplate(templateName: "pv" | "evaluation" | "ue"): string {
	const templateMap = {
		pv: "pv template.html",
		evaluation: "publication_evaluation.html",
		ue: "publication_ue.html",
	};

	const templatePath = join(
		import.meta.dir,
		"../../../../../modeles_html",
		templateMap[templateName],
	);

	return readFileSync(templatePath, "utf-8");
}

/**
 * Get appreciation label for a given score
 */
export function getAppreciation(score: number, config: ExportConfig): string {
	for (const appreciation of config.grading.appreciations) {
		if (score >= appreciation.min && score <= appreciation.max) {
			return appreciation.label;
		}
	}
	return "Non évalué";
}

/**
 * Get observation for a student score
 */
export function getObservation(
	score: number | null,
	config: ExportConfig,
): string {
	if (score === null) return "Absent";
	return score >= config.grading.passing_grade ? "Admis" : "Ajourné";
}

/**
 * Calculate success rate
 */
export function calculateSuccessRate(
	scores: Array<number | null>,
	passingGrade: number,
): number {
	const validScores = scores.filter((s): s is number => s !== null);
	if (validScores.length === 0) return 0;

	const passedCount = validScores.filter((s) => s >= passingGrade).length;
	return Math.round((passedCount / validScores.length) * 100);
}

/**
 * Format number to French locale (XX,XX)
 */
export function formatNumber(num: number | null, decimals = 2): string {
	if (num === null) return "ABS";
	return num.toFixed(decimals).replace(".", ",");
}

/**
 * Calculate statistics for a set of grades
 */
export function calculateStats(scores: Array<number | null>) {
	const validScores = scores.filter((s): s is number => s !== null);

	if (validScores.length === 0) {
		return {
			count: scores.length,
			present: 0,
			absent: scores.length,
			average: 0,
			highest: 0,
			lowest: 0,
		};
	}

	return {
		count: scores.length,
		present: validScores.length,
		absent: scores.length - validScores.length,
		average:
			validScores.reduce((sum, score) => sum + score, 0) / validScores.length,
		highest: Math.max(...validScores),
		lowest: Math.min(...validScores),
	};
}

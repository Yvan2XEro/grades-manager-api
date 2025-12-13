import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Configuration interface for exports
 */
export interface ExportConfig {
	institution: {
		university: {
			name_fr: string;
			name_en: string;
			logo_url: string;
		};
		faculty: {
			name_fr: string;
			name_en: string;
			logo_url: string;
		};
		institute: {
			name_fr: string;
			name_en: string;
			logo_url: string;
		};
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
 * Load export configuration from JSON file
 */
export function loadExportConfig(): ExportConfig {
	const configPath = join(import.meta.dir, "../../config/export-config.json");
	const configData = readFileSync(configPath, "utf-8");
	return JSON.parse(configData) as ExportConfig;
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

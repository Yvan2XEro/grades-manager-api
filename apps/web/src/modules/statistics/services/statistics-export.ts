import type { TFunction } from "i18next";
import * as XLSX from "xlsx";
import type {
	AdmissionsStats,
	EnrollmentStats,
	FinanceStats,
	PerformanceStats,
} from "../types";

/** Writes one workbook with a sheet per `[name, rows]` pair. */
function writeWorkbook(
	filename: string,
	sheets: Array<[string, Record<string, unknown>[]]>,
) {
	const wb = XLSX.utils.book_new();
	for (const [name, rows] of sheets) {
		XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
	}
	XLSX.writeFile(wb, filename);
}

export const exportEnrollmentStats = (data: EnrollmentStats) =>
	writeWorkbook("statistiques-etudiants.xlsx", [
		[
			"Par programme",
			data.byProgram.map((p) => ({
				Programme: p.programName,
				Inscrits: p.count,
			})),
		],
		[
			"Par statut",
			data.byStatus.map((s) => ({ Statut: s.status, Count: s.count })),
		],
		[
			"Par genre",
			data.byGender.map((g) => ({
				Genre: g.gender ?? "N/A",
				Count: g.count,
			})),
		],
	]);

export const exportPerformanceStats = (data: PerformanceStats) =>
	writeWorkbook("statistiques-performance.xlsx", [
		[
			"Par décision",
			data.byDecision.map((d) => ({
				Décision: d.decision ?? "N/A",
				Étudiants: d.count,
			})),
		],
		[
			"Par mention",
			data.byMention.map((m) => ({
				Mention: m.mention ?? "N/A",
				Étudiants: m.count,
			})),
		],
	]);

export const exportFinanceStats = (data: FinanceStats, t: TFunction) =>
	writeWorkbook("statistiques-finances.xlsx", [
		[
			"Vue d'ensemble",
			[
				{
					Indicateur: t("admin.statistics.finances.expected"),
					Montant: data.expected,
				},
				{
					Indicateur: t("admin.statistics.finances.collected"),
					Montant: data.collected,
				},
				{
					Indicateur: t("admin.statistics.finances.outstanding"),
					Montant: data.outstanding,
				},
				{
					Indicateur: t("admin.statistics.finances.collectionRate"),
					Montant: `${data.collectionRate}%`,
				},
			],
		],
		[
			"Mensuel",
			data.monthlyCollections.map((m) => ({
				Mois: m.month,
				Montant: m.total,
			})),
		],
		[
			"Par méthode",
			data.byPaymentMethod.map((m) => ({
				Méthode: m.method,
				Montant: m.total,
				Transactions: m.count,
			})),
		],
	]);

export const exportAdmissionsStats = (data: AdmissionsStats) =>
	writeWorkbook("statistiques-admissions.xlsx", [
		[
			"Par statut",
			data.byStatus.map((s) => ({
				Statut: s.status,
				Candidatures: s.count,
			})),
		],
		[
			"Par programme",
			data.byProgram.map((p) => ({
				Programme: p.programName,
				Candidatures: p.count,
			})),
		],
	]);

export function formatAmount(n: number) {
	return `${new Intl.NumberFormat("fr-FR", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n)} XAF`;
}

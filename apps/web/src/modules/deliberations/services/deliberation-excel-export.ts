import * as XLSX from "xlsx";
import { fileDateStamp } from "@/lib/download";

/**
 * Writes the deliberation minutes (header, one row per student with the
 * per-UE average/decision/credits, and a stats line) to an .xlsx file.
 * `data` is the payload of `exports.getDeliberationData`.
 */
export function exportDeliberationExcel(data: any) {
	const headerRows: any[][] = [
		[data.name_fr || data.name_en || ""],
		[],
		[
			data.deliberation?.programName
				? `Programme: ${data.deliberation.programName}`
				: "",
		],
		[
			data.deliberation?.className
				? `Classe: ${data.deliberation.className}`
				: "",
		],
		[
			data.deliberation?.academicYearName
				? `Année académique: ${data.deliberation.academicYearName}`
				: "",
		],
		[
			data.deliberation?.semesterName
				? `Semestre: ${data.deliberation.semesterName}`
				: "",
		],
		[],
	];

	const ues: any[] = data.ues ?? [];
	const colHeaders = ["Rang", "Matricule", "Nom", "Prénom"];
	for (const ue of ues) {
		colHeaders.push(`${ue.code} Moy`, `${ue.code} Dec`, `${ue.code} Cré`);
	}
	colHeaders.push("Moy Gén", "Crédits", "Décision", "Mention");
	headerRows.push(colHeaders);

	const dataRows = (data.students ?? []).map((s: any) => {
		const row: any[] = [s.rank, s.registrationNumber, s.lastName, s.firstName];
		for (const ue of s.ueResults ?? []) {
			row.push(
				ue.ueAverage != null ? Math.round(ue.ueAverage * 100) / 100 : "",
				ue.decision,
				ue.creditsEarned,
			);
		}
		row.push(
			s.generalAverage != null ? Math.round(s.generalAverage * 100) / 100 : "",
			`${s.totalCreditsEarned} / ${s.totalCreditsPossible}`,
			s.finalDecisionLabel,
			s.mentionLabel ?? "",
		);
		return row;
	});

	const statsRow = data.stats
		? [
				`Taux de réussite: ${data.stats.successRate}% | Admis: ${data.stats.admittedCount} | Compensés: ${data.stats.compensatedCount} | Ajournés: ${data.stats.deferredCount}`,
			]
		: [];

	const allRows = [...headerRows, ...dataRows, [], statsRow];
	const ws = XLSX.utils.aoa_to_sheet(allRows);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Délibération");
	XLSX.writeFile(wb, `Deliberation_${fileDateStamp()}.xlsx`);
}

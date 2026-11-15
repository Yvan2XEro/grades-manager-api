import * as XLSX from "xlsx";
import i18n from "@/i18n";
import { fileDateStamp } from "@/lib/download";

/**
 * Writes the deliberation minutes (header, one row per student with the
 * per-UE average/decision/credits, and a stats line) to an .xlsx file.
 * `data` is the payload of `exports.getDeliberationData`.
 */
export function exportDeliberationExcel(data: any) {
	const t = i18n.t;
	const institutionName = i18n.language.startsWith("fr")
		? data.name_fr || data.name_en
		: data.name_en || data.name_fr;
	const headerRows: any[][] = [
		[institutionName || ""],
		[],
		[
			data.deliberation?.programName
				? t("admin.deliberations.excel.program", {
						value: data.deliberation.programName,
					})
				: "",
		],
		[
			data.deliberation?.className
				? t("admin.deliberations.excel.class", {
						value: data.deliberation.className,
					})
				: "",
		],
		[
			data.deliberation?.academicYearName
				? t("admin.deliberations.excel.academicYear", {
						value: data.deliberation.academicYearName,
					})
				: "",
		],
		[
			data.deliberation?.semesterName
				? t("admin.deliberations.excel.semester", {
						value: data.deliberation.semesterName,
					})
				: "",
		],
		[],
	];

	const ues: any[] = data.ues ?? [];
	const colHeaders: string[] = [
		t("admin.deliberations.excel.rank"),
		t("admin.deliberations.excel.registrationNumber"),
		t("admin.deliberations.excel.lastName"),
		t("admin.deliberations.excel.firstName"),
	];
	for (const ue of ues) {
		colHeaders.push(
			t("admin.deliberations.excel.ueAverage", { code: ue.code }),
			t("admin.deliberations.excel.ueDecision", { code: ue.code }),
			t("admin.deliberations.excel.ueCredits", { code: ue.code }),
		);
	}
	colHeaders.push(
		t("admin.deliberations.excel.generalAverage"),
		t("admin.deliberations.excel.credits"),
		t("admin.deliberations.excel.decision"),
		t("admin.deliberations.excel.mention"),
	);
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
				t("admin.deliberations.excel.stats", {
					rate: data.stats.successRate,
					admitted: data.stats.admittedCount,
					compensated: data.stats.compensatedCount,
					deferred: data.stats.deferredCount,
				}),
			]
		: [];

	const allRows = [...headerRows, ...dataRows, [], statsRow];
	const ws = XLSX.utils.aoa_to_sheet(allRows);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(
		wb,
		ws,
		t("admin.deliberations.excel.sheetName"),
	);
	XLSX.writeFile(wb, `Deliberation_${fileDateStamp()}.xlsx`);
}

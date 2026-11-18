import * as XLSX from "xlsx";
import i18n from "@/i18n";
import { fileDateStamp } from "@/lib/download";
import { formatPercent } from "@/lib/number-format";

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Writes the deliberation minutes (PV) to an .xlsx file: title, class /
 * program / year / session, one row per student ordered by rank (per-UE
 * average, decision and credits), the statistics and the jury's signature
 * block. `data` is the payload of `exports.getDeliberationData`.
 */
export function exportDeliberationExcel(data: any) {
	const t = i18n.t;
	const delib = data.deliberation ?? {};
	const institutionName = i18n.language.startsWith("fr")
		? data.name_fr || data.name_en
		: data.name_en || data.name_fr;
	const session = delib.type
		? t(`admin.deliberations.type.${delib.type}`) +
			(delib.semesterName ? ` — ${delib.semesterName}` : "")
		: (delib.semesterName ?? "");

	const headerRows: any[][] = [
		[institutionName || ""],
		[],
		[t("admin.deliberations.excel.title")],
		[t("admin.deliberations.excel.class", { value: delib.className ?? "" })],
		[
			t("admin.deliberations.excel.program", {
				value: delib.programName ?? "",
			}),
		],
		[
			t("admin.deliberations.excel.academicYear", {
				value: delib.academicYearName ?? "",
			}),
		],
		[t("admin.deliberations.excel.session", { value: session })],
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

	// The server already orders students by rank, then by name (unranked last)
	const dataRows = (data.students ?? []).map((s: any) => {
		const row: any[] = [
			s.rank ?? "—",
			s.registrationNumber,
			s.lastName,
			s.firstName,
		];
		for (const ue of s.ueResults ?? []) {
			row.push(
				ue.ueAverage != null ? round2(ue.ueAverage) : "",
				ue.decision ? t(`admin.deliberations.ueDecision.${ue.decision}`) : "",
				ue.creditsEarned,
			);
		}
		row.push(
			s.generalAverage != null ? round2(s.generalAverage) : "",
			`${s.totalCreditsEarned} / ${s.totalCreditsPossible}`,
			t(`admin.deliberations.decision.${s.finalDecision ?? "pending"}`),
			s.mention ? t(`admin.deliberations.mention.${s.mention}`) : "",
		);
		return row;
	});

	const stats = data.stats;
	const statsRows: any[][] = stats
		? [
				[
					t("admin.deliberations.excel.stats", {
						rate: formatPercent(stats.successRate),
						admitted: stats.admittedCount ?? 0,
						compensated: stats.compensatedCount ?? 0,
						deferred: stats.deferredCount ?? 0,
						repeat: stats.repeatCount ?? 0,
						excluded: stats.excludedCount ?? 0,
						incomplete: stats.pendingCount ?? 0,
					}),
				],
				[
					t("admin.deliberations.excel.classAverage", {
						value:
							stats.classAverage != null
								? round2(stats.classAverage).toFixed(2)
								: "—",
					}),
				],
			]
		: [];

	// Signature block: jury president, then each member, with a line to sign
	const jury = data.jury ?? {};
	const signatureRows: any[][] = [
		[t("admin.deliberations.excel.signatures")],
		[
			t("admin.deliberations.excel.president"),
			jury.president?.name ?? "",
			"",
			t("admin.deliberations.excel.signatureLine"),
		],
		...((jury.members ?? []) as Array<{ name: string; role?: string }>).map(
			(m) => [
				m.role || t("admin.deliberations.excel.member"),
				m.name,
				"",
				t("admin.deliberations.excel.signatureLine"),
			],
		),
	];
	if (!jury.members?.length) {
		signatureRows.push([
			t("admin.deliberations.excel.member"),
			"",
			"",
			t("admin.deliberations.excel.signatureLine"),
		]);
	}

	const allRows = [
		...headerRows,
		...dataRows,
		[],
		...statsRows,
		[],
		...signatureRows,
	];
	const ws = XLSX.utils.aoa_to_sheet(allRows);
	ws["!cols"] = [
		{ wch: 6 },
		{ wch: 18 },
		{ wch: 20 },
		{ wch: 20 },
		...ues.flatMap(() => [{ wch: 9 }, { wch: 12 }, { wch: 6 }]),
		{ wch: 10 },
		{ wch: 10 },
		{ wch: 14 },
		{ wch: 12 },
	];
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(
		wb,
		ws,
		t("admin.deliberations.excel.sheetName"),
	);
	XLSX.writeFile(
		wb,
		`${t("admin.deliberations.excel.filePrefix")}_${(delib.className ?? "")
			.replace(/[^\p{L}\p{N}]+/gu, "-")
			.replace(/^-|-$/g, "")}_${fileDateStamp()}.xlsx`,
	);
}

import type { TFunction } from "i18next";
import * as XLSX from "xlsx";
import i18n from "@/i18n";
import { formatMoney } from "@/lib/money";
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

const x = (key: string) => i18n.t(`admin.statistics.excel.${key}` as never);
const NA = () => x("notAvailable");
const ENROLLMENT_STATUSES = ["active", "pending", "completed", "withdrawn"];

export const exportEnrollmentStats = (data: EnrollmentStats) =>
	writeWorkbook(x("files.students"), [
		[
			x("sheets.byProgram"),
			data.byProgram.map((p) => ({
				[x("columns.program")]: p.programName,
				[x("columns.enrolled")]: p.count,
			})),
		],
		[
			x("sheets.byStatus"),
			data.byStatus.map((s) => ({
				[x("columns.status")]: ENROLLMENT_STATUSES.includes(s.status)
					? i18n.t(`admin.statistics.enrollment.status.${s.status}` as never)
					: s.status,
				[x("columns.count")]: s.count,
			})),
		],
		[
			x("sheets.byGender"),
			data.byGender.map((g) => ({
				[x("columns.gender")]: i18n.t(
					`admin.statistics.gender.${g.gender ?? "unknown"}` as never,
				),
				[x("columns.count")]: g.count,
			})),
		],
	]);

export const exportPerformanceStats = (data: PerformanceStats) =>
	writeWorkbook(x("files.performance"), [
		[
			x("sheets.byDecision"),
			data.byDecision.map((d) => ({
				[x("columns.decision")]: i18n.t(
					`admin.deliberations.decision.${d.decision ?? "pending"}` as never,
				),
				[x("columns.students")]: d.count,
			})),
		],
		[
			x("sheets.byMention"),
			data.byMention.map((m) => ({
				[x("columns.mention")]: m.mention
					? i18n.t(`admin.deliberations.mention.${m.mention}` as never)
					: NA(),
				[x("columns.students")]: m.count,
			})),
		],
	]);

export const exportFinanceStats = (data: FinanceStats, t: TFunction) =>
	writeWorkbook(x("files.finances"), [
		[
			x("sheets.overview"),
			[
				{
					[x("columns.indicator")]: t("admin.statistics.finances.expected"),
					[x("columns.amount")]: data.expected,
				},
				{
					[x("columns.indicator")]: t("admin.statistics.finances.collected"),
					[x("columns.amount")]: data.collected,
				},
				{
					[x("columns.indicator")]: t("admin.statistics.finances.outstanding"),
					[x("columns.amount")]: data.outstanding,
				},
				{
					[x("columns.indicator")]: t(
						"admin.statistics.finances.collectionRate",
					),
					[x("columns.amount")]: `${data.collectionRate}%`,
				},
			],
		],
		[
			x("sheets.monthly"),
			data.monthlyCollections.map((m) => ({
				[x("columns.month")]: m.month,
				[x("columns.amount")]: m.total,
			})),
		],
		[
			x("sheets.byMethod"),
			data.byPaymentMethod.map((m) => ({
				[x("columns.method")]: m.method,
				[x("columns.amount")]: m.total,
				[x("columns.transactions")]: m.count,
			})),
		],
	]);

export const exportAdmissionsStats = (data: AdmissionsStats) =>
	writeWorkbook(x("files.admissions"), [
		[
			x("sheets.byStatus"),
			data.byStatus.map((s) => ({
				[x("columns.status")]: s.status,
				[x("columns.applications")]: s.count,
			})),
		],
		[
			x("sheets.byProgram"),
			data.byProgram.map((p) => ({
				[x("columns.program")]: p.programName,
				[x("columns.applications")]: p.count,
			})),
		],
	]);

/** Amount in FCFA, in the UI language. */
export const formatAmount = (n: number) => formatMoney(n);

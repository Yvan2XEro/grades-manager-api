import i18n from "@/i18n";
import { formatMoney } from "@/lib/money";
import type { ProgramBar, StatusSlice } from "../types";

const STATUS_COLORS: Record<string, string> = {
	active: "var(--chart-2)",
	pending: "var(--chart-3)",
	completed: "var(--chart-1)",
	withdrawn: "var(--chart-4)",
};

const KNOWN_STATUSES = ["active", "pending", "completed", "withdrawn"] as const;
type KnownStatus = (typeof KNOWN_STATUSES)[number];
const isKnownStatus = (status: string): status is KnownStatus =>
	(KNOWN_STATUSES as readonly string[]).includes(status);

export function toProgramBars(
	byProgram: { programName: string; count: number }[] | undefined,
): ProgramBar[] {
	return (byProgram ?? []).map((p) => ({
		name: p.programName,
		students: p.count,
	}));
}

export function toStatusSlices(
	byStatus: { status: string; count: number }[] | undefined,
): StatusSlice[] {
	return (byStatus ?? [])
		.filter((s) => s.count > 0)
		.map((s) => ({
			name: isKnownStatus(s.status)
				? i18n.t(`admin.enrollments.status.${s.status}`)
				: s.status,
			value: s.count,
			color: STATUS_COLORS[s.status] ?? "var(--chart-5)",
		}));
}

/** Amount in FCFA, in the UI language. */
export const formatAmount = (n: number) => formatMoney(n);

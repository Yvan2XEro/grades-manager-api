import type { ProgramBar, StatusSlice } from "../types";

const STATUS_COLORS: Record<string, string> = {
	active: "var(--chart-2)",
	pending: "var(--chart-3)",
	completed: "var(--chart-1)",
	withdrawn: "var(--chart-4)",
};

const STATUS_LABELS: Record<string, string> = {
	active: "Actif",
	pending: "En attente",
	completed: "Terminé",
	withdrawn: "Retiré",
};

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
			name: STATUS_LABELS[s.status] ?? s.status,
			value: s.count,
			color: STATUS_COLORS[s.status] ?? "var(--chart-5)",
		}));
}

export function formatAmount(n: number) {
	return `${new Intl.NumberFormat("fr-FR", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n)} XAF`;
}

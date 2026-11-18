import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnrollmentStats } from "../hooks/use-statistics";
import { exportEnrollmentStats } from "../services/statistics-export";
import { ChartCard } from "./chart-card";
import { ColorLegend } from "./color-legend";
import { DonutChart } from "./donut-chart";
import { ProgramBarChart } from "./program-bar-chart";
import { StatFigure, StatTabHeader } from "./stat-tab-header";

const STATUS_COLORS: Record<string, string> = {
	active: "var(--chart-2)",
	pending: "var(--chart-3)",
	completed: "var(--chart-1)",
	withdrawn: "var(--chart-4)",
};
const GENDER_COLORS: Record<string, string> = {
	male: "var(--chart-1)",
	female: "var(--chart-2)",
	other: "var(--chart-3)",
};

export function StatisticsStudentsTab({ yearId }: { yearId: string | null }) {
	const { t } = useTranslation();
	const { data, isLoading } = useEnrollmentStats(yearId);

	if (isLoading) return <Skeleton className="h-96 w-full" />;

	const total = data?.total ?? 0;
	const byProgram = (data?.byProgram ?? []).map((p) => ({
		name: p.programName,
		value: p.count,
	}));
	const byStatus = (data?.byStatus ?? [])
		.filter((s) => s.count > 0)
		.map((s) => ({
			name: t(`admin.statistics.enrollment.status.${s.status}`, {
				defaultValue: s.status,
			}),
			value: s.count,
			color: STATUS_COLORS[s.status] ?? "var(--chart-5)",
		}));
	const byGender = (data?.byGender ?? []).map((g) => ({
		name: t(`admin.statistics.gender.${g.gender ?? "unknown"}`, {
			defaultValue: g.gender ?? "N/A",
		}),
		value: g.count,
		color: GENDER_COLORS[g.gender ?? "other"] ?? "var(--chart-5)",
	}));

	return (
		<div className="space-y-5">
			<StatTabHeader onExport={() => data && exportEnrollmentStats(data)}>
				<StatFigure
					icon={Users}
					value={total.toLocaleString()}
					label={t("admin.statistics.enrollment.totalLabel")}
				/>
			</StatTabHeader>

			<div className="grid gap-5 lg:grid-cols-5">
				<ChartCard
					className="lg:col-span-3"
					title={t("admin.statistics.enrollment.byProgram")}
					isEmpty={byProgram.length === 0}
					emptyClassName="py-16"
				>
					<ProgramBarChart data={byProgram} />
				</ChartCard>

				<div className="flex flex-col gap-5 lg:col-span-2">
					<ChartCard
						title={t("admin.statistics.enrollment.byStatus")}
						isEmpty={byStatus.length === 0}
						emptyClassName="py-6"
					>
						<DonutChart data={byStatus} />
						<ColorLegend items={byStatus} />
					</ChartCard>

					<ChartCard
						title={t("admin.statistics.enrollment.byGender")}
						isEmpty={byGender.length === 0}
						emptyClassName="py-6"
					>
						<ColorLegend items={byGender} className="space-y-2" />
					</ChartCard>
				</div>
			</div>
		</div>
	);
}

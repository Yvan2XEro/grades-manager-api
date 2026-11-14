import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmissionsStats } from "../hooks/use-statistics";
import { exportAdmissionsStats } from "../services/statistics-export";
import { ChartCard } from "./chart-card";
import { ColorLegend } from "./color-legend";
import { DonutChart } from "./donut-chart";
import { ProgramBarChart } from "./program-bar-chart";
import { StatFigure, StatTabHeader } from "./stat-tab-header";

const STATUS_COLORS: Record<string, string> = {
	draft: "var(--chart-5)",
	submitted: "var(--chart-3)",
	pending: "var(--chart-3)",
	approved: "var(--chart-2)",
	rejected: "var(--destructive)",
	waitlisted: "var(--chart-4)",
	enrolled: "var(--chart-1)",
};

export function StatisticsAdmissionsTab({ yearId }: { yearId: string | null }) {
	const { t } = useTranslation();
	const { data, isLoading } = useAdmissionsStats(yearId);

	if (isLoading) return <Skeleton className="h-96 w-full" />;

	const total = data?.total ?? 0;
	const converted = data?.converted ?? 0;
	const conversionRate = data?.conversionRate ?? 0;
	const byStatus = (data?.byStatus ?? [])
		.filter((s) => s.count > 0)
		.map((s) => ({
			name: t(`admin.statistics.admissions.status.${s.status}`, {
				defaultValue: s.status,
			}),
			value: s.count,
			color: STATUS_COLORS[s.status] ?? "var(--chart-5)",
		}));
	const byProgram = (data?.byProgram ?? []).map((p) => ({
		name: p.programName,
		value: p.count,
	}));

	return (
		<div className="space-y-5">
			<StatTabHeader onExport={() => data && exportAdmissionsStats(data)}>
				<div className="flex flex-wrap items-center gap-6">
					<StatFigure
						icon={ClipboardList}
						value={total.toLocaleString()}
						label={t("admin.statistics.admissions.total")}
					/>
					<StatFigure
						value={`${conversionRate}%`}
						label={t("admin.statistics.admissions.conversionRate")}
					/>
					<StatFigure
						value={converted.toLocaleString()}
						label={t("admin.statistics.admissions.converted")}
					/>
				</div>
			</StatTabHeader>

			<div className="grid gap-5 lg:grid-cols-5">
				<ChartCard
					className="lg:col-span-3"
					title={t("admin.statistics.admissions.byProgram")}
					isEmpty={byProgram.length === 0}
				>
					<ProgramBarChart data={byProgram} />
				</ChartCard>

				<ChartCard
					className="lg:col-span-2"
					title={t("admin.statistics.admissions.byStatus")}
					isEmpty={byStatus.length === 0}
				>
					<DonutChart data={byStatus} />
					<ColorLegend items={byStatus} total={total} />
				</ChartCard>
			</div>
		</div>
	);
}

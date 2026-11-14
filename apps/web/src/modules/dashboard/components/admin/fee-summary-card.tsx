import { ArrowUpRight, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDashboardPages } from "../../hooks/use-dashboard-pages";
import { formatAmount } from "../../services/admin-dashboard-data";

type Overview = {
	feeExpected?: number;
	feeCollected?: number;
	feeOutstanding?: number;
	feeCollectionRate?: number;
};

/** Tuition fees: expected / collected / outstanding and collection rate. */
export function FeeSummaryCard({ ov }: { ov: Overview | undefined }) {
	const { t } = useTranslation();
	const openPage = useDashboardPages();
	return (
		<Card className="border-0 shadow-sm lg:col-span-3">
			<CardHeader className="flex flex-row items-center justify-between pb-3">
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
						<Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
					</div>
					<CardTitle className="text-base">
						{t("admin.dashboard.fees.title")}
					</CardTitle>
				</div>
				<button
					type="button"
					onClick={() => openPage("fees")}
					className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-primary"
				>
					{t("admin.dashboard.fees.viewAll")}
					<ArrowUpRight className="h-3.5 w-3.5" />
				</button>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-3 gap-4">
					{[
						{
							label: t("admin.dashboard.fees.expected"),
							value: formatAmount(ov?.feeExpected ?? 0),
							color: "text-foreground",
						},
						{
							label: t("admin.dashboard.fees.collected"),
							value: formatAmount(ov?.feeCollected ?? 0),
							color: "text-green-600 dark:text-green-400",
						},
						{
							label: t("admin.dashboard.fees.remaining"),
							value: formatAmount(ov?.feeOutstanding ?? 0),
							color: "text-destructive",
						},
					].map((item) => (
						<div key={item.label}>
							<p className="text-muted-foreground text-xs">{item.label}</p>
							<p
								className={cn(
									"mt-0.5 font-semibold text-sm tabular-nums",
									item.color,
								)}
							>
								{item.value}
							</p>
						</div>
					))}
				</div>
				<div>
					<div className="mb-1.5 flex items-center justify-between text-xs">
						<span className="text-muted-foreground">
							{t("admin.dashboard.fees.rate")}
						</span>
						<span className="font-semibold">{ov?.feeCollectionRate ?? 0}%</span>
					</div>
					<div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-green-500 transition-all duration-700"
							style={{
								width: `${Math.min(ov?.feeCollectionRate ?? 0, 100)}%`,
							}}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

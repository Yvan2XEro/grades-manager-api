import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { FinancialHistoryCard } from "../components/financial-history-card";
import { formatMoney } from "../services/fee-format";

export default function StudentFinancialHistoryPage() {
	const { studentId } = useParams<{ studentId: string }>();
	const { t } = useTranslation();
	const navigate = useNavigate();

	const { data: history, isLoading } = useQuery(
		trpc.feeClearance.getStudentFinancialHistory.queryOptions({
			studentId: studentId!,
		}),
	);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	const totalDue = history?.reduce((s, a) => s + a.effectiveAmount, 0) ?? 0;
	const totalPaid = history?.reduce((s, a) => s + a.paidAmount, 0) ?? 0;
	const currency = history?.[0]?.currency ?? "XAF";
	const fmt = (v: number) => formatMoney(v, currency);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h2 className="font-semibold text-xl">
						{t("feeClearance.history.title")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t("feeClearance.history.subtitle")}
					</p>
				</div>
			</div>

			{/* Summary strip */}
			<div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.history.totalDue")}
					</p>
					<p className="font-bold">{fmt(totalDue)}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.history.totalPaid")}
					</p>
					<p className="font-bold text-green-600">{fmt(totalPaid)}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.history.balance")}
					</p>
					<p
						className={`font-bold ${totalDue - totalPaid > 0 ? "text-destructive" : "text-green-600"}`}
					>
						{fmt(totalDue - totalPaid)}
					</p>
				</div>
			</div>

			{/* Per-year breakdown */}
			{!history?.length ? (
				<p className="text-muted-foreground text-sm">
					{t("feeClearance.history.empty")}
				</p>
			) : (
				<div className="space-y-6">
					{history.map((a) => (
						<FinancialHistoryCard key={a.id} assignment={a} />
					))}
				</div>
			)}
		</div>
	);
}

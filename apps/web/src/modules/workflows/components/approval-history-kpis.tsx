import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Approved / rejected counts of the current page. */
export function ApprovalHistoryKpis({
	approvedCount,
	rejectedCount,
}: {
	approvedCount: number;
	rejectedCount: number;
}) {
	const { t } = useTranslation();
	return (
		<div className="grid grid-cols-2 gap-4">
			<div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
				<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
					<CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("dean.history.approved")}
					</p>
					<p className="font-bold text-xl tabular-nums">{approvedCount}</p>
				</div>
			</div>
			<div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
				<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
					<XCircle className="h-5 w-5 text-destructive" />
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("dean.history.rejected")}
					</p>
					<p className="font-bold text-xl tabular-nums">{rejectedCount}</p>
				</div>
			</div>
		</div>
	);
}

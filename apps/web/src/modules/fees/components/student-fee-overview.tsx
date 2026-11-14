import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatMoney } from "../services/fee-format";

/** Overall clearance status of the student with total due / paid / balance. */
export function StudentFeeOverview({
	cleared,
	totalDue,
	totalPaid,
	currency,
}: {
	cleared: boolean;
	totalDue: number;
	totalPaid: number;
	currency: string;
}) {
	const { t } = useTranslation();
	const money = (v: number) => formatMoney(v, currency);
	return (
		<div
			className={cn(
				"flex items-center gap-4 rounded-xl border p-4 shadow-sm",
				cleared
					? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
					: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
			)}
		>
			{cleared ? (
				<CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
			) : (
				<AlertCircle className="h-8 w-8 shrink-0 text-amber-600" />
			)}
			<div className="flex-1">
				<p className="font-semibold text-lg">
					{cleared
						? t("feeClearance.quitus.cleared")
						: t("feeClearance.quitus.notCleared")}
				</p>
				<p className="text-muted-foreground text-sm">
					{t("feeClearance.student.balance")}:{" "}
					<strong className={cleared ? "text-emerald-600" : "text-amber-700"}>
						{money(totalDue - totalPaid)}
					</strong>
				</p>
			</div>
			<div className="shrink-0 text-right">
				<p className="text-muted-foreground text-sm">
					{t("feeClearance.student.totalDue")}
				</p>
				<p className="font-bold text-lg">{money(totalDue)}</p>
				<p className="text-emerald-600 text-sm">
					{t("feeClearance.student.paid")}: {money(totalPaid)}
				</p>
			</div>
		</div>
	);
}

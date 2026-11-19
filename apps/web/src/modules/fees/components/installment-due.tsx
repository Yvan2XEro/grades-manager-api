import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/date-format";
import { cn } from "@/lib/utils";
import type { PayableInstallment } from "../types";

/** Due date of an installment, in red once it is past and still unpaid. */
export function InstallmentDue({
	installment,
}: {
	installment: Pick<PayableInstallment, "dueDate" | "status">;
}) {
	const { t } = useTranslation();
	if (!installment.dueDate) return null;
	const due = new Date(installment.dueDate);
	const endOfDueDay = new Date(due.getTime() + 24 * 60 * 60 * 1000);
	const overdue = installment.status !== "paid" && endOfDueDay < new Date();
	const date = formatDate(due, "PP");
	return (
		<span
			className={cn(
				"block text-xs",
				overdue ? "font-medium text-destructive" : "text-muted-foreground",
			)}
		>
			{overdue
				? t("feeClearance.student.overdueSince", { date })
				: t("feeClearance.student.dueOn", { date })}
		</span>
	);
}

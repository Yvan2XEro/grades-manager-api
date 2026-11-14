import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentAssignmentCard } from "../components/student-assignment-card";
import { StudentFeeOverview } from "../components/student-fee-overview";
import { useMyFinancialHistory } from "../hooks/use-my-fees";

export default function StudentFeeStatusPage() {
	const { t } = useTranslation();
	const { data: status, isLoading } = useMyFinancialHistory();

	const header = (
		<PageHeader
			title={t("feeClearance.student.title")}
			description={t("feeClearance.student.subtitle")}
		/>
	);

	if (isLoading) {
		return (
			<div className="space-y-6">
				{header}
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-48 w-full" />
			</div>
		);
	}

	if (!status?.length) {
		return (
			<div className="space-y-6">
				{header}
				<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
					<FileText className="h-8 w-8 text-muted-foreground/40" />
					<p className="text-muted-foreground text-sm">
						{t("feeClearance.student.noAssignment")}
					</p>
				</div>
			</div>
		);
	}

	const totalDue = status.reduce((s, a) => s + a.effectiveAmount, 0);
	const totalPaid = status.reduce((s, a) => s + a.paidAmount, 0);
	const currency = status[0]?.currency ?? "XAF";
	const cleared = status.every(
		(a) => a.status === "paid" || a.status === "exempt",
	);

	return (
		<div className="space-y-6">
			{header}
			<StudentFeeOverview
				cleared={cleared}
				totalDue={totalDue}
				totalPaid={totalPaid}
				currency={currency}
			/>
			{status.map((a) => (
				<StudentAssignmentCard key={a.id} assignment={a} currency={currency} />
			))}
		</div>
	);
}

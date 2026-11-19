import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageLink } from "@/components/navigation/page-link";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { formatDate } from "@/lib/date-format";
import { formatMoney } from "@/lib/money";
import { RecordPaymentDialog } from "@/modules/fees/components/record-payment-dialog";
import { AssignmentStatusBadge } from "@/modules/fees/components/status-badges";
import { trpcClient } from "@/utils/trpc";
import { useProfileContext } from "../../hooks/use-profile-context";

/**
 * The student's fees per academic year, and where the cashier takes a
 * payment: the dialog assigns the class's fee structure when needed.
 */
export default function ProfileFinancesTab() {
	const { profileId, profile } = useProfileContext();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const queryKey = ["profiles", profileId, "finances"];

	const { data, isLoading } = useQuery({
		queryKey,
		queryFn: () => trpcClient.profiles.finances.query({ profileId }),
	});

	const student = profile.student;
	const canPay = profile.canRecordPayments && !!student;
	const recordPayment = () => {
		if (!student) return;
		RecordPaymentDialog.call({
			target: {
				kind: "student",
				studentId: student.id,
				studentName: `${profile.firstName} ${profile.lastName}`,
			},
			onRecorded: () => queryClient.invalidateQueries({ queryKey }),
		});
	};

	if (isLoading) return <TableSkeleton columns={6} rows={3} />;

	const assignments = data ?? [];

	return (
		<div className="space-y-4 pt-6">
			{canPay && (
				<div className="flex justify-end">
					<Button onClick={recordPayment}>
						<Plus className="mr-2 h-4 w-4" />
						{t("feeClearance.payments.record")}
					</Button>
				</div>
			)}
			{assignments.length === 0 ? (
				<div className="py-12 text-center text-muted-foreground">
					{canPay
						? t("profileHub.finances.empty")
						: t("profileHub.finances.emptyReadOnly")}
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("profileHub.finances.academicYear")}</TableHead>
							<TableHead>{t("profileHub.finances.structure")}</TableHead>
							<TableHead className="text-right">
								{t("profileHub.finances.amount")}
							</TableHead>
							<TableHead className="text-right">
								{t("profileHub.finances.paid")}
							</TableHead>
							<TableHead className="text-right">
								{t("profileHub.finances.balance")}
							</TableHead>
							<TableHead>{t("profileHub.finances.status")}</TableHead>
							<TableHead>{t("profileHub.finances.clearedAt")}</TableHead>
							{canPay && <TableHead />}
						</TableRow>
					</TableHeader>
					<TableBody>
						{assignments.map((assignment) => {
							const due = Number(assignment.effectiveAmount);
							const paid = Number(assignment.paidAmount);
							const balance =
								assignment.status === "exempt" ? 0 : Math.max(due - paid, 0);
							return (
								<TableRow key={assignment.id}>
									<TableCell className="font-medium">
										{assignment.academicYearName}
									</TableCell>
									<TableCell>{assignment.feeStructureName ?? "—"}</TableCell>
									<TableCell className="text-right tabular-nums">
										{formatMoney(due, assignment.currency)}
										{Number(assignment.discountAmount) > 0 && (
											<span className="block text-muted-foreground text-xs">
												{t("profileHub.finances.discount")}{" "}
												{formatMoney(
													assignment.discountAmount,
													assignment.currency,
												)}
											</span>
										)}
									</TableCell>
									<TableCell className="text-right text-green-600 tabular-nums dark:text-green-400">
										{formatMoney(paid, assignment.currency)}
									</TableCell>
									<TableCell className="text-right font-medium tabular-nums">
										{formatMoney(balance, assignment.currency)}
									</TableCell>
									<TableCell>
										<AssignmentStatusBadge status={assignment.status} />
									</TableCell>
									<TableCell>
										{assignment.clearedAt
											? formatDate(assignment.clearedAt, "P")
											: "—"}
									</TableCell>
									{canPay && (
										<TableCell className="text-right">
											<PageLink
												to={`/fee-clearance/assignments/${assignment.id}`}
												className="inline-flex items-center gap-1 whitespace-nowrap text-primary text-sm hover:underline"
											>
												{t("profileHub.finances.openFile")}
											</PageLink>
										</TableCell>
									)}
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}
		</div>
	);
}

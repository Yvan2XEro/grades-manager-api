import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, Clock, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpc } from "@/utils/trpc";

export default function StudentFeeStatus() {
	const { t } = useTranslation();

	const { data: status, isLoading } = useQuery(
		trpc.feeClearance.myFinancialHistory.queryOptions(),
	);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-48 w-full" />
			</div>
		);
	}

	if (!status?.length) {
		return (
			<div className="rounded-lg border p-6 text-center text-muted-foreground">
				{t("feeClearance.student.noAssignment")}
			</div>
		);
	}

	const allAssignments = status ?? [];
	const totalDue = allAssignments.reduce((s, a) => s + a.effectiveAmount, 0);
	const totalPaid = allAssignments.reduce((s, a) => s + a.paidAmount, 0);
	const currency = allAssignments[0]?.currency ?? "XAF";
	const fmt = (v: number) => `${v.toLocaleString()} ${currency}`;

	const overallCleared =
		allAssignments.length > 0 &&
		allAssignments.every((a) => a.status === "paid" || a.status === "exempt");

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-semibold text-xl">
					{t("feeClearance.student.title")}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t("feeClearance.student.subtitle")}
				</p>
			</div>

			{/* Overall status card */}
			<div
				className={`flex items-center gap-4 rounded-lg border p-4 ${
					overallCleared
						? "border-green-200 bg-green-50"
						: "border-amber-200 bg-amber-50"
				}`}
			>
				{overallCleared ? (
					<CheckCircle2 className="h-8 w-8 shrink-0 text-green-600" />
				) : (
					<AlertCircle className="h-8 w-8 shrink-0 text-amber-600" />
				)}
				<div className="flex-1">
					<p className="font-semibold text-lg">
						{overallCleared
							? t("feeClearance.quitus.cleared")
							: t("feeClearance.quitus.notCleared")}
					</p>
					<p className="text-sm">
						{t("feeClearance.student.balance")}:{" "}
						<strong>{fmt(totalDue - totalPaid)}</strong>
					</p>
				</div>
				<div className="text-right">
					<p className="text-muted-foreground text-sm">
						{t("feeClearance.student.totalDue")}
					</p>
					<p className="font-bold text-lg">{fmt(totalDue)}</p>
					<p className="text-green-600 text-sm">
						{t("feeClearance.student.paid")}: {fmt(totalPaid)}
					</p>
				</div>
			</div>

			{/* Per-assignment breakdown */}
			{allAssignments.map((a) => {
				const paid = a.paidAmount;
				const due = a.effectiveAmount;
				const balance = due - paid;
				const pendingOrders =
					a.orders?.filter((o: { status: string }) => o.status === "pending") ??
					[];

				return (
					<div key={a.id} className="rounded-lg border">
						<div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
							<div>
								<p className="font-semibold">
									{t("feeClearance.student.academicYear")}:{" "}
									{a.academicYear?.name ?? "—"}
								</p>
								<p className="text-muted-foreground text-sm">
									{a.feeStructure?.name}
								</p>
							</div>
							<Badge
								variant={
									a.status === "paid"
										? "default"
										: a.status === "exempt"
											? "secondary"
											: a.status === "partial"
												? "outline"
												: "destructive"
								}
							>
								{t(`feeClearance.assignments.status.${a.status}`)}
							</Badge>
						</div>

						<div className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
							<div>
								<p className="text-muted-foreground">
									{t("feeClearance.assignments.fields.effectiveAmount")}
								</p>
								<p className="font-bold">{fmt(due)}</p>
							</div>
							<div>
								<p className="text-muted-foreground">
									{t("feeClearance.assignments.fields.paidAmount")}
								</p>
								<p className="font-bold text-green-600">{fmt(paid)}</p>
							</div>
							<div>
								<p className="text-muted-foreground">
									{t("feeClearance.assignments.fields.balance")}
								</p>
								<p
									className={`font-bold ${balance > 0 ? "text-destructive" : "text-green-600"}`}
								>
									{fmt(balance)}
								</p>
							</div>
						</div>

						{/* Pending payment orders */}
						{pendingOrders.length > 0 && (
							<div className="border-t px-4 py-3">
								<p className="mb-2 flex items-center gap-1 font-medium text-amber-700 text-sm">
									<Clock className="h-4 w-4" />
									{t("feeClearance.student.pendingOrders")} (
									{pendingOrders.length})
								</p>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>
												{t("feeClearance.orders.fields.reference")}
											</TableHead>
											<TableHead>
												{t("feeClearance.orders.fields.amount")}
											</TableHead>
											<TableHead>
												{t("feeClearance.orders.fields.expiresAt")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pendingOrders.map(
											(o: {
												id: string;
												reference: string | null;
												amount: string;
												expiresAt: string | null;
											}) => (
												<TableRow key={o.id}>
													<TableCell className="font-mono text-xs">
														{o.reference ?? "—"}
													</TableCell>
													<TableCell className="font-medium">
														{Number(o.amount).toLocaleString()} {currency}
													</TableCell>
													<TableCell>
														{o.expiresAt
															? format(new Date(o.expiresAt), "dd/MM/yyyy")
															: "—"}
													</TableCell>
												</TableRow>
											),
										)}
									</TableBody>
								</Table>
							</div>
						)}

						{/* Confirmed payments */}
						{a.payments.length > 0 && (
							<div className="border-t px-4 py-3">
								<p className="mb-2 flex items-center gap-1 font-medium text-green-700 text-sm">
									<CreditCard className="h-4 w-4" />
									{t("feeClearance.payments.title")} ({a.payments.length})
								</p>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>
												{t("feeClearance.payments.fields.reference")}
											</TableHead>
											<TableHead>
												{t("feeClearance.payments.fields.amount")}
											</TableHead>
											<TableHead>
												{t("feeClearance.payments.fields.paymentDate")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{a.payments.map((p) => (
											<TableRow key={p.id}>
												<TableCell className="font-mono text-xs">
													{p.reference ?? "—"}
												</TableCell>
												<TableCell className="font-medium text-green-600">
													{Number(p.amount).toLocaleString()} {currency}
												</TableCell>
												<TableCell>
													{format(new Date(p.paymentDate), "dd/MM/yyyy")}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}

						{a.clearedAt && (
							<div className="flex items-center gap-1 border-t px-4 py-2 text-green-600 text-xs">
								<CheckCircle2 className="h-3 w-3" />
								{t("feeClearance.quitus.clearedOn", {
									date: format(new Date(a.clearedAt), "dd/MM/yyyy"),
								})}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

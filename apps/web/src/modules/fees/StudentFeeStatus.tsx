import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	CreditCard,
	Download,
	FileText,
	Loader2,
	Plus,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpc, trpcClient } from "@/utils/trpc";

// ── Helpers ───────────────────────────────────────────────────────────────────

function downloadBase64Pdf(base64: string, filename: string) {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	const blob = new Blob([bytes], { type: "application/pdf" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

// ── Order download button ─────────────────────────────────────────────────────

function DownloadOrderButton({
	orderId,
	reference,
}: {
	orderId: string;
	reference: string | null;
}) {
	const { t } = useTranslation();

	const downloadQuery = useQuery({
		...trpc.feeClearance.myDownloadOrder.queryOptions({ orderId }),
		enabled: false,
	});

	async function handleDownload() {
		const result = await trpcClient.feeClearance.myDownloadOrder.query({
			orderId,
		});
		downloadBase64Pdf(result.pdf, `order-${reference ?? orderId}.pdf`);
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleDownload}
			disabled={downloadQuery.isFetching}
		>
			{downloadQuery.isFetching ? (
				<Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
			) : (
				<Download className="mr-1 h-3.5 w-3.5" />
			)}
			{t("feeClearance.orders.download")}
		</Button>
	);
}

// ── Receipt download button ───────────────────────────────────────────────────

function DownloadReceiptButton({
	paymentId,
	reference,
}: {
	paymentId: string;
	reference: string | null;
}) {
	const { t } = useTranslation();

	async function handleDownload() {
		const result = await trpcClient.feeClearance.myDownloadReceipt.query({
			paymentId,
		});
		downloadBase64Pdf(result.pdf, `receipt-${reference ?? paymentId}.pdf`);
	}

	return (
		<Button variant="ghost" size="sm" onClick={handleDownload}>
			<Download className="mr-1 h-3.5 w-3.5" />
			{t("feeClearance.payments.downloadReceipt")}
		</Button>
	);
}

// ── Generate order button ─────────────────────────────────────────────────────

type PayableInstallment = {
	id: string;
	label: string;
	amount: number;
	dueDate: string | null;
	status: "paid" | "pending" | "payable";
};

function GenerateOrderButton({
	assignmentId,
	balance,
	currency,
	installments,
}: {
	assignmentId: string;
	balance: number;
	currency: string;
	installments: PayableInstallment[];
}) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const selectable = installments.filter((item) => item.status === "payable");
	const selectedAmount = selectable
		.filter((item) => selectedIds.includes(item.id))
		.reduce((sum, item) => sum + item.amount, 0);

	const mutation = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.myCreateOrder.mutate({
				feeAssignmentId: assignmentId,
				amount: installments.length === 0 ? balance : undefined,
				installmentIds: selectedIds,
			}),
		onSuccess: () => {
			setSelectedIds([]);
			queryClient.invalidateQueries({
				queryKey: trpc.feeClearance.myFinancialHistory.queryKey(),
			});
		},
	});

	return (
		<div className="space-y-3">
			{installments.length > 0 && (
				<div className="grid gap-2">
					{installments.map((installment) => (
						<label
							key={installment.id}
							className="flex items-center gap-3 rounded-md border p-3 text-sm"
						>
							<Checkbox
								checked={selectedIds.includes(installment.id)}
								disabled={installment.status !== "payable"}
								onCheckedChange={(checked) =>
									setSelectedIds((current) =>
										checked
											? [...current, installment.id]
											: current.filter((id) => id !== installment.id),
									)
								}
							/>
							<span className="flex-1">{installment.label}</span>
							<span className="font-medium">
								{installment.amount.toLocaleString()} {currency}
							</span>
							<Badge variant="outline">
								{t(
									`feeClearance.student.installmentStatus.${installment.status}`,
								)}
							</Badge>
						</label>
					))}
				</div>
			)}
			<Button
				size="sm"
				variant="outline"
				onClick={() => mutation.mutate()}
				disabled={
					mutation.isPending ||
					balance <= 0 ||
					(installments.length > 0 && selectedIds.length === 0)
				}
			>
				{mutation.isPending ? (
					<Loader2 className="mr-1 h-4 w-4 animate-spin" />
				) : (
					<Plus className="mr-1 h-4 w-4" />
				)}
				{t("feeClearance.orders.generate")} (
				{(installments.length > 0 ? selectedAmount : balance).toLocaleString()}{" "}
				{currency})
			</Button>
		</div>
	);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudentFeeStatus() {
	const { t } = useTranslation();

	const { data: status, isLoading } = useQuery(
		trpc.feeClearance.myFinancialHistory.queryOptions(),
	);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<PageHeader
					title={t("feeClearance.student.title")}
					description={t("feeClearance.student.subtitle")}
				/>
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-48 w-full" />
			</div>
		);
	}

	if (!status?.length) {
		return (
			<div className="space-y-6">
				<PageHeader
					title={t("feeClearance.student.title")}
					description={t("feeClearance.student.subtitle")}
				/>
				<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
					<FileText className="h-8 w-8 text-muted-foreground/40" />
					<p className="text-muted-foreground text-sm">
						{t("feeClearance.student.noAssignment")}
					</p>
				</div>
			</div>
		);
	}

	const allAssignments = status;
	const totalDue = allAssignments.reduce((s, a) => s + a.effectiveAmount, 0);
	const totalPaid = allAssignments.reduce((s, a) => s + a.paidAmount, 0);
	const currency = allAssignments[0]?.currency ?? "XAF";
	const fmt = (v: number) => `${v.toLocaleString()} ${currency}`;

	const overallCleared =
		allAssignments.length > 0 &&
		allAssignments.every((a) => a.status === "paid" || a.status === "exempt");

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("feeClearance.student.title")}
				description={t("feeClearance.student.subtitle")}
			/>

			{/* Overall status card */}
			<div
				className={`flex items-center gap-4 rounded-xl border p-4 shadow-sm ${
					overallCleared
						? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
						: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
				}`}
			>
				{overallCleared ? (
					<CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
				) : (
					<AlertCircle className="h-8 w-8 shrink-0 text-amber-600" />
				)}
				<div className="flex-1">
					<p className="font-semibold text-lg">
						{overallCleared
							? t("feeClearance.quitus.cleared")
							: t("feeClearance.quitus.notCleared")}
					</p>
					<p className="text-muted-foreground text-sm">
						{t("feeClearance.student.balance")}:{" "}
						<strong
							className={overallCleared ? "text-emerald-600" : "text-amber-700"}
						>
							{fmt(totalDue - totalPaid)}
						</strong>
					</p>
				</div>
				<div className="shrink-0 text-right">
					<p className="text-muted-foreground text-sm">
						{t("feeClearance.student.totalDue")}
					</p>
					<p className="font-bold text-lg">{fmt(totalDue)}</p>
					<p className="text-emerald-600 text-sm">
						{t("feeClearance.student.paid")}: {fmt(totalPaid)}
					</p>
				</div>
			</div>

			{/* Per-assignment breakdown */}
			{allAssignments.map((a) => {
				const balance = a.balance;
				const pendingOrders =
					(
						a.orders as Array<{
							id: string;
							status: string;
							reference: string | null;
							amount: string;
							expiresAt: string | null;
						}>
					)?.filter((o) => o.status === "pending") ?? [];
				const confirmedOrders =
					(
						a.orders as Array<{
							id: string;
							status: string;
							reference: string | null;
							amount: string;
							expiresAt: string | null;
						}>
					)?.filter((o) => o.status === "confirmed") ?? [];
				const canGenerateOrder =
					balance > 0 && a.status !== "exempt" && a.status !== "paid";
				const installments =
					(a.feeStructure?.installments as PayableInstallment[] | undefined) ??
					[];

				return (
					<div
						key={a.id}
						className="overflow-hidden rounded-xl border shadow-sm"
					>
						{/* Header */}
						<div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
							<div>
								<p className="font-semibold">
									{t("feeClearance.student.academicYear")}:{" "}
									{a.academicYear?.name ?? "—"}
								</p>
								{a.feeStructure && (
									<p className="text-muted-foreground text-sm">
										{a.feeStructure.name}
									</p>
								)}
							</div>
							<div className="flex items-center gap-2">
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
						</div>
						{canGenerateOrder && (
							<div className="border-b px-4 py-3">
								<GenerateOrderButton
									assignmentId={a.id}
									balance={balance}
									currency={a.currency}
									installments={installments}
								/>
							</div>
						)}

						{/* Amounts */}
						<div className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
							<div>
								<p className="text-muted-foreground">
									{t("feeClearance.assignments.fields.effectiveAmount")}
								</p>
								<p className="font-bold">{fmt(a.effectiveAmount)}</p>
							</div>
							<div>
								<p className="text-muted-foreground">
									{t("feeClearance.assignments.fields.paidAmount")}
								</p>
								<p className="font-bold text-emerald-600">
									{fmt(a.paidAmount)}
								</p>
							</div>
							<div>
								<p className="text-muted-foreground">
									{t("feeClearance.assignments.fields.balance")}
								</p>
								<p
									className={`font-bold ${balance > 0 ? "text-destructive" : "text-emerald-600"}`}
								>
									{fmt(balance)}
								</p>
							</div>
						</div>

						{/* Pending orders */}
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
											<TableHead />
										</TableRow>
									</TableHeader>
									<TableBody>
										{pendingOrders.map((o) => (
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
												<TableCell>
													<DownloadOrderButton
														orderId={o.id}
														reference={o.reference}
													/>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}

						{/* Confirmed payments */}
						{a.payments.length > 0 && (
							<div className="border-t px-4 py-3">
								<p className="mb-2 flex items-center gap-1 font-medium text-emerald-700 text-sm">
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
											<TableHead />
										</TableRow>
									</TableHeader>
									<TableBody>
										{a.payments.map(
											(p: {
												id: string;
												reference: string | null;
												amount: string | number;
												paymentDate: string;
											}) => (
												<TableRow key={p.id}>
													<TableCell className="font-mono text-xs">
														{p.reference ?? "—"}
													</TableCell>
													<TableCell className="font-medium text-emerald-600">
														{Number(p.amount).toLocaleString()} {currency}
													</TableCell>
													<TableCell>
														{format(new Date(p.paymentDate), "dd/MM/yyyy")}
													</TableCell>
													<TableCell>
														<DownloadReceiptButton
															paymentId={p.id}
															reference={p.reference}
														/>
													</TableCell>
												</TableRow>
											),
										)}
									</TableBody>
								</Table>
							</div>
						)}

						{a.clearedAt && (
							<div className="flex items-center gap-1 border-t px-4 py-2 text-emerald-600 text-xs">
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

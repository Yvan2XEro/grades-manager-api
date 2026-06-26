import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	ArrowLeft,
	CheckCircle,
	ClipboardList,
	Download,
	FileText,
	Plus,
	Trash2,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	unpaid: "destructive",
	partial: "outline",
	paid: "default",
	exempt: "secondary",
};

export default function FeeAssignmentDetail() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [showPayment, setShowPayment] = useState(false);
	const [showOrder, setShowOrder] = useState(false);
	const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
	const [confirmPaymentDate, setConfirmPaymentDate] = useState(() =>
		new Date().toISOString().slice(0, 10),
	);
	const [confirmPaymentMethod, setConfirmPaymentMethod] = useState("cash");
	const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
	const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(
		null,
	);
	const [downloadingReceiptId, setDownloadingReceiptId] = useState<
		string | null
	>(null);

	const { data: assignment, isLoading } = useQuery(
		trpc.feeClearance.getAssignment.queryOptions({ id: id! }),
	);
	const { data: payments } = useQuery(
		trpc.feeClearance.listPayments.queryOptions({ feeAssignmentId: id! }),
	);
	const { data: ordersData } = useQuery(
		trpc.feeClearance.listOrders.queryOptions({ feeAssignmentId: id! }),
	);
	const orders = ordersData?.items ?? [];

	const invalidate = () => {
		queryClient.invalidateQueries({
			queryKey: trpc.feeClearance.getAssignment.queryKey({ id: id! }),
		});
		queryClient.invalidateQueries({
			queryKey: trpc.feeClearance.listPayments.queryKey({
				feeAssignmentId: id!,
			}),
		});
		queryClient.invalidateQueries({
			queryKey: trpc.feeClearance.listOrders.queryKey({ feeAssignmentId: id! }),
		});
	};

	const cancelOrderMut = useMutation({
		mutationFn: (orderId: string) =>
			trpcClient.feeClearance.cancelOrder.mutate({ orderId }),
		onSuccess: () => {
			toast.success(t("common.saved"));
			invalidate();
		},
	});

	const confirmOrderMut = useMutation({
		mutationFn: ({
			orderId,
			paymentDate,
			paymentMethod,
		}: {
			orderId: string;
			paymentDate: string;
			paymentMethod: string;
		}) =>
			trpcClient.feeClearance.confirmOrder.mutate({
				orderId,
				paymentDate,
				paymentMethod: paymentMethod as
					| "cash"
					| "bank_transfer"
					| "mobile_money"
					| "check"
					| "other",
			}),
		onSuccess: () => {
			toast.success(t("feeClearance.orders.confirmed"));
			invalidate();
			setConfirmOrderId(null);
		},
	});

	const exemptMut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.exemptStudent.mutate({ assignmentId: id! }),
		onSuccess: () => {
			toast.success(t("common.saved"));
			invalidate();
		},
	});

	const deletePaymentMut = useMutation({
		mutationFn: (paymentId: string) =>
			trpcClient.feeClearance.deletePayment.mutate({ paymentId }),
		onSuccess: () => {
			toast.success(t("common.deleted"));
			invalidate();
			setDeletePaymentId(null);
		},
	});

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-32 w-full" />
			</div>
		);
	}
	if (!assignment) return null;

	const paidAmount =
		payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
	const effectiveAmount = Number(assignment.effectiveAmount);
	const balance = effectiveAmount - paidAmount;
	const profileName = assignment.student?.profile
		? `${assignment.student.profile.firstName} ${assignment.student.profile.lastName}`
		: "—";
	const formatAmount = (v: number) =>
		`${v.toLocaleString()} ${assignment.currency}`;

	function triggerPdfDownload(base64: string, filename: string) {
		const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
		const blob = new Blob([bytes], { type: "application/pdf" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function handleDownloadOrder(orderId: string, ref: string | null) {
		setDownloadingOrderId(orderId);
		try {
			const { pdf } = await trpcClient.feeClearance.downloadOrder.query({
				orderId,
			});
			triggerPdfDownload(pdf, `bon-caisse-${ref ?? orderId}.pdf`);
		} catch {
			toast.error(t("common.error"));
		} finally {
			setDownloadingOrderId(null);
		}
	}

	async function handleDownloadReceipt(paymentId: string, ref: string | null) {
		setDownloadingReceiptId(paymentId);
		try {
			const { pdf } = await trpcClient.feeClearance.downloadReceipt.query({
				paymentId,
			});
			triggerPdfDownload(pdf, `recu-${ref ?? paymentId}.pdf`);
		} catch {
			toast.error(t("common.error"));
		} finally {
			setDownloadingReceiptId(null);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h2 className="font-semibold text-xl">{profileName}</h2>
					<p className="text-muted-foreground text-sm">
						{assignment.feeStructure?.name} — {assignment.academicYear?.name}
					</p>
				</div>
				<div className="ml-auto flex gap-2">
					{assignment.student?.id && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								navigate(
									`/admin/fee-clearance/students/${assignment.student!.id}/history`,
								)
							}
						>
							{t("feeClearance.history.viewHistory")}
						</Button>
					)}
					{assignment.status !== "exempt" && assignment.status !== "paid" && (
						<Button variant="outline" onClick={() => exemptMut.mutate()}>
							{t("feeClearance.assignments.exempt")}
						</Button>
					)}
					{assignment.status !== "paid" && assignment.status !== "exempt" && (
						<Button variant="outline" onClick={() => setShowOrder(true)}>
							<ClipboardList className="mr-2 h-4 w-4" />
							{t("feeClearance.orders.create")}
						</Button>
					)}
					{assignment.status !== "paid" && assignment.status !== "exempt" && (
						<Button onClick={() => setShowPayment(true)}>
							<Plus className="mr-2 h-4 w-4" />
							{t("feeClearance.payments.record")}
						</Button>
					)}
				</div>
			</div>

			{/* Status summary */}
			<div className="grid grid-cols-4 gap-4 rounded-lg border p-4">
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.assignments.fields.status")}
					</p>
					<Badge variant={statusVariants[assignment.status]}>
						{t(`feeClearance.assignments.status.${assignment.status}`)}
					</Badge>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.assignments.fields.effectiveAmount")}
					</p>
					<p className="font-bold">{formatAmount(effectiveAmount)}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.assignments.fields.paidAmount")}
					</p>
					<p className="font-bold text-green-600">{formatAmount(paidAmount)}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.assignments.fields.balance")}
					</p>
					<p
						className={`font-bold ${balance > 0 ? "text-destructive" : "text-green-600"}`}
					>
						{formatAmount(balance)}
					</p>
				</div>
			</div>

			{assignment.status === "paid" && assignment.clearedAt && (
				<div className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-800 text-sm">
					{t("feeClearance.quitus.clearedOn", {
						date: format(new Date(assignment.clearedAt), "dd/MM/yyyy HH:mm"),
					})}
				</div>
			)}

			{/* Discount */}
			{Number(assignment.discountAmount) > 0 && (
				<div className="rounded-lg border p-3 text-sm">
					<span className="font-medium">
						{t("feeClearance.assignments.fields.discount")}:
					</span>{" "}
					{formatAmount(Number(assignment.discountAmount))}
					{assignment.discountReason && ` — ${assignment.discountReason}`}
				</div>
			)}

			{/* Payment orders */}
			{orders.length > 0 && (
				<div className="space-y-3">
					<h3 className="font-semibold">{t("feeClearance.orders.title")}</h3>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{t("feeClearance.orders.fields.createdAt")}
								</TableHead>
								<TableHead>
									{t("feeClearance.orders.fields.reference")}
								</TableHead>
								<TableHead>{t("feeClearance.orders.fields.amount")}</TableHead>
								<TableHead>{t("feeClearance.orders.fields.status")}</TableHead>
								<TableHead>{t("feeClearance.orders.fields.notes")}</TableHead>
								<TableHead />
							</TableRow>
						</TableHeader>
						<TableBody>
							{orders.map((o) => (
								<TableRow key={o.id}>
									<TableCell>
										{format(new Date(o.createdAt), "dd/MM/yyyy HH:mm")}
									</TableCell>
									<TableCell className="font-mono text-xs">
										{o.reference ?? "—"}
									</TableCell>
									<TableCell className="font-medium">
										{formatAmount(Number(o.amount))}
									</TableCell>
									<TableCell>
										<Badge
											variant={
												o.status === "confirmed"
													? "default"
													: o.status === "cancelled"
														? "destructive"
														: "outline"
											}
										>
											{t(`feeClearance.orders.status.${o.status}`)}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground text-sm">
										{o.notes ?? "—"}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-1">
											<Button
												variant="ghost"
												size="sm"
												disabled={downloadingOrderId === o.id}
												onClick={() =>
													handleDownloadOrder(o.id, o.reference ?? null)
												}
												title={t("feeClearance.orders.download")}
											>
												{downloadingOrderId === o.id ? (
													<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
												) : (
													<Download className="h-4 w-4" />
												)}
											</Button>
											{o.status === "pending" && (
												<>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setConfirmOrderId(o.id)}
													>
														<CheckCircle className="h-4 w-4 text-green-600" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => cancelOrderMut.mutate(o.id)}
													>
														<XCircle className="h-4 w-4 text-destructive" />
													</Button>
												</>
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Payment history */}
			<div className="space-y-3">
				<h3 className="font-semibold">{t("feeClearance.payments.title")}</h3>
				{!payments?.length ? (
					<p className="text-muted-foreground text-sm">
						{t("feeClearance.payments.empty")}
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{t("feeClearance.payments.fields.paymentDate")}
								</TableHead>
								<TableHead>
									{t("feeClearance.payments.fields.amount")}
								</TableHead>
								<TableHead>
									{t("feeClearance.payments.fields.paymentMethod")}
								</TableHead>
								<TableHead>
									{t("feeClearance.payments.fields.reference")}
								</TableHead>
								<TableHead />
							</TableRow>
						</TableHeader>
						<TableBody>
							{payments.map((p) => (
								<TableRow key={p.id}>
									<TableCell>
										{format(new Date(p.paymentDate), "dd/MM/yyyy")}
									</TableCell>
									<TableCell className="font-medium">
										{formatAmount(Number(p.amount))}
									</TableCell>
									<TableCell>
										{t(`feeClearance.payments.methods.${p.paymentMethod}`)}
									</TableCell>
									<TableCell>{p.reference ?? "—"}</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-1">
											<Button
												variant="ghost"
												size="sm"
												disabled={downloadingReceiptId === p.id}
												onClick={() =>
													handleDownloadReceipt(p.id, p.reference ?? null)
												}
												title={t("feeClearance.payments.downloadReceipt")}
											>
												{downloadingReceiptId === p.id ? (
													<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
												) : (
													<FileText className="h-4 w-4" />
												)}
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setDeletePaymentId(p.id)}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			<RecordPaymentDialog
				open={showPayment}
				onOpenChange={setShowPayment}
				feeAssignmentId={id!}
				installments={assignment.feeStructure?.installments ?? []}
				onRecorded={() => {
					invalidate();
					setShowPayment(false);
				}}
			/>

			<CreateOrderDialog
				open={showOrder}
				onOpenChange={setShowOrder}
				feeAssignmentId={id!}
				balance={balance}
				currency={assignment.currency}
				installments={assignment.feeStructure?.installments ?? []}
				onCreated={() => {
					invalidate();
					setShowOrder(false);
				}}
			/>

			<AlertDialog
				open={!!confirmOrderId}
				onOpenChange={(o) => !o && setConfirmOrderId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("feeClearance.orders.confirmTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("feeClearance.orders.confirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="grid gap-3 px-1 py-2">
						<div className="grid gap-1">
							<label
								className="font-medium text-sm"
								htmlFor="confirm-payment-date"
							>
								{t("feeClearance.orders.fields.paymentDate", {
									defaultValue: "Payment date",
								})}
							</label>
							<input
								id="confirm-payment-date"
								type="date"
								className="rounded-md border px-3 py-1.5 text-sm"
								value={confirmPaymentDate}
								onChange={(e) => setConfirmPaymentDate(e.target.value)}
							/>
						</div>
						<div className="grid gap-1">
							<label
								className="font-medium text-sm"
								htmlFor="confirm-payment-method"
							>
								{t("feeClearance.orders.fields.paymentMethod", {
									defaultValue: "Payment method",
								})}
							</label>
							<select
								id="confirm-payment-method"
								className="rounded-md border px-3 py-1.5 text-sm"
								value={confirmPaymentMethod}
								onChange={(e) => setConfirmPaymentMethod(e.target.value)}
							>
								<option value="cash">Cash</option>
								<option value="bank_transfer">Bank transfer</option>
								<option value="mobile_money">Mobile money</option>
								<option value="check">Check</option>
								<option value="other">Other</option>
							</select>
						</div>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								confirmOrderId &&
								confirmOrderMut.mutate({
									orderId: confirmOrderId,
									paymentDate: confirmPaymentDate,
									paymentMethod: confirmPaymentMethod,
								})
							}
						>
							{t("feeClearance.orders.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={!!deletePaymentId}
				onOpenChange={(o) => !o && setDeletePaymentId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("feeClearance.payments.deleteConfirm")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								deletePaymentId && deletePaymentMut.mutate(deletePaymentId)
							}
						>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function RecordPaymentDialog({
	open,
	onOpenChange,
	feeAssignmentId,
	installments,
	onRecorded,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	feeAssignmentId: string;
	installments: Array<{ id: string; label: string }>;
	onRecorded: () => void;
}) {
	const { t } = useTranslation();
	const [form, setForm] = useState({
		amount: "",
		paymentDate: format(new Date(), "yyyy-MM-dd"),
		paymentMethod: "cash",
		reference: "",
		installmentId: "",
	});

	const methods = [
		"cash",
		"bank_transfer",
		"mobile_money",
		"check",
		"other",
	] as const;

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.recordPayment.mutate({
				feeAssignmentId,
				amount: Number(form.amount),
				currency: "XAF",
				paymentDate: form.paymentDate,
				paymentMethod: form.paymentMethod as never,
				reference: form.reference || undefined,
				installmentId: form.installmentId || undefined,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			onRecorded();
			setForm({
				amount: "",
				paymentDate: format(new Date(), "yyyy-MM-dd"),
				paymentMethod: "cash",
				reference: "",
				installmentId: "",
			});
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("feeClearance.payments.record")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label>{t("feeClearance.payments.fields.amount")}</Label>
						<Input
							type="number"
							min={1}
							value={form.amount}
							onChange={(e) =>
								setForm((f) => ({ ...f, amount: e.target.value }))
							}
						/>
					</div>
					<div>
						<Label>{t("feeClearance.payments.fields.paymentDate")}</Label>
						<Input
							type="date"
							value={form.paymentDate}
							onChange={(e) =>
								setForm((f) => ({ ...f, paymentDate: e.target.value }))
							}
						/>
					</div>
					<div>
						<Label>{t("feeClearance.payments.fields.paymentMethod")}</Label>
						<Select
							value={form.paymentMethod}
							onValueChange={(v) =>
								setForm((f) => ({ ...f, paymentMethod: v }))
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{methods.map((m) => (
									<SelectItem key={m} value={m}>
										{t(`feeClearance.payments.methods.${m}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label>{t("feeClearance.payments.fields.reference")}</Label>
						<Input
							value={form.reference}
							onChange={(e) =>
								setForm((f) => ({ ...f, reference: e.target.value }))
							}
						/>
					</div>
					{installments.length > 0 && (
						<div>
							<Label>{t("feeClearance.structures.installments.title")}</Label>
							<Select
								value={form.installmentId}
								onValueChange={(v) =>
									setForm((f) => ({ ...f, installmentId: v }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder={t("common.optional")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">{t("common.none")}</SelectItem>
									{installments.map((i) => (
										<SelectItem key={i.id} value={i.id}>
											{i.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button
						disabled={!form.amount || !form.paymentDate || mut.isPending}
						onClick={() => mut.mutate()}
					>
						{t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function CreateOrderDialog({
	open,
	onOpenChange,
	feeAssignmentId,
	balance,
	currency,
	installments,
	onCreated,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	feeAssignmentId: string;
	balance: number;
	currency: string;
	installments: Array<{ id: string; label: string }>;
	onCreated: () => void;
}) {
	const { t } = useTranslation();
	const [form, setForm] = useState({
		amount: "",
		notes: "",
		installmentIds: [] as string[],
	});

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.createOrder.mutate({
				feeAssignmentId,
				amount: Number(form.amount),
				notes: form.notes || undefined,
				installmentIds: form.installmentIds.length
					? form.installmentIds
					: undefined,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			onCreated();
			setForm({ amount: "", notes: "", installmentIds: [] });
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("feeClearance.orders.create")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label>{t("feeClearance.orders.fields.amount")}</Label>
						<Input
							type="number"
							min={1}
							placeholder={`${balance.toLocaleString()} ${currency}`}
							value={form.amount}
							onChange={(e) =>
								setForm((f) => ({ ...f, amount: e.target.value }))
							}
						/>
					</div>
					{installments.length > 0 && (
						<div>
							<Label>{t("feeClearance.structures.installments.title")}</Label>
							<div className="mt-1 space-y-1">
								{installments.map((i) => (
									<label key={i.id} className="flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											className="h-4 w-4 rounded border"
											checked={form.installmentIds.includes(i.id)}
											onChange={(e) =>
												setForm((f) => ({
													...f,
													installmentIds: e.target.checked
														? [...f.installmentIds, i.id]
														: f.installmentIds.filter((x) => x !== i.id),
												}))
											}
										/>
										{i.label}
									</label>
								))}
							</div>
						</div>
					)}
					<div>
						<Label>{t("feeClearance.orders.fields.notes")}</Label>
						<Input
							value={form.notes}
							placeholder={t("common.optional")}
							onChange={(e) =>
								setForm((f) => ({ ...f, notes: e.target.value }))
							}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button
						disabled={!form.amount || mut.isPending}
						onClick={() => mut.mutate()}
					>
						{t("feeClearance.orders.generate")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

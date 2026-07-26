import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function FeeStructureInstallmentsTab() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [showAdd, setShowAdd] = useState(false);
	const [editTarget, setEditTarget] = useState<{
		id: string;
		label: string;
		amount: string;
		dueDate: string;
	} | null>(null);

	const { data: structure } = useQuery(
		trpc.feeClearance.getStructure.queryOptions({ id: id! }),
	);

	const deleteInstallmentMut = useMutation({
		mutationFn: (installmentId: string) =>
			trpcClient.feeClearance.deleteInstallment.mutate({ id: installmentId }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.feeClearance.getStructure.queryKey({ id: id! }),
			});
		},
	});

	if (!structure) return null;

	const formatAmount = (v: string | null) =>
		v ? `${Number(v).toLocaleString()} ${structure.currency}` : "—";

	return (
		<div className="space-y-3 pt-6">
			<div className="flex items-center justify-between">
				<h3 className="font-semibold">
					{t("feeClearance.structures.installments.title")}
				</h3>
				<Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
					<Plus className="mr-1 h-4 w-4" />
					{t("feeClearance.structures.installments.add")}
				</Button>
			</div>

			{structure.installments?.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					{t("feeClearance.structures.installments.empty")}
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								{t("feeClearance.structures.installments.label")}
							</TableHead>
							<TableHead>
								{t("feeClearance.structures.installments.amount")}
							</TableHead>
							<TableHead>
								{t("feeClearance.structures.installments.dueDate")}
							</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{structure.installments?.map((inst) => (
							<TableRow key={inst.id}>
								<TableCell>{inst.label}</TableCell>
								<TableCell>{formatAmount(inst.amount)}</TableCell>
								<TableCell>
									{inst.dueDate
										? format(new Date(inst.dueDate), "dd/MM/yyyy")
										: "—"}
								</TableCell>
								<TableCell className="text-right">
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											setEditTarget({
												id: inst.id,
												label: inst.label,
												amount: inst.amount ?? "",
												dueDate: inst.dueDate ? inst.dueDate.slice(0, 10) : "",
											})
										}
									>
										<Pencil className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => deleteInstallmentMut.mutate(inst.id)}
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			<AddInstallmentDialog
				open={showAdd}
				onOpenChange={setShowAdd}
				feeStructureId={id!}
				nextIndex={structure.installments?.length ?? 0}
				onAdded={() => {
					queryClient.invalidateQueries({
						queryKey: trpc.feeClearance.getStructure.queryKey({ id: id! }),
					});
					setShowAdd(false);
				}}
			/>

			{editTarget && (
				<EditInstallmentDialog
					open={!!editTarget}
					onOpenChange={(o) => {
						if (!o) setEditTarget(null);
					}}
					installment={editTarget}
					currency={structure.currency}
					onSaved={() => {
						queryClient.invalidateQueries({
							queryKey: trpc.feeClearance.getStructure.queryKey({ id: id! }),
						});
						setEditTarget(null);
					}}
				/>
			)}
		</div>
	);
}

function EditInstallmentDialog({
	open,
	onOpenChange,
	installment,
	currency,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	installment: { id: string; label: string; amount: string; dueDate: string };
	currency: string;
	onSaved: () => void;
}) {
	const { t } = useTranslation();
	const [form, setForm] = useState({
		label: installment.label,
		amount: installment.amount,
		dueDate: installment.dueDate,
	});

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.updateInstallment.mutate({
				id: installment.id,
				label: form.label || undefined,
				amount: form.amount ? Number(form.amount) : undefined,
				dueDate: form.dueDate || undefined,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			onSaved();
		},
		onError: (e) => toast.error(e.message),
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("feeClearance.structures.installments.edit")}
					</DialogTitle>
				</DialogHeader>
				<DialogBody className="space-y-4">
					<div>
						<Label>{t("feeClearance.structures.installments.label")}</Label>
						<Input
							value={form.label}
							onChange={(e) =>
								setForm((f) => ({ ...f, label: e.target.value }))
							}
						/>
					</div>
					<div>
						<Label>
							{t("feeClearance.structures.installments.amount")} ({currency})
						</Label>
						<Input
							type="number"
							min={0}
							value={form.amount}
							onChange={(e) =>
								setForm((f) => ({ ...f, amount: e.target.value }))
							}
						/>
					</div>
					<div>
						<Label>{t("feeClearance.structures.installments.dueDate")}</Label>
						<Input
							type="date"
							value={form.dueDate}
							onChange={(e) =>
								setForm((f) => ({ ...f, dueDate: e.target.value }))
							}
						/>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button
						disabled={!form.label || mut.isPending}
						onClick={() => mut.mutate()}
					>
						{t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function AddInstallmentDialog({
	open,
	onOpenChange,
	feeStructureId,
	nextIndex,
	onAdded,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	feeStructureId: string;
	nextIndex: number;
	onAdded: () => void;
}) {
	const { t } = useTranslation();
	const [form, setForm] = useState({ label: "", amount: "", dueDate: "" });

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.addInstallment.mutate({
				feeStructureId,
				label: form.label,
				amount: Number(form.amount),
				dueDate: form.dueDate || undefined,
				orderIndex: nextIndex,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			onAdded();
			setForm({ label: "", amount: "", dueDate: "" });
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("feeClearance.structures.installments.add")}
					</DialogTitle>
				</DialogHeader>
				<DialogBody className="space-y-4">
					<div>
						<Label>{t("feeClearance.structures.installments.label")}</Label>
						<Input
							value={form.label}
							onChange={(e) =>
								setForm((f) => ({ ...f, label: e.target.value }))
							}
						/>
					</div>
					<div>
						<Label>{t("feeClearance.structures.installments.amount")}</Label>
						<Input
							type="number"
							min={0}
							value={form.amount}
							onChange={(e) =>
								setForm((f) => ({ ...f, amount: e.target.value }))
							}
						/>
					</div>
					<div>
						<Label>{t("feeClearance.structures.installments.dueDate")}</Label>
						<Input
							type="date"
							value={form.dueDate}
							onChange={(e) =>
								setForm((f) => ({ ...f, dueDate: e.target.value }))
							}
						/>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button
						disabled={!form.label || !form.amount || mut.isPending}
						onClick={() => mut.mutate()}
					>
						{t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

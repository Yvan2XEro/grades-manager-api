import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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

export default function FeeStructureDetail() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [showAddInstallment, setShowAddInstallment] = useState(false);

	const { data: structure, isLoading } = useQuery(
		trpc.feeClearance.getStructure.queryOptions({ id: id! }),
	);

	const updateMut = useMutation({
		mutationFn: (data: {
			name?: string;
			totalAmount?: number;
			isActive?: boolean;
		}) => trpcClient.feeClearance.updateStructure.mutate({ id: id!, ...data }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.feeClearance.getStructure.queryKey({ id: id! }),
			});
			toast.success(t("common.saved"));
		},
	});

	const deleteInstallmentMut = useMutation({
		mutationFn: (installmentId: string) =>
			trpcClient.feeClearance.deleteInstallment.mutate({ id: installmentId }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.feeClearance.getStructure.queryKey({ id: id! }),
			});
		},
	});

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-40 w-full" />
			</div>
		);
	}

	if (!structure) return null;

	const formatAmount = (v: string | null) =>
		v ? `${Number(v).toLocaleString()} ${structure.currency}` : "—";

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h2 className="font-semibold text-xl">{structure.name}</h2>
					<p className="text-muted-foreground text-sm">
						{structure.academicYear?.name}
					</p>
				</div>
				<div className="ml-auto flex items-center gap-3">
					<span className="text-sm">
						{t("feeClearance.structures.fields.isActive")}
					</span>
					<Switch
						checked={structure.isActive}
						onCheckedChange={(v) => updateMut.mutate({ isActive: v })}
					/>
				</div>
			</div>

			{/* Summary card */}
			<div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.structures.fields.totalAmount")}
					</p>
					<p className="font-bold text-2xl">
						{formatAmount(structure.totalAmount)}
					</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.structures.fields.program")}
					</p>
					<p className="font-medium">{structure.program?.shortName ?? "—"}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.structures.fields.isActive")}
					</p>
					<Badge variant={structure.isActive ? "default" : "secondary"}>
						{structure.isActive ? t("common.active") : t("common.inactive")}
					</Badge>
				</div>
			</div>

			{/* Installments */}
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold">
						{t("feeClearance.structures.installments.title")}
					</h3>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowAddInstallment(true)}
					>
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
			</div>

			<AddInstallmentDialog
				open={showAddInstallment}
				onOpenChange={setShowAddInstallment}
				feeStructureId={id!}
				nextIndex={structure.installments?.length ?? 0}
				onAdded={() => {
					queryClient.invalidateQueries({
						queryKey: trpc.feeClearance.getStructure.queryKey({ id: id! }),
					});
					setShowAddInstallment(false);
				}}
			/>
		</div>
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
				<div className="space-y-4">
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
				</div>
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

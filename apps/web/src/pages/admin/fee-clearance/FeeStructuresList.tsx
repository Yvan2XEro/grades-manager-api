import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
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
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

export default function FeeStructuresList() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [showCreate, setShowCreate] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
	const [yearFilter, setYearFilter] = useState<string>("");

	const { data: years } = useQuery(trpc.academicYears.list.queryOptions());
	const { data: structures, isLoading } = useQuery(
		trpc.feeClearance.listStructures.queryOptions({
			academicYearId: yearFilter || undefined,
		}),
	);

	const deleteMut = useMutation({
		mutationFn: (id: string) =>
			trpcClient.feeClearance.deleteStructure.mutate({ id }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.feeClearance.listStructures.queryKey(),
			});
			toast.success(t("common.deleted"));
			setDeleteTarget(null);
		},
	});

	const formatAmount = (amount: string | null, currency: string) => {
		if (!amount) return "—";
		return `${Number(amount).toLocaleString()} ${currency}`;
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-xl">
						{t("feeClearance.structures.title")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t("feeClearance.structures.subtitle")}
					</p>
				</div>
				<Button onClick={() => setShowCreate(true)}>
					<Plus className="mr-2 h-4 w-4" />
					{t("feeClearance.structures.create")}
				</Button>
			</div>

			<div className="flex gap-2">
				<Select value={yearFilter} onValueChange={setYearFilter}>
					<SelectTrigger className="w-56">
						<SelectValue
							placeholder={t("feeClearance.structures.fields.academicYear")}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">{t("common.all")}</SelectItem>
						{years?.map((y) => (
							<SelectItem key={y.id} value={y.id}>
								{y.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{isLoading ? (
				<TableSkeleton columns={5} rows={4} />
			) : !structures?.length ? (
				<Empty>
					<EmptyMedia />
					<EmptyHeader>
						<EmptyTitle>{t("feeClearance.structures.empty.title")}</EmptyTitle>
						<EmptyDescription>
							{t("feeClearance.structures.empty.description")}
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("feeClearance.structures.fields.name")}</TableHead>
							<TableHead>
								{t("feeClearance.structures.fields.academicYear")}
							</TableHead>
							<TableHead>
								{t("feeClearance.structures.fields.totalAmount")}
							</TableHead>
							<TableHead>
								{t("feeClearance.structures.fields.isActive")}
							</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{structures.map((s) => (
							<TableRow
								key={s.id}
								className="cursor-pointer"
								onClick={() =>
									navigate(`/admin/fee-clearance/structures/${s.id}`)
								}
							>
								<TableCell className="font-medium">{s.name}</TableCell>
								<TableCell>{s.academicYear?.name ?? "—"}</TableCell>
								<TableCell>{formatAmount(s.totalAmount, s.currency)}</TableCell>
								<TableCell>
									<Badge variant={s.isActive ? "default" : "secondary"}>
										{s.isActive ? t("common.active") : t("common.inactive")}
									</Badge>
								</TableCell>
								<TableCell
									className="text-right"
									onClick={(e) => e.stopPropagation()}
								>
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											navigate(`/admin/fee-clearance/structures/${s.id}`)
										}
									>
										<Edit2 className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setDeleteTarget(s.id)}
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			<CreateStructureDialog
				open={showCreate}
				onOpenChange={setShowCreate}
				years={years ?? []}
				onCreated={() => {
					queryClient.invalidateQueries({
						queryKey: trpc.feeClearance.listStructures.queryKey(),
					});
					setShowCreate(false);
				}}
			/>

			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("feeClearance.structures.deleteConfirm")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteTarget && deleteMut.mutate(deleteTarget)}
						>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function CreateStructureDialog({
	open,
	onOpenChange,
	years,
	onCreated,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	years: Array<{ id: string; name: string }>;
	onCreated: () => void;
}) {
	const { t } = useTranslation();
	const [form, setForm] = useState({
		name: "",
		academicYearId: "",
		totalAmount: "",
		currency: "XAF",
		description: "",
	});

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.createStructure.mutate({
				name: form.name,
				academicYearId: form.academicYearId,
				totalAmount: Number(form.totalAmount),
				currency: form.currency,
				description: form.description || undefined,
			}),
		onSuccess: () => {
			toast.success(t("common.created"));
			onCreated();
			setForm({
				name: "",
				academicYearId: "",
				totalAmount: "",
				currency: "XAF",
				description: "",
			});
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("feeClearance.structures.create")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label>{t("feeClearance.structures.fields.name")}</Label>
						<Input
							value={form.name}
							onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
						/>
					</div>
					<div>
						<Label>{t("feeClearance.structures.fields.academicYear")}</Label>
						<Select
							value={form.academicYearId}
							onValueChange={(v) =>
								setForm((f) => ({ ...f, academicYearId: v }))
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{years.map((y) => (
									<SelectItem key={y.id} value={y.id}>
										{y.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex gap-2">
						<div className="flex-1">
							<Label>{t("feeClearance.structures.fields.totalAmount")}</Label>
							<Input
								type="number"
								min={0}
								value={form.totalAmount}
								onChange={(e) =>
									setForm((f) => ({ ...f, totalAmount: e.target.value }))
								}
							/>
						</div>
						<div className="w-28">
							<Label>{t("feeClearance.structures.fields.currency")}</Label>
							<Input
								value={form.currency}
								onChange={(e) =>
									setForm((f) => ({ ...f, currency: e.target.value }))
								}
							/>
						</div>
					</div>
					<div>
						<Label>{t("feeClearance.structures.fields.description")}</Label>
						<Input
							value={form.description}
							onChange={(e) =>
								setForm((f) => ({ ...f, description: e.target.value }))
							}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button
						disabled={
							!form.name ||
							!form.academicYearId ||
							!form.totalAmount ||
							mut.isPending
						}
						onClick={() => mut.mutate()}
					>
						{t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

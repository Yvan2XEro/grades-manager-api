import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

type EditField = "name" | "description" | "totalAmount" | null;

export default function FeeStructureDetailsTab() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [editField, setEditField] = useState<EditField>(null);
	const [editValue, setEditValue] = useState("");

	const { data: structure } = useQuery(
		trpc.feeClearance.getStructure.queryOptions({ id: id! }),
	);

	const mut = useMutation({
		mutationFn: (patch: {
			name?: string;
			description?: string;
			totalAmount?: number;
		}) => trpcClient.feeClearance.updateStructure.mutate({ id: id!, ...patch }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.feeClearance.getStructure.queryKey({ id: id! }),
			});
			toast.success(t("common.saved"));
			setEditField(null);
		},
		onError: (e) => toast.error(e.message),
	});

	if (!structure) return null;

	const formatAmount = (v: string | null) =>
		v ? `${Number(v).toLocaleString()} ${structure.currency}` : "—";

	function startEdit(field: EditField) {
		setEditField(field);
		if (field === "name") setEditValue(structure!.name);
		else if (field === "description")
			setEditValue(structure!.description ?? "");
		else if (field === "totalAmount")
			setEditValue(
				structure!.totalAmount ? String(Number(structure!.totalAmount)) : "",
			);
	}

	function commitEdit() {
		if (!editField) return;
		if (editField === "name") {
			if (!editValue.trim()) return;
			mut.mutate({ name: editValue.trim() });
		} else if (editField === "description") {
			mut.mutate({ description: editValue || undefined });
		} else if (editField === "totalAmount") {
			const n = Number(editValue);
			if (Number.isNaN(n) || n < 0) return;
			mut.mutate({ totalAmount: n });
		}
	}

	function InlineEdit({
		field,
		displayValue,
		inputType = "text",
	}: {
		field: EditField;
		displayValue: React.ReactNode;
		inputType?: "text" | "number";
	}) {
		const isEditing = editField === field;
		return (
			<div className="flex items-center gap-1">
				{isEditing ? (
					<>
						<Input
							autoFocus
							type={inputType}
							min={inputType === "number" ? 0 : undefined}
							value={editValue}
							onChange={(e) => setEditValue(e.target.value)}
							className="h-7 text-sm"
							onKeyDown={(e) => {
								if (e.key === "Enter") commitEdit();
								if (e.key === "Escape") setEditField(null);
							}}
						/>
						<Button
							size="sm"
							variant="ghost"
							disabled={mut.isPending}
							onClick={commitEdit}
							className="h-7 w-7 p-0"
						>
							<Check className="h-3.5 w-3.5 text-green-600" />
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setEditField(null)}
							className="h-7 w-7 p-0"
						>
							<X className="h-3.5 w-3.5" />
						</Button>
					</>
				) : (
					<>
						<span>{displayValue}</span>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => startEdit(field)}
							className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<Pencil className="h-3 w-3 text-muted-foreground" />
						</Button>
					</>
				)}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-3 gap-4 rounded-lg border p-4 pt-6">
			<div className="group">
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.totalAmount")}
				</p>
				<p className="font-bold text-2xl">
					<InlineEdit
						field="totalAmount"
						displayValue={formatAmount(structure.totalAmount)}
						inputType="number"
					/>
				</p>
			</div>
			<div className="group">
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.name")}
				</p>
				<p className="font-medium">
					<InlineEdit field="name" displayValue={structure.name} />
				</p>
			</div>
			<div>
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.isActive")}
				</p>
				<Badge variant={structure.isActive ? "default" : "secondary"}>
					{structure.isActive ? t("common.active") : t("common.inactive")}
				</Badge>
			</div>
			<div className="group col-span-2">
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.description")}
				</p>
				<p className="font-medium text-sm">
					<InlineEdit
						field="description"
						displayValue={structure.description ?? "—"}
					/>
				</p>
			</div>
			<div>
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.program")}
				</p>
				<p className="font-medium">{structure.program?.shortName ?? "—"}</p>
			</div>
		</div>
	);
}

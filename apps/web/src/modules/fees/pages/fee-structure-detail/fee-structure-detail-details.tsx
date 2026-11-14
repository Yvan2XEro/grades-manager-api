import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { InlineEditField } from "../../components/inline-edit-field";
import {
	useFeeStructure,
	useUpdateStructure,
} from "../../hooks/use-fee-structures";
import { formatAmount } from "../../services/fee-format";

type EditField = "name" | "description" | "totalAmount";

export default function FeeStructureDetailDetails() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const [editField, setEditField] = useState<EditField | null>(null);
	const [editValue, setEditValue] = useState("");

	const { structure } = useFeeStructure(id!);
	const mut = useUpdateStructure(id!, () => setEditField(null));

	if (!structure) return null;

	const initialValue: Record<EditField, string> = {
		name: structure.name,
		description: structure.description ?? "",
		totalAmount: structure.totalAmount
			? String(Number(structure.totalAmount))
			: "",
	};

	function commitEdit() {
		const save = (patch: Parameters<typeof mut.mutate>[0]) =>
			mut.mutate(patch, { onError: (e) => toast.error(e.message) });
		if (editField === "name") {
			if (!editValue.trim()) return;
			save({ name: editValue.trim() });
		} else if (editField === "description") {
			save({ description: editValue || undefined });
		} else if (editField === "totalAmount") {
			const n = Number(editValue);
			if (Number.isNaN(n) || n < 0) return;
			save({ totalAmount: n });
		}
	}

	const editable = (
		field: EditField,
		displayValue: ReactNode,
		inputType?: "text" | "number",
	) => (
		<InlineEditField
			isEditing={editField === field}
			displayValue={displayValue}
			value={editValue}
			inputType={inputType}
			pending={mut.isPending}
			onStart={() => {
				setEditField(field);
				setEditValue(initialValue[field]);
			}}
			onChange={setEditValue}
			onCommit={commitEdit}
			onCancel={() => setEditField(null)}
		/>
	);

	return (
		<div className="grid grid-cols-3 gap-4 rounded-lg border p-4 pt-6">
			<div className="group">
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.totalAmount")}
				</p>
				<div className="font-bold text-2xl">
					{editable(
						"totalAmount",
						formatAmount(structure.totalAmount, structure.currency),
						"number",
					)}
				</div>
			</div>
			<div className="group">
				<p className="text-muted-foreground text-xs">
					{t("feeClearance.structures.fields.name")}
				</p>
				<div className="font-medium">{editable("name", structure.name)}</div>
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
				<div className="font-medium text-sm">
					{editable("description", structure.description ?? "—")}
				</div>
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

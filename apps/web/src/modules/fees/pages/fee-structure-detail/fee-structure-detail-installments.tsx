import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/button";
import { AddInstallmentDialog } from "../../components/add-installment-dialog";
import { EditInstallmentDialog } from "../../components/edit-installment-dialog";
import {
	useDeleteInstallment,
	useFeeStructure,
} from "../../hooks/use-fee-structures";
import { getInstallmentsColumns } from "../../table/installments-columns";
import type { FeeInstallment } from "../../types";

export default function FeeStructureDetailInstallments() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const { structure, refresh } = useFeeStructure(id!);
	const deleteInstallment = useDeleteInstallment(refresh);
	const currency = structure?.currency ?? "";
	const columns = useMemo(
		() => getInstallmentsColumns(t, currency),
		[t, currency],
	);

	if (!structure) return null;
	const installments = structure.installments ?? [];

	const rowActions = (inst: FeeInstallment): RowAction[] => [
		{
			label: t("feeClearance.structures.installments.edit"),
			icon: Pencil,
			onSelect: () =>
				EditInstallmentDialog.call({
					currency: structure.currency,
					onSaved: refresh,
					installment: {
						id: inst.id,
						label: inst.label,
						amount: inst.amount ?? "",
						dueDate: inst.dueDate ? inst.dueDate.slice(0, 10) : "",
					},
				}),
		},
		{
			label: t("common.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => deleteInstallment.mutate(inst.id),
		},
	];

	return (
		<ListLayout
			header={
				<div className="flex items-center justify-between">
					<h3 className="font-semibold">
						{t("feeClearance.structures.installments.title")}
					</h3>
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							AddInstallmentDialog.call({
								feeStructureId: id!,
								nextIndex: installments.length,
								onAdded: refresh,
							})
						}
					>
						<Plus className="mr-1 h-4 w-4" />
						{t("feeClearance.structures.installments.add")}
					</Button>
				</div>
			}
		>
			<DataTable
				columns={columns}
				data={installments}
				rowActions={rowActions}
				empty={
					<p className="p-4 text-muted-foreground text-sm">
						{t("feeClearance.structures.installments.empty")}
					</p>
				}
			/>
		</ListLayout>
	);
}

import { Edit2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { CreateStructureDialog } from "../components/create-structure-dialog";
import {
	useDeleteStructure,
	useFeeStructures,
	useRefreshStructures,
} from "../hooks/use-fee-structures";
import { getFeeStructuresColumns } from "../table/fee-structures-columns";
import type { FeeStructureRow } from "../types";

export default function FeeStructuresPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [yearFilter, setYearFilter] = useState<string>("");

	const { data: structures, isLoading } = useFeeStructures(yearFilter);
	const refreshStructures = useRefreshStructures();
	const deleteMut = useDeleteStructure();
	const columns = useMemo(() => getFeeStructuresColumns(t), [t]);

	const openDetail = (s: FeeStructureRow) =>
		navigate(`/fee-clearance/structures/${s.id}/details`);

	const rowActions = (s: FeeStructureRow): RowAction[] => [
		{
			label: t("common.actions.edit", { defaultValue: "Edit" }),
			icon: Edit2,
			onSelect: () => openDetail(s),
		},
		{
			label: t("common.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () =>
				confirmAction({
					title: t("common.confirmDelete"),
					message: t("feeClearance.structures.deleteConfirm"),
					confirmText: t("common.delete"),
					cancelText: t("common.cancel"),
					onConfirm: () => deleteMut.mutateAsync(s.id).catch(() => undefined),
				}),
		},
	];

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("feeClearance.structures.title")}
					description={t("feeClearance.structures.subtitle")}
					actions={
						<Button
							onClick={() =>
								CreateStructureDialog.call({ onCreated: refreshStructures })
							}
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("feeClearance.structures.create")}
						</Button>
					}
				/>
			}
			toolbar={
				<div className="flex gap-2">
					<div>
						<label className="mb-1 block text-muted-foreground text-xs">
							{t("feeClearance.structures.fields.academicYear")}
						</label>
						<AcademicYearSelect
							value={yearFilter || null}
							onChange={(v) => setYearFilter(v ?? "")}
							allowAll
							autoSelectActive={false}
							className="w-56"
						/>
					</div>
				</div>
			}
		>
			<DataTable
				columns={columns}
				data={structures ?? []}
				isLoading={isLoading}
				onRowClick={openDetail}
				rowActions={rowActions}
				empty={
					<Empty>
						<EmptyMedia />
						<EmptyHeader>
							<EmptyTitle>
								{t("feeClearance.structures.empty.title")}
							</EmptyTitle>
							<EmptyDescription>
								{t("feeClearance.structures.empty.description")}
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				}
			/>
		</ListLayout>
	);
}

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgramOptionFormDialog } from "../../components/program-option-form-dialog";
import { useProgramContext } from "../../hooks/use-program-context";
import {
	useDeleteProgramOption,
	useProgramOptions,
} from "../../hooks/use-program-options";
import { getProgramOptionsColumns } from "../../table/program-options-columns";
import type { ProgramOption } from "../../types";

export default function ProgramDetailOptions() {
	const { t } = useTranslation();
	const { program } = useProgramContext();
	const { options, isLoading } = useProgramOptions(program.id);
	const deleteOption = useDeleteProgramOption(program.id);
	const columns = useMemo(() => getProgramOptionsColumns(t), [t]);

	const openCreate = () =>
		ProgramOptionFormDialog.call({ programId: program.id });

	const openEdit = (option: ProgramOption) =>
		ProgramOptionFormDialog.call({ programId: program.id, option });

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("admin.programs.options.deleteConfirm.title"),
			message: t("admin.programs.options.deleteConfirm.description"),
			confirmText: t("common.actions.delete"),
			onConfirm: () => deleteOption.mutateAsync(id),
		});

	const rowActions = (option: ProgramOption): RowAction[] => [
		{
			label: t("common.actions.edit"),
			icon: Pencil,
			onSelect: () => openEdit(option),
		},
		{
			label: t("common.actions.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => confirmDelete(option.id),
		},
	];

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>{t("admin.programs.options.title")}</CardTitle>
				<Button size="sm" onClick={openCreate}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.programs.options.add")}
				</Button>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={options}
					isLoading={isLoading}
					onRowClick={openEdit}
					rowActions={rowActions}
					empty={
						<EmptyState
							title={t("admin.programs.options.emptyState.title")}
							description={t("admin.programs.options.emptyState.description")}
							cta={{
								label: t("admin.programs.options.add"),
								onClick: openCreate,
								icon: <Plus className="h-4 w-4" />,
							}}
						/>
					}
				/>
			</CardContent>
		</Card>
	);
}

import { CheckCircle2, Hash, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useRowSelection } from "@/hooks/useRowSelection";
import {
	useActivateRegistrationFormat,
	useDeleteRegistrationFormats,
	useRegistrationFormats,
} from "../hooks/use-registration-formats";
import { getRegistrationFormatsColumns } from "../table/registration-formats-columns";
import type { FormatRecord } from "../types";

export default function RegistrationFormatsPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const formatsQuery = useRegistrationFormats();
	const formats = formatsQuery.data ?? [];
	const selection = useRowSelection(formats);
	const activateMutation = useActivateRegistrationFormat();
	const deleteFormats = useDeleteRegistrationFormats();
	const columns = useMemo(() => getRegistrationFormatsColumns(t), [t]);

	const openFormat = (format: FormatRecord) =>
		navigate(`/registration-numbers/${format.id}`);
	const deleteLabel = t("admin.registrationNumbers.list.delete");

	const confirmDelete = (format: FormatRecord) =>
		confirmAction({
			title: t("admin.registrationNumbers.list.confirmDeleteTitle"),
			message: t("admin.registrationNumbers.list.confirmDelete"),
			confirmText: deleteLabel,
			onConfirm: () => deleteFormats.mutate([format.id]),
		});

	const confirmBulkDelete = () =>
		confirmAction({
			title: t("common.bulkActions.confirmDeleteTitle"),
			message: t("common.bulkActions.confirmDelete"),
			confirmText: t("common.actions.delete"),
			onConfirm: () =>
				deleteFormats.mutate([...selection.selectedIds], {
					onSuccess: selection.clear,
				}),
		});

	const rowActions = (format: FormatRecord): RowAction[] => [
		{
			label: t("admin.registrationNumbers.list.edit"),
			icon: Pencil,
			onSelect: () => openFormat(format),
		},
		{
			label: t("admin.registrationNumbers.list.activate"),
			icon: CheckCircle2,
			disabled: format.isActive || activateMutation.isPending,
			onSelect: () => activateMutation.mutate(format.id),
		},
		{
			label: deleteLabel,
			icon: Trash2,
			destructive: true,
			separator: true,
			disabled: format.isActive || deleteFormats.isPending,
			onSelect: () => confirmDelete(format),
		},
	];

	const newLabel = t("admin.registrationNumbers.actions.new");
	const openCreate = () => navigate("/registration-numbers/new");

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.registrationNumbers.title")}
					description={t("admin.registrationNumbers.subtitle")}
					actions={
						<Button onClick={openCreate}>
							<PlusCircle className="mr-2 h-4 w-4" />
							{newLabel}
						</Button>
					}
				/>
			}
			toolbar={
				<BulkActionBar
					selectedCount={selection.selectedCount}
					onClear={selection.clear}
				>
					<Button
						variant="destructive"
						size="sm"
						onClick={confirmBulkDelete}
						disabled={deleteFormats.isPending}
					>
						<Trash2 className="mr-1 h-3.5 w-3.5" />
						{t("common.actions.delete")}
					</Button>
				</BulkActionBar>
			}
		>
			<DataTable
				columns={columns}
				data={formats}
				isLoading={formatsQuery.isPending}
				selection={selection}
				rowActions={rowActions}
				empty={
					<EmptyState
						className="m-4"
						icon={<Hash className="h-6 w-6" />}
						title={t("admin.registrationNumbers.list.empty")}
						cta={{
							label: newLabel,
							onClick: openCreate,
							icon: <PlusCircle className="h-4 w-4" />,
						}}
					/>
				}
			/>
		</ListLayout>
	);
}

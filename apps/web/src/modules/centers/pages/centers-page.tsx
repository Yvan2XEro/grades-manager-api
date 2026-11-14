import { Building, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useCenters, useDeleteCenter } from "../hooks/use-centers";
import { getCentersColumns } from "../table/centers-columns";
import type { CenterRow } from "../types";

export default function CentersPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { data, isLoading } = useCenters();
	const centers = data ?? [];
	const deleteMutation = useDeleteCenter();
	const columns = useMemo(() => getCentersColumns(t), [t]);

	const openCreate = () => navigate("/centers/new");

	const confirmDelete = (center: CenterRow) =>
		confirmAction({
			title: t("admin.centers.delete.title", {
				defaultValue: "Supprimer le centre",
			}),
			message: t("admin.centers.delete.message", {
				defaultValue:
					"Êtes-vous sûr de vouloir supprimer ce centre ? Cette action est irréversible.",
			}),
			onConfirm: () =>
				deleteMutation.mutateAsync(center.id).catch(() => undefined),
		});

	const rowActions = (center: CenterRow): RowAction[] => [
		{
			label: t("common.actions.edit"),
			icon: Pencil,
			onSelect: () => navigate(`/centers/${center.id}`),
		},
		{
			label: t("common.actions.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => confirmDelete(center),
		},
	];

	const addLabel = t("admin.centers.actions.add", {
		defaultValue: "Ajouter un centre",
	});

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.centers.title", { defaultValue: "Nos centres" })}
					description={t("admin.centers.subtitle", {
						defaultValue:
							"Configurez les centres de formation professionnelle de l'institution.",
					})}
					actions={
						<Button onClick={openCreate}>
							<Plus className="mr-2 h-4 w-4" />
							{addLabel}
						</Button>
					}
				/>
			}
		>
			<DataTable
				columns={columns}
				data={centers}
				isLoading={isLoading}
				onRowClick={(center) => navigate(`/centers/${center.id}`)}
				rowActions={rowActions}
				empty={
					<EmptyState
						className="m-4"
						icon={<Building className="h-6 w-6" />}
						title={t("admin.centers.empty.title", {
							defaultValue: "Aucun centre",
						})}
						description={t("admin.centers.empty.description", {
							defaultValue:
								"Créez votre premier centre pour organiser les programmes par campus.",
						})}
						cta={{
							label: addLabel,
							onClick: openCreate,
							icon: <Plus className="h-4 w-4" />,
						}}
					/>
				}
			/>
		</ListLayout>
	);
}

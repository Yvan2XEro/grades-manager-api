import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { PageHeader } from "@/components/ui/page-header";
import { TablePagination } from "@/components/ui/table-pagination";
import { ApplicationSheet } from "../components/application-sheet";
import { ApplicationsFilters } from "../components/applications-filters";
import { PAGE_SIZE, useApplications } from "../hooks/use-applications";
import { getApplicationsColumns } from "../table/applications-columns";
import type { ApplicationListRow } from "../types";

/** Admissions list: filters, applications table and the review drawer. */
export default function AdmissionsPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const {
		filters,
		programs,
		rows,
		total,
		isLoading,
		page,
		setPage,
		pageCount,
	} = useApplications();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const columns = useMemo(() => getApplicationsColumns(t), [t]);

	const rowActions = (app: ApplicationListRow): RowAction[] => [
		{
			label: t("admissions.admin.fullDossier"),
			icon: ExternalLink,
			onSelect: () => navigate(`/admissions/${app.id}`),
		},
	];

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admissions.admin.title")}
					description={t("admissions.admin.subtitle")}
				/>
			}
			toolbar={<ApplicationsFilters filters={filters} programs={programs} />}
			footer={
				<>
					{pageCount > 1 && (
						<TablePagination
							page={page + 1}
							pageCount={pageCount}
							total={total}
							pageSize={PAGE_SIZE}
							onPageChange={(p) => setPage(p - 1)}
						/>
					)}
					{!isLoading && (
						<p className="text-muted-foreground text-xs">
							{total} {total === 1 ? "candidature" : "candidatures"}
							{filters.hasFilters ? " correspondant aux filtres" : " au total"}
						</p>
					)}
				</>
			}
		>
			<DataTable
				columns={columns}
				data={rows}
				isLoading={isLoading}
				onRowClick={(app) => setSelectedId(app.id)}
				rowActions={rowActions}
				empty={
					<p className="py-12 text-center text-muted-foreground">
						{t("admissions.admin.empty")}
					</p>
				}
			/>
			<ApplicationSheet id={selectedId} onClose={() => setSelectedId(null)} />
		</ListLayout>
	);
}

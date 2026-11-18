import { ExternalLink, KeyRound, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { TablePagination } from "@/components/ui/table-pagination";
import { CreatePersonDialog } from "../components/create-person-dialog";
import { PeopleFilters } from "../components/people-filters";
import { useDeleteProfile, usePeople } from "../hooks/use-people";
import { getPeopleColumns } from "../table/people-columns";
import type { PeopleFilters as Filters, PersonRow } from "../types";

const INITIAL_FILTERS: Filters = {
	role: "all",
	status: "all",
	search: "",
	classId: null,
	academicYearId: null,
};

export default function PeoplePage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
	const isStudent = filters.role === "student";

	const { data, people, isLoading } = usePeople({ page, pageSize, filters });
	const deleteMutation = useDeleteProfile();
	const columns = useMemo(() => getPeopleColumns(t, isStudent), [t, isStudent]);

	// Reset to page 1 whenever a filter changes
	const updateFilters = (patch: Partial<Filters>) => {
		setFilters((current) => ({ ...current, ...patch }));
		setPage(1);
	};

	const confirmDeleteProfile = (profileId: string) =>
		confirmAction({
			title: t("common.confirmDelete"),
			message: t("usersHub.people.deleteConfirm"),
			confirmText: t("common.delete"),
			cancelText: t("common.cancel"),
			onConfirm: () =>
				deleteMutation.mutateAsync(profileId).catch(() => undefined),
		});

	const rowActions = (person: PersonRow): RowAction[] => [
		{
			label: t("common.actions.open"),
			icon: ExternalLink,
			onSelect: () => navigate(`/profiles/${person.id}`),
		},
		{
			label: t("usersHub.people.manageAccess"),
			icon: KeyRound,
			onSelect: () => navigate(`/profiles/${person.id}/access`),
		},
		{
			label: t("common.actions.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => confirmDeleteProfile(person.id),
		},
	];

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("usersHub.people.title")}
					description={t("usersHub.people.subtitle")}
					actions={
						<Button onClick={() => CreatePersonDialog.call()}>
							<Plus className="mr-2 h-4 w-4" />
							{t("usersHub.people.add")}
						</Button>
					}
				/>
			}
			toolbar={<PeopleFilters filters={filters} onChange={updateFilters} />}
			footer={
				<TablePagination
					page={page}
					pageCount={data?.pageCount ?? 1}
					total={data?.total ?? 0}
					pageSize={pageSize}
					onPageChange={setPage}
					onPageSizeChange={(size) => {
						setPageSize(size);
						setPage(1);
					}}
				/>
			}
		>
			<DataTable
				columns={columns}
				data={people}
				isLoading={isLoading}
				onRowClick={(person) => navigate(`/profiles/${person.id}`)}
				rowActions={rowActions}
				empty={
					<div className="py-12 text-center text-muted-foreground">
						{t("usersHub.people.empty")}
					</div>
				}
			/>
		</ListLayout>
	);
}

import { ExternalLink, KeyRound, Plus, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { TablePagination } from "@/components/ui/table-pagination";
import { EnrollStudentDialog } from "@/modules/classes/components/enroll-student-dialog";
import { useDeleteProfile, usePeople } from "../hooks/use-people";
import { getPeopleColumns } from "../table/people-columns";
import type {
	PeopleFilters as Filters,
	PeopleAudience,
	PersonRow,
} from "../types";
import { CreatePersonDialog } from "./create-person-dialog";
import { PeopleFilters } from "./people-filters";

/**
 * Staff list (`/users/people`) or student list (`/students`). Students open
 * on the active year's active enrollments: the count the dashboard shows.
 */
export function PeopleDirectory({ audience }: { audience: PeopleAudience }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const isStudent = audience === "students";
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [filters, setFilters] = useState<Filters>({
		role: "all",
		status: "all",
		search: "",
		classId: null,
		academicYearId: null,
		enrollmentStatus: isStudent ? "active" : "all",
	});

	const { data, people, isLoading } = usePeople({
		page,
		pageSize,
		audience,
		filters,
	});
	const deleteMutation = useDeleteProfile();
	const columns = useMemo(() => getPeopleColumns(t, isStudent), [t, isStudent]);

	// Back to page 1 whenever a filter changes
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
					title={
						isStudent
							? t("usersHub.students.title")
							: t("usersHub.people.title")
					}
					description={
						isStudent
							? t("usersHub.students.subtitle")
							: t("usersHub.people.subtitle")
					}
					actions={
						isStudent ? (
							<Button
								onClick={() =>
									EnrollStudentDialog.call({
										// Enroll in the year (and class) the list is filtered on
										classId: filters.classId ?? undefined,
										academicYearId: filters.academicYearId ?? undefined,
									})
								}
							>
								<UserPlus className="mr-2 h-4 w-4" />
								{t("admin.students.enroll.title")}
							</Button>
						) : (
							<Button onClick={() => CreatePersonDialog.call()}>
								<Plus className="mr-2 h-4 w-4" />
								{t("usersHub.people.add")}
							</Button>
						)
					}
				/>
			}
			toolbar={
				<PeopleFilters
					audience={audience}
					filters={filters}
					onChange={updateFilters}
				/>
			}
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
						{isStudent
							? t("usersHub.students.empty")
							: t("usersHub.people.empty")}
					</div>
				}
			/>
		</ListLayout>
	);
}

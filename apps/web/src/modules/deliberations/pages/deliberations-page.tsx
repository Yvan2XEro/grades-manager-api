import { ExternalLink, Gavel, Plus, Trash2 } from "lucide-react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { CreateDeliberationDialog } from "../components/create-deliberation-dialog";
import { DeliberationStatusStepper } from "../components/deliberation-status-stepper";
import {
	useDeleteDeliberation,
	useDeliberations,
} from "../hooks/use-deliberations";
import {
	DELIBERATION_STATUSES,
	DELIBERATION_TYPES,
} from "../services/deliberation-status";
import { getDeliberationsColumns } from "../table/deliberations-columns";
import type { DeliberationListItem } from "../types";

export default function DeliberationsList() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [statusFilter, setStatusFilter] = useState<string>("open");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const handleFilter =
		<T,>(setter: (v: T) => void) =>
		(value: T) => {
			setter(value);
			setPage(1);
		};

	const { data, deliberations, isLoading } = useDeliberations({
		page,
		pageSize,
		academicYearId,
		status: statusFilter,
		type: typeFilter,
	});
	const deleteMutation = useDeleteDeliberation();
	const columns = useMemo(() => getDeliberationsColumns(t), [t]);

	const openDetail = (d: DeliberationListItem) =>
		navigate(`/academic-results/deliberations/${d.id}`);

	const rowActions = (d: DeliberationListItem): RowAction[] => [
		{
			label: t("common.actions.open", { defaultValue: "Open" }),
			icon: ExternalLink,
			onSelect: () => openDetail(d),
		},
		...(d.status === "draft"
			? [
					{
						label: t("admin.deliberations.actions.delete"),
						icon: Trash2,
						destructive: true,
						separator: true,
						onSelect: () =>
							confirmAction({
								title: t("admin.deliberations.confirm.deleteTitle", {
									defaultValue: "Delete deliberation?",
								}),
								message: t("admin.deliberations.confirm.delete"),
								confirmText: t("admin.deliberations.actions.delete"),
								onConfirm: () => deleteMutation.mutate(d.id),
							}),
					},
				]
			: []),
	];

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.deliberations.title")}
					description={t("admin.deliberations.subtitle")}
					actions={
						<Button onClick={() => CreateDeliberationDialog.call({})}>
							<Plus className="mr-2 h-4 w-4" />
							{t("admin.deliberations.actions.create")}
						</Button>
					}
				/>
			}
			toolbar={
				<>
					<DeliberationStatusStepper
						currentStatus={statusFilter !== "all" ? statusFilter : "draft"}
					/>
					<div className="flex flex-wrap items-center gap-3">
						<AcademicYearSelect
							value={academicYearId}
							onChange={handleFilter(setAcademicYearId)}
							placeholder={t("admin.deliberations.filters.allYears")}
							autoSelectActive
							className="w-[200px]"
						/>
						<Select
							value={statusFilter}
							onValueChange={handleFilter(setStatusFilter)}
						>
							<SelectTrigger className="w-[160px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{t("admin.deliberations.filters.allStatuses")}
								</SelectItem>
								{DELIBERATION_STATUSES.map((s) => (
									<SelectItem key={s} value={s}>
										{t(`admin.deliberations.status.${s}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={typeFilter}
							onValueChange={handleFilter(setTypeFilter)}
						>
							<SelectTrigger className="w-[160px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{t("admin.deliberations.filters.allTypes")}
								</SelectItem>
								{DELIBERATION_TYPES.map((ty) => (
									<SelectItem key={ty} value={ty}>
										{t(`admin.deliberations.type.${ty}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</>
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
				data={deliberations}
				isLoading={isLoading}
				onRowClick={openDetail}
				rowActions={rowActions}
				empty={
					<Empty className="m-4 border border-dashed">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Gavel className="text-muted-foreground" />
							</EmptyMedia>
							<EmptyTitle>{t("admin.deliberations.empty.title")}</EmptyTitle>
							<EmptyDescription>
								{t("admin.deliberations.empty.description")}
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				}
			/>
		</ListLayout>
	);
}

import { GraduationCap, Search, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { TablePagination } from "@/components/ui/table-pagination";
import { useGraduatedStudents } from "../hooks/use-graduated-students";
import { getGraduatedStudentsColumns } from "../table/graduated-students-columns";

export default function GraduatedStudents() {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data, rows, isLoading } = useGraduatedStudents({
		page,
		pageSize,
		search,
	});
	const columns = useMemo(() => getGraduatedStudentsColumns(t), [t]);

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.graduation.title")}
					description={t("admin.graduation.subtitle")}
					actions={
						!isLoading && (
							<Badge variant="secondary" className="px-3 py-1 text-sm">
								<Trophy className="mr-1.5 h-4 w-4" />
								{data?.total ?? 0} {t("admin.graduation.totalGraduates")}
							</Badge>
						)
					}
				/>
			}
			toolbar={
				<div className="relative max-w-sm">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t("admin.graduation.searchPlaceholder")}
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="pl-9"
					/>
				</div>
			}
			footer={
				<TablePagination
					page={page}
					pageCount={data?.pageCount ?? 1}
					total={data?.total ?? 0}
					pageSize={pageSize}
					onPageChange={setPage}
					onPageSizeChange={(s) => {
						setPageSize(s);
						setPage(1);
					}}
				/>
			}
		>
			<DataTable
				columns={columns}
				data={rows}
				isLoading={isLoading}
				empty={
					<EmptyState
						className="m-4"
						icon={<GraduationCap className="h-6 w-6" />}
						title={
							search
								? t("admin.graduation.noResults")
								: t("admin.graduation.empty")
						}
						description={
							search
								? t("admin.graduation.noResultsHint")
								: t("admin.graduation.emptyHint")
						}
					/>
				}
			/>
		</ListLayout>
	);
}

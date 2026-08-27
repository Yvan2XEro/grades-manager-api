import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/data-table";
import { trpc } from "@/utils/trpc";

type Subject = {
	id: string;
	name: string;
	code: string | null;
	subjectGroup: string | null;
};

export function Subjects() {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data, isLoading } = trpc.subjects.list.useQuery({
		search: search || undefined,
		page,
		pageSize,
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	const columns: ColumnDef<Subject>[] = [
		{
			accessorKey: "name",
			header: t("subjects.col_name", "Subject"),
			cell: ({ row }) => (
				<span className="font-medium text-foreground">{row.original.name}</span>
			),
		},
		{
			accessorKey: "code",
			header: t("subjects.col_code", "Code"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.code ?? "—"}
				</span>
			),
		},
		{
			accessorKey: "subjectGroup",
			header: t("subjects.col_coeff", "Group"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.subjectGroup ?? "—"}
				</span>
			),
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("subjects.title", "Subjects")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("subjects.subtitle", "Subject catalogue")}
					</p>
				</div>
			</div>

			<div className="relative">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
				<input
					type="text"
					placeholder={t("common.search", "Search…")}
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
					className="w-full rounded-lg border border-input bg-background py-2 pr-4 pl-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<DataTable
				columns={columns}
				data={items}
				total={total}
				page={page}
				pageSize={pageSize}
				isLoading={isLoading}
				emptyMessage={t("subjects.empty_title", "No subjects")}
				onPageChange={setPage}
				onPageSizeChange={(s) => {
					setPageSize(s);
					setPage(1);
				}}
			/>
		</div>
	);
}

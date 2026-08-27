import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { trpc } from "@/utils/trpc";
import { SubjectFormDialog } from "./subject-form-dialog";

type Subject = {
	id: string;
	name: string;
	nameFr?: string | null;
	code: string | null;
	subjectGroup: string | null;
	minesecCode?: string | null;
};

export function Subjects() {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingSubject, setEditingSubject] = useState<Subject | undefined>(
		undefined,
	);

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
		{
			id: "actions",
			header: t("common.actions", "Actions"),
			cell: ({ row }) => (
				<Button
					variant="ghost"
					size="sm"
					className="h-7 px-2 text-xs"
					onClick={() => {
						setEditingSubject(row.original);
						setDialogOpen(true);
					}}
				>
					<Pencil className="mr-1 h-3 w-3" />
					{t("common.edit", "Edit")}
				</Button>
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
				<Button
					onClick={() => {
						setEditingSubject(undefined);
						setDialogOpen(true);
					}}
				>
					<Plus className="mr-2 h-4 w-4" />
					{t("subjects.add", "Add subject")}
				</Button>
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

			<SubjectFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSuccess={() => {}}
				subject={editingSubject}
			/>
		</div>
	);
}

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DataTable, type SortingState } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	const [groupFilter, setGroupFilter] = useState<string>("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingSubject, setEditingSubject] = useState<Subject | undefined>(
		undefined,
	);
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "name", desc: false },
	]);

	const sortCol = sorting[0];
	const orderBy = (
		sortCol?.id === "code"
			? "code"
			: sortCol?.id === "subjectGroup"
				? "subjectGroup"
				: "name"
	) as "name" | "code" | "subjectGroup";
	const orderDir = (sortCol?.desc ? "desc" : "asc") as "asc" | "desc";

	const { data: groups } = trpc.subjects.groups.useQuery();
	const { data, isLoading } = trpc.subjects.list.useQuery({
		search: search || undefined,
		subjectGroup: groupFilter !== "all" ? groupFilter : undefined,
		orderBy,
		orderDir,
		page,
		pageSize,
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	const columns: ColumnDef<Subject>[] = [
		{
			id: "name",
			accessorKey: "name",
			enableSorting: true,
			header: t("subjects.col_name", "Subject"),
			cell: ({ row }) => (
				<div>
					<span className="font-medium text-foreground">
						{row.original.name}
					</span>
					{row.original.nameFr && row.original.nameFr !== row.original.name && (
						<p className="text-muted-foreground text-xs">
							{row.original.nameFr}
						</p>
					)}
				</div>
			),
		},
		{
			id: "code",
			accessorKey: "code",
			enableSorting: true,
			header: t("subjects.col_code", "Code"),
			cell: ({ row }) => (
				<span className="font-mono text-muted-foreground text-sm">
					{row.original.code ?? "—"}
				</span>
			),
		},
		{
			id: "subjectGroup",
			accessorKey: "subjectGroup",
			enableSorting: true,
			header: t("subjects.col_group", "Group"),
			cell: ({ row }) => {
				const g = row.original.subjectGroup;
				if (!g) return <span className="text-muted-foreground">—</span>;
				return (
					<span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 font-medium text-muted-foreground text-xs">
						{g}
					</span>
				);
			},
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
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
						{total > 0
							? `${total} ${t("subjects.count_subjects", "subjects")}`
							: t("subjects.subtitle", "Subject catalogue")}
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

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1" style={{ minWidth: 200 }}>
					<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t("subjects.search_placeholder", "Search by name…")}
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="pl-9"
					/>
				</div>
				{groups && groups.length > 0 && (
					<Select
						value={groupFilter}
						onValueChange={(v) => {
							setGroupFilter(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="w-44">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{t("subjects.all_groups", "All groups")}
							</SelectItem>
							{groups.map((g) => (
								<SelectItem key={g} value={g}>
									{g}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>

			<DataTable
				columns={columns}
				data={items}
				total={total}
				page={page}
				pageSize={pageSize}
				isLoading={isLoading}
				sorting={sorting}
				onSortingChange={(next) => {
					setSorting(next);
					setPage(1);
				}}
				emptyMessage={
					search || groupFilter !== "all"
						? t("subjects.empty_filtered", "No subjects match your filters")
						: t("subjects.empty_title", "No subjects")
				}
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

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { errorToast } from "@/lib/error-toast";
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
	const [deletingSubject, setDeletingSubject] = useState<Subject | undefined>(
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

	const utils = trpc.useUtils();

	const bulkCreateSubjects = trpc.subjects.bulkCreate.useMutation({
		onSuccess: () => utils.subjects.list.invalidate(),
	});

	const deleteSubject = trpc.subjects.delete.useMutation({
		onSuccess: () => {
			utils.subjects.list.invalidate();
			setDeletingSubject(undefined);
		},
		onError: (err) => errorToast(err, t),
	});

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
				<div className="flex items-center gap-1">
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
					<Button
						variant="ghost"
						size="sm"
						className="h-7 px-2 text-destructive text-xs hover:text-destructive"
						aria-label={t("subjects.delete_subject", "Delete subject")}
						onClick={() => setDeletingSubject(row.original)}
					>
						<Trash2 className="h-3 w-3" />
					</Button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
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
				<div className="flex items-center gap-2">
					<CsvImportDialog
						title={t("subjects.import_title", "Import subjects from CSV")}
						templateFilename="subjects-template.csv"
						columns={[
							{ key: "name", label: "Name", header: "name", required: true },
							{ key: "code", label: "Code", header: "code", required: true },
							{ key: "nameFr", label: "Name (FR)", header: "name_fr" },
							{
								key: "minesecCode",
								label: "MINESEC Code",
								header: "minesec_code",
							},
							{ key: "subjectGroup", label: "Group", header: "subject_group" },
						]}
						exampleRows={[
							["Mathematics", "MATH", "Mathématiques", "MAT001", "Sciences"],
							["English Language", "ENG", "Anglais", "ENG001", "Languages"],
						]}
						onImport={(rows) =>
							bulkCreateSubjects
								.mutateAsync({
									items: rows.map((r) => ({
										name: r.name,
										code: r.code,
										nameFr: r.nameFr || undefined,
										minesecCode: r.minesecCode || undefined,
										subjectGroup: r.subjectGroup || undefined,
									})),
								})
								.then((res) => ({ created: res.length }))
						}
					/>
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

			<AlertDialog
				open={!!deletingSubject}
				onOpenChange={(open) => !open && setDeletingSubject(undefined)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("subjects.delete_confirm_title", "Delete subject?")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t(
								"subjects.delete_confirm_desc",
								"This will permanently delete the subject. This action cannot be undone.",
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("common.cancel", "Cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() => {
								if (deletingSubject) {
									deleteSubject.mutate({ id: deletingSubject.id });
								}
							}}
						>
							{t("common.delete", "Delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

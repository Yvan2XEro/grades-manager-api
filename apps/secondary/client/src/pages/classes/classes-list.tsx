import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";
import { ClassFormDialog } from "./class-form-dialog";

const LEVELS = ["6e", "5e", "4e", "3e", "2nde", "1ère", "Terminale"] as const;

type SchoolClass = {
	id: string;
	name: string;
	code: string | null;
	level: string | null;
	studentCount?: number;
};

export function ClassesList() {
	const { t } = useTranslation();
	const { academicYearId } = useParams<{ academicYearId: string }>();
	const [search, setSearch] = useState("");
	const [levelFilter, setLevelFilter] = useState<string>("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [dialogOpen, setDialogOpen] = useState(false);

	const { data, isLoading } = trpc.classes.list.useQuery(
		{
			academicYearId: academicYearId || undefined,
			search: search || undefined,
			level: levelFilter !== "all" ? levelFilter : undefined,
			page,
			pageSize,
		},
		{ enabled: true },
	);

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	const columns: ColumnDef<SchoolClass>[] = [
		{
			id: "name",
			accessorFn: (row) => row.name,
			enableSorting: true,
			header: t("classes.col_name", "Name"),
			cell: ({ row }) => (
				<Link
					to={`/classes/${row.original.id}`}
					className="font-medium text-foreground hover:text-primary hover:underline"
				>
					{row.original.name}
				</Link>
			),
		},
		{
			accessorKey: "code",
			enableSorting: true,
			header: t("classes.col_code", "Code"),
			cell: ({ row }) => (
				<span className="font-mono text-muted-foreground text-sm">
					{row.original.code ?? "—"}
				</span>
			),
		},
		{
			accessorKey: "level",
			enableSorting: true,
			header: t("classes.col_level", "Level"),
			cell: ({ row }) => {
				const level = row.original.level;
				if (!level) return <span className="text-muted-foreground">—</span>;
				return (
					<span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 font-medium text-muted-foreground text-xs">
						{level}
					</span>
				);
			},
		},
		{
			id: "studentCount",
			header: t("classes.col_students", "Students"),
			enableSorting: false,
			cell: ({ row }) => {
				const n = row.original.studentCount ?? 0;
				return (
					<span className="flex items-center gap-1 text-muted-foreground text-sm">
						<Users className="h-3.5 w-3.5" />
						{n}
					</span>
				);
			},
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				<Link
					to={`/classes/${row.original.id}`}
					className="text-primary text-xs hover:underline"
				>
					{t("common.view", "View")}
				</Link>
			),
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("classes.title", "Classes")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{total > 0
							? `${total} ${t("classes.count_classes", "classes")}`
							: t("classes.subtitle", "Class management")}
					</p>
				</div>
				<Button onClick={() => setDialogOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					{t("classes.add", "Add class")}
				</Button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1" style={{ minWidth: 200 }}>
					<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t("classes.search_placeholder", "Search by name…")}
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="pl-9"
					/>
				</div>
				<Select
					value={levelFilter}
					onValueChange={(v) => {
						setLevelFilter(v);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("classes.all_levels", "All levels")}
						</SelectItem>
						{LEVELS.map((lv) => (
							<SelectItem key={lv} value={lv}>
								{lv}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<DataTable
				columns={columns}
				data={items}
				total={total}
				page={page}
				pageSize={pageSize}
				isLoading={isLoading}
				emptyMessage={
					search || levelFilter !== "all"
						? t("classes.empty_filtered", "No classes match your filters")
						: t("classes.empty_title", "No classes")
				}
				onPageChange={setPage}
				onPageSizeChange={(s) => {
					setPageSize(s);
					setPage(1);
				}}
			/>

			<ClassFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSuccess={() => {}}
			/>
		</div>
	);
}

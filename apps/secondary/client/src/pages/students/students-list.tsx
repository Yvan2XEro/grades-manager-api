import type { ColumnDef } from "@tanstack/react-table";
import { Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DataTable, type SortingState } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { type RouterOutputs, trpc } from "@/utils/trpc";
import { StudentFormDialog } from "./student-form-dialog";

type Student = RouterOutputs["students"]["list"]["items"][number];

const GENDER_COLORS: Record<string, string> = {
	M: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	F: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
};

export function StudentsList() {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const [genderFilter, setGenderFilter] = useState<string>("all");
	const [classFilter, setClassFilter] = useState<string>("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "lastName", desc: false },
	]);
	const [dialogOpen, setDialogOpen] = useState(false);

	// Get active academic year to scope class list and student filter
	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];

	const { data: classesData } = trpc.classes.list.useQuery(
		{ academicYearId: activeYear?.id, pageSize: 200 },
		{ enabled: !!activeYear?.id },
	);
	const classes = classesData?.items ?? [];

	const sortCol = sorting[0];
	const orderBy = (
		sortCol?.id === "firstName"
			? "firstName"
			: sortCol?.id === "mnu"
				? "mnu"
				: "lastName"
	) as "lastName" | "firstName" | "mnu";
	const orderDir = sortCol?.desc ? "desc" : "asc";

	const { data, isLoading } = trpc.students.list.useQuery({
		search: search || undefined,
		gender: genderFilter !== "all" ? (genderFilter as "M" | "F") : undefined,
		classId: classFilter !== "all" ? classFilter : undefined,
		academicYearId: classFilter !== "all" ? activeYear?.id : undefined,
		orderBy,
		orderDir,
		page,
		pageSize,
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	const columns: ColumnDef<Student>[] = [
		{
			id: "lastName",
			accessorFn: (row) => `${row.lastName} ${row.firstName}`,
			header: t("students.col_name", "Name"),
			enableSorting: true,
			cell: ({ row }) => (
				<Link
					to={`/students/${row.original.id}`}
					className="font-medium text-foreground hover:text-primary hover:underline"
				>
					{row.original.lastName} {row.original.firstName}
				</Link>
			),
		},
		{
			id: "mnu",
			accessorFn: (row) => row.mnu ?? "",
			header: t("students.col_mnu", "MNU"),
			enableSorting: true,
			cell: ({ row }) => (
				<span className="font-mono text-muted-foreground text-sm">
					{row.original.mnu ?? "—"}
				</span>
			),
		},
		{
			id: "gender",
			header: t("students.col_gender", "Gender"),
			enableSorting: false,
			cell: ({ row }) => {
				const g = row.original.gender;
				if (!g) return <span className="text-muted-foreground">—</span>;
				const label =
					g === "M"
						? t("students.gender_m", "Male")
						: t("students.gender_f", "Female");
				const colorClass = GENDER_COLORS[g] ?? "bg-muted text-muted-foreground";
				return (
					<span
						className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${colorClass}`}
					>
						{label}
					</span>
				);
			},
		},
	];

	const hasFilters = search || genderFilter !== "all" || classFilter !== "all";

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("students.title", "Students")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{total > 0
							? `${total} ${t("students.count_students", "students")}`
							: t("students.subtitle", "Student records management")}
					</p>
				</div>
				<Button onClick={() => setDialogOpen(true)}>
					<UserPlus className="mr-2 h-4 w-4" />
					{t("students.add", "Add student")}
				</Button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1" style={{ minWidth: 200 }}>
					<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t(
							"students.search_placeholder",
							"Search by name or MNU…",
						)}
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="pl-9"
					/>
				</div>
				<div className="w-44">
					<Combobox
						options={[
							{ value: "all", label: t("students.all_classes", "All classes") },
							...classes.map((c) => ({ value: c.id, label: c.name })),
						]}
						value={classFilter}
						onValueChange={(v) => {
							setClassFilter(v || "all");
							setPage(1);
						}}
						placeholder={t("students.all_classes", "All classes")}
					/>
				</div>
				<div className="w-36">
					<Combobox
						options={[
							{ value: "all", label: t("students.all_genders", "All genders") },
							{ value: "M", label: t("students.gender_m", "Male") },
							{ value: "F", label: t("students.gender_f", "Female") },
						]}
						value={genderFilter}
						onValueChange={(v) => {
							setGenderFilter(v || "all");
							setPage(1);
						}}
						placeholder={t("students.all_genders", "All genders")}
					/>
				</div>
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
					hasFilters
						? t("students.empty_filtered", "No students match your filters")
						: t("students.empty_title", "No students enrolled")
				}
				onPageChange={setPage}
				onPageSizeChange={(s) => {
					setPageSize(s);
					setPage(1);
				}}
			/>

			<StudentFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSuccess={() => {}}
				activeYearId={activeYear?.id}
				classes={classes}
			/>
		</div>
	);
}

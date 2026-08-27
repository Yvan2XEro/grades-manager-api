import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { trpc } from "@/utils/trpc";
import { StudentFormDialog } from "./student-form-dialog";

type Student = {
	id: string;
	firstName: string;
	lastName: string;
	mnu: string | null;
	gender: string | null;
};

export function StudentsList() {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingStudent, setEditingStudent] = useState<Student | undefined>(
		undefined,
	);

	const { data, isLoading } = trpc.students.list.useQuery({
		search: search || undefined,
		page,
		pageSize,
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	const columns: ColumnDef<Student>[] = [
		{
			id: "name",
			header: t("students.col_name", "Name"),
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
			accessorKey: "mnu",
			header: t("students.col_mnu", "MNU"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">{row.original.mnu ?? "—"}</span>
			),
		},
		{
			accessorKey: "gender",
			header: t("students.col_gender", "Gender"),
			cell: ({ row }) => {
				const g = row.original.gender;
				return (
					<span className="text-muted-foreground">
						{g === "M"
							? t("students.gender_m", "Male")
							: g === "F"
								? t("students.gender_f", "Female")
								: "—"}
					</span>
				);
			},
		},
		{
			id: "actions",
			header: t("students.col_actions", "Actions"),
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						className="h-7 px-2 text-xs"
						onClick={() => {
							setEditingStudent(row.original);
							setDialogOpen(true);
						}}
					>
						<Pencil className="mr-1 h-3 w-3" />
						{t("common.edit", "Edit")}
					</Button>
					<Link
						to={`/students/${row.original.id}`}
						className="text-primary text-xs hover:underline"
					>
						{t("common.view", "View")}
					</Link>
				</div>
			),
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("students.title", "Students")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("students.subtitle", "Student records management")}
					</p>
				</div>
				<Button
					onClick={() => {
						setEditingStudent(undefined);
						setDialogOpen(true);
					}}
				>
					<UserPlus className="mr-2 h-4 w-4" />
					{t("students.add", "Add student")}
				</Button>
			</div>

			<div className="relative">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
				<input
					type="text"
					placeholder={t("students.search_placeholder", "Search by name, MNU…")}
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
				emptyMessage={t("students.empty_title", "No students enrolled")}
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
				student={editingStudent}
			/>
		</div>
	);
}

import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { trpc } from "@/utils/trpc";
import { ClassFormDialog } from "./class-form-dialog";

type SchoolClass = {
	id: string;
	name: string;
	code: string | null;
	level: string | null;
};

export function ClassesList() {
	const { t } = useTranslation();
	const { academicYearId } = useParams<{ academicYearId: string }>();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [dialogOpen, setDialogOpen] = useState(false);

	const { data, isLoading } = trpc.classes.list.useQuery(
		{ academicYearId: academicYearId || undefined, page, pageSize },
		{ enabled: true },
	);

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	const columns: ColumnDef<SchoolClass>[] = [
		{
			id: "name",
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
			header: t("classes.col_code", "Code"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.code ?? "—"}
				</span>
			),
		},
		{
			accessorKey: "level",
			header: t("classes.col_level", "Level"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.level ?? "—"}
				</span>
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
						{t("classes.subtitle", "Class management")}
					</p>
				</div>
				<Button onClick={() => setDialogOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					{t("classes.add", "Add class")}
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={items}
				total={total}
				page={page}
				pageSize={pageSize}
				isLoading={isLoading}
				emptyMessage={t("classes.empty_title", "No classes")}
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

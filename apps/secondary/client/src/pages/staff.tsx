import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, UserPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { trpc } from "@/utils/trpc";
import { StaffFormDialog } from "./staff-form-dialog";

type StaffMember = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string | null;
	phone?: string | null;
};

const ROLE_LABELS: Record<string, string> = {
	teacher: "Teacher",
	admin: "Administrator",
	principal: "Principal",
	vice_principal: "Vice Principal",
	staff: "Staff",
};

export function Staff() {
	const { t } = useTranslation();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingStaff, setEditingStaff] = useState<StaffMember | undefined>(
		undefined,
	);

	const { data, isLoading } = trpc.staff.list.useQuery({ page, pageSize });

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	const columns: ColumnDef<StaffMember>[] = [
		{
			id: "name",
			header: t("staff.col_name", "Name"),
			cell: ({ row }) => (
				<span className="font-medium text-foreground">
					{row.original.lastName} {row.original.firstName}
				</span>
			),
		},
		{
			accessorKey: "email",
			header: t("staff.col_email", "Email"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">{row.original.email}</span>
			),
		},
		{
			accessorKey: "role",
			header: t("staff.col_role", "Role"),
			cell: ({ row }) => (
				<span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
					{ROLE_LABELS[row.original.role ?? "staff"] ??
						row.original.role ??
						"staff"}
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
						setEditingStaff(row.original);
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
						{t("staff.title", "Staff")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("staff.subtitle", "Staff management")}
					</p>
				</div>
				<Button
					onClick={() => {
						setEditingStaff(undefined);
						setDialogOpen(true);
					}}
				>
					<UserPlus className="mr-2 h-4 w-4" />
					{t("staff.add", "Add staff member")}
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={items}
				total={total}
				page={page}
				pageSize={pageSize}
				isLoading={isLoading}
				emptyMessage={t("staff.empty_title", "No staff members")}
				onPageChange={setPage}
				onPageSizeChange={(s) => {
					setPageSize(s);
					setPage(1);
				}}
			/>

			<StaffFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSuccess={() => {}}
				staff={editingStaff}
			/>
		</div>
	);
}

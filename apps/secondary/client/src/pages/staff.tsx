import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DataTable, type SortingState } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
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

const ROLES = [
	"teacher",
	"admin",
	"principal",
	"vice_principal",
	"staff",
] as const;

const ROLE_LABELS: Record<string, string> = {
	teacher: "Teacher",
	admin: "Administrator",
	principal: "Principal",
	vice_principal: "Vice Principal",
	staff: "Staff",
};

const ROLE_COLORS: Record<string, string> = {
	teacher: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	admin:
		"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	principal:
		"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
	vice_principal:
		"bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
	staff: "bg-muted text-muted-foreground",
};

export function Staff() {
	const { t } = useTranslation();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState<string>("all");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingStaff, setEditingStaff] = useState<StaffMember | undefined>(
		undefined,
	);
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "lastName", desc: false },
	]);

	const sortCol = sorting[0];
	const orderBy = (
		sortCol?.id === "firstName"
			? "firstName"
			: sortCol?.id === "email"
				? "email"
				: "lastName"
	) as "lastName" | "firstName" | "email";
	const orderDir = (sortCol?.desc ? "desc" : "asc") as "asc" | "desc";

	const { data, isLoading } = trpc.staff.list.useQuery({
		page,
		pageSize,
		search: search || undefined,
		role:
			roleFilter !== "all" ? (roleFilter as (typeof ROLES)[number]) : undefined,
		orderBy,
		orderDir,
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	const columns: ColumnDef<StaffMember>[] = [
		{
			id: "lastName",
			accessorFn: (row) => `${row.lastName} ${row.firstName}`,
			enableSorting: true,
			header: t("staff.col_name", "Name"),
			cell: ({ row }) => (
				<Link
					to={`/staff/${row.original.id}`}
					className="font-medium text-foreground hover:text-primary hover:underline"
				>
					{row.original.lastName} {row.original.firstName}
				</Link>
			),
		},
		{
			id: "email",
			accessorKey: "email",
			enableSorting: true,
			header: t("staff.col_email", "Email"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.email}
				</span>
			),
		},
		{
			accessorKey: "phone",
			header: t("staff.col_phone", "Phone"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.phone ?? "—"}
				</span>
			),
		},
		{
			accessorKey: "role",
			enableSorting: true,
			header: t("staff.col_role", "Role"),
			cell: ({ row }) => {
				const role = row.original.role ?? "staff";
				const colorClass = ROLE_COLORS[role] ?? ROLE_COLORS.staff;
				return (
					<span
						className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${colorClass}`}
					>
						{t(`staff.role_${role}`, ROLE_LABELS[role] ?? role)}
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
						{total > 0
							? `${total} ${t("staff.count_members", "members")}`
							: t("staff.subtitle", "Staff management")}
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

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1" style={{ minWidth: 200 }}>
					<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t(
							"staff.search_placeholder",
							"Search by name or email…",
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
							{ value: "all", label: t("staff.all_roles", "All roles") },
							...ROLES.map((role) => ({
								value: role,
								label: t(`staff.role_${role}`, ROLE_LABELS[role] ?? role),
							})),
						]}
						value={roleFilter}
						onValueChange={(v) => {
							setRoleFilter(v || "all");
							setPage(1);
						}}
						placeholder={t("staff.all_roles", "All roles")}
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
					search || roleFilter !== "all"
						? t("staff.empty_filtered", "No staff match your filters")
						: t("staff.empty_title", "No staff members")
				}
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

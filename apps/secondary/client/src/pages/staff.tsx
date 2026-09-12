import type { ColumnDef } from "@tanstack/react-table";
import {
	ClipboardCopy,
	MoreHorizontal,
	Pencil,
	RefreshCw,
	Search,
	UserPlus,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DataTable, type SortingState } from "@/components/ui/data-table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { errorToast } from "@/lib/error-toast";
import { trpc } from "@/utils/trpc";
import { StaffFormDialog } from "./staff-form-dialog";

type StaffMember = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string | null;
	phone?: string | null;
	authUserId?: string | null;
	invitationId?: string | null;
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

function InviteLinkModal({
	open,
	onClose,
	link,
}: {
	open: boolean;
	onClose: () => void;
	link: string;
}) {
	const { t } = useTranslation();
	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						{t("staff.invite_link_title", "Share invite link")}
					</DialogTitle>
				</DialogHeader>
				<p className="text-muted-foreground text-sm">
					{t(
						"staff.invite_link_hint",
						"The staff member will use this link to set their password and activate their account.",
					)}
				</p>
				<div className="flex gap-2">
					<Input readOnly value={link} className="font-mono text-xs" />
					<Button
						size="sm"
						variant="outline"
						onClick={() => navigator.clipboard.writeText(link)}
					>
						<ClipboardCopy className="h-4 w-4" />
					</Button>
				</div>
				<div className="flex justify-end pt-2">
					<Button onClick={onClose}>{t("common.close", "Close")}</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function Staff() {
	const { t } = useTranslation();
	useBreadcrumbs([
		{ label: t("nav.dashboard", "Dashboard"), href: "/" },
		{ label: t("nav.staff", "Staff") },
	]);
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
	const [resendLink, setResendLink] = useState<string | null>(null);

	const sortCol = sorting[0];
	const orderBy = (
		sortCol?.id === "firstName"
			? "firstName"
			: sortCol?.id === "email"
				? "email"
				: "lastName"
	) as "lastName" | "firstName" | "email";
	const orderDir = (sortCol?.desc ? "desc" : "asc") as "asc" | "desc";

	const utils = trpc.useUtils();

	const bulkCreateStaff = trpc.staff.bulkCreate.useMutation({
		onSuccess: () => utils.staff.list.invalidate(),
	});

	const resendInvite = trpc.staff.resendInvite.useMutation({
		onSuccess: (data) => {
			utils.staff.list.invalidate();
			setResendLink(data.inviteUrl);
		},
		onError: (err) => errorToast(err, t),
	});

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
			id: "status",
			header: t("staff.col_status", "Status"),
			enableSorting: false,
			cell: ({ row }) =>
				row.original.authUserId ? (
					<Badge variant="success">{t("staff.status_active", "Active")}</Badge>
				) : (
					<Badge variant="secondary">
						{t("staff.status_pending", "Pending invitation")}
					</Badge>
				),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => {
				const member = row.original;
				const isPending = !member.authUserId;

				const copyLink = () => {
					if (member.invitationId) {
						const url = `${window.location.origin}/#/accept-invitation/${member.invitationId}?email=${encodeURIComponent(member.email)}`;
						navigator.clipboard.writeText(url);
						toast.success(t("staff.link_copied", "Link copied to clipboard"));
					} else {
						resendInvite.mutate({ id: member.id });
					}
				};

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									setEditingStaff(member);
									setDialogOpen(true);
								}}
							>
								<Pencil className="mr-2 h-4 w-4" />
								{t("common.edit", "Edit")}
							</DropdownMenuItem>

							{isPending && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={copyLink}>
										<ClipboardCopy className="mr-2 h-4 w-4" />
										{t("staff.copy_invite_link", "Copy invite link")}
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => resendInvite.mutate({ id: member.id })}
									>
										<RefreshCw className="mr-2 h-4 w-4" />
										{t("staff.resend_invite", "Resend invite")}
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
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
				<div className="flex items-center gap-2">
					<CsvImportDialog
						title={t("staff.import_title", "Import staff from CSV")}
						templateFilename="staff-template.csv"
						columns={[
							{
								key: "firstName",
								label: "First name",
								header: "first_name",
								required: true,
							},
							{
								key: "lastName",
								label: "Last name",
								header: "last_name",
								required: true,
							},
							{ key: "email", label: "Email", header: "email", required: true },
							{ key: "phone", label: "Phone", header: "phone" },
							{ key: "role", label: "Role", header: "role" },
						]}
						exampleRows={[
							[
								"Jean",
								"Dupont",
								"jean.dupont@school.cm",
								"+237600000001",
								"teacher",
							],
							["Marie", "Foe", "marie.foe@school.cm", "+237600000002", "admin"],
						]}
						onImport={(rows) =>
							bulkCreateStaff
								.mutateAsync({
									items: rows.map((r) => ({
										firstName: r.firstName,
										lastName: r.lastName,
										email: r.email,
										phone: r.phone || undefined,
										role: (r.role || undefined) as any,
									})),
								})
								.then((res) => ({ created: res.length }))
						}
					/>
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

			{resendLink && (
				<InviteLinkModal
					open={!!resendLink}
					onClose={() => setResendLink(null)}
					link={resendLink}
				/>
			)}
		</div>
	);
}

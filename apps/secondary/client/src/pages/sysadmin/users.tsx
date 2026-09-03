import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Search, Users } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DataTable } from "@/components/ui/data-table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { Label } from "@/components/ui/label";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { type RouterOutputs, trpc } from "@/utils/trpc";

type UserRow = RouterOutputs["systemAdmin"]["listUsers"]["rows"][number];

function formatDate(d: string | Date | null, locale: string) {
	if (!d) return "—";
	return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(new Date(d));
}

// ─── Create user dialog ────────────────────────────────────────────────────────

function CreateUserDialog({
	open,
	onClose,
	onDone,
}: {
	open: boolean;
	onClose: () => void;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<"user" | "admin">("user");
	const [error, setError] = useState<string | null>(null);

	const create = trpc.systemAdmin.createUser.useMutation({
		onSuccess: () => {
			onDone();
			onClose();
			setName("");
			setEmail("");
			setPassword("");
			setRole("user");
			setError(null);
		},
		onError: (err) => {
			if (
				err.message.toLowerCase().includes("already") ||
				err.message.toLowerCase().includes("email")
			) {
				setError(
					t("sysadmin.users.email_taken", "This email is already in use."),
				);
			} else {
				setError(err.message);
			}
		},
	});

	const handleClose = () => {
		setName("");
		setEmail("");
		setPassword("");
		setRole("user");
		setError(null);
		onClose();
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{t("sysadmin.users.create_user_title", "Create user account")}
					</DialogTitle>
					<DialogDescription className="text-muted-foreground text-sm">
						{t(
							"sysadmin.users.create_user_desc",
							"The account is created immediately. Share the password with the user.",
						)}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 pt-1">
					<div className="space-y-1.5">
						<Label htmlFor="cu-name">
							{t("sysadmin.users.field_name", "Full name")}
						</Label>
						<Input
							id="cu-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Jean Dupont"
							autoComplete="off"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="cu-email">
							{t("sysadmin.users.field_email", "Email")}
						</Label>
						<Input
							id="cu-email"
							type="email"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								setError(null);
							}}
							placeholder="jean@exemple.com"
							autoComplete="off"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="cu-password">
							{t("sysadmin.users.field_password", "Password")}
						</Label>
						<Input
							id="cu-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
							autoComplete="new-password"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="cu-role">
							{t("sysadmin.users.field_role", "Platform role")}
						</Label>
						<Combobox
							options={[
								{ value: "user", label: t("sysadmin.users.role_user", "User") },
								{
									value: "admin",
									label: t("sysadmin.users.role_admin", "Admin"),
								},
							]}
							value={role}
							onValueChange={(v) => setRole(v as "user" | "admin")}
							placeholder={t("sysadmin.users.role_user", "User")}
						/>
					</div>
					{error && <p className="text-destructive text-sm">{error}</p>}
					<div className="flex justify-end gap-2 pt-1">
						<Button variant="ghost" onClick={handleClose}>
							{t("cancel", "Cancel")}
						</Button>
						<Button
							disabled={
								create.isPending ||
								!name.trim() ||
								!email.trim() ||
								password.length < 8
							}
							onClick={() =>
								create.mutate({
									name: name.trim(),
									email: email.trim(),
									password,
									role,
								})
							}
						>
							{create.isPending
								? t("sysadmin.users.creating", "Creating…")
								: t("sysadmin.users.create_btn", "Create account")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Ban dialog ────────────────────────────────────────────────────────────────

function BanDialog({
	user,
	onClose,
	onDone,
}: {
	user: { id: string; name: string } | null;
	onClose: () => void;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const [reason, setReason] = useState("");
	const ban = trpc.systemAdmin.banUser.useMutation({
		onSuccess: () => {
			onDone();
			onClose();
			setReason("");
		},
	});

	return (
		<Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>
						{t("sysadmin.users.ban_title", "Ban user?")}
					</DialogTitle>
				</DialogHeader>
				<p className="text-muted-foreground text-sm">
					<span className="font-medium text-foreground">{user?.name}</span>{" "}
					{t(
						"sysadmin.users.ban_desc_1",
						"will be immediately signed out and blocked from logging in.",
					)}
				</p>
				<div className="space-y-1.5">
					<Label htmlFor="ban-reason">
						{t("sysadmin.users.ban_reason", "Reason (optional)")}
					</Label>
					<Input
						id="ban-reason"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder={t(
							"sysadmin.users.ban_reason_placeholder",
							"Policy violation…",
						)}
					/>
				</div>
				<div className="flex justify-end gap-2 pt-1">
					<Button variant="ghost" onClick={onClose}>
						{t("cancel", "Cancel")}
					</Button>
					<Button
						variant="destructive"
						disabled={ban.isPending}
						onClick={() =>
							user &&
							ban.mutate({ userId: user.id, reason: reason || undefined })
						}
					>
						{ban.isPending
							? t("sysadmin.users.banning", "Banning…")
							: t("sysadmin.users.ban_user", "Ban user")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Role confirm dialog ───────────────────────────────────────────────────────

function RoleDialog({
	user,
	onClose,
	onDone,
}: {
	user: { id: string; name: string; role: string | null } | null;
	onClose: () => void;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const targetRole = user?.role === "admin" ? "user" : "admin";
	const setRole = trpc.systemAdmin.setUserRole.useMutation({
		onSuccess: () => {
			onDone();
			onClose();
		},
	});

	return (
		<Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>
						{targetRole === "admin"
							? t("sysadmin.users.grant_admin_title", "Grant admin access?")
							: t("sysadmin.users.revoke_admin_title", "Revoke admin access?")}
					</DialogTitle>
				</DialogHeader>
				<p className="text-muted-foreground text-sm">
					{targetRole === "admin" ? (
						<>
							<span className="font-medium text-foreground">{user?.name}</span>{" "}
							{t(
								"sysadmin.users.grant_admin_desc_1",
								"will gain full platform admin privileges. Only do this for trusted operators.",
							)}
						</>
					) : (
						<>
							<span className="font-medium text-foreground">{user?.name}</span>{" "}
							{t(
								"sysadmin.users.revoke_admin_desc_1",
								"will lose platform admin access and revert to a regular user.",
							)}
						</>
					)}
				</p>
				<div className="flex justify-end gap-2 pt-1">
					<Button variant="ghost" onClick={onClose}>
						{t("cancel", "Cancel")}
					</Button>
					<Button
						variant={targetRole === "admin" ? "default" : "destructive"}
						disabled={setRole.isPending}
						onClick={() =>
							user && setRole.mutate({ userId: user.id, role: targetRole })
						}
					>
						{setRole.isPending
							? t("sysadmin.users.saving", "Saving…")
							: targetRole === "admin"
								? t("sysadmin.users.grant_admin_btn", "Grant admin")
								: t("sysadmin.users.revoke_admin_btn", "Revoke admin")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Row actions ──────────────────────────────────────────────────────────────

function RowActions({
	user,
	onBan,
	onUnban,
	onRole,
	isUnbanning,
}: {
	user: UserRow;
	onBan: (u: { id: string; name: string }) => void;
	onUnban: (userId: string) => void;
	onRole: (u: { id: string; name: string; role: string | null }) => void;
	isUnbanning: boolean;
}) {
	const { t } = useTranslation();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8">
					<MoreHorizontal className="h-4 w-4" />
					<span className="sr-only">Open menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem asChild>
					<Link to={`/sysadmin/users/${user.id}`}>
						{t("sysadmin.users.view_profile", "View profile")}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{user.banned ? (
					<DropdownMenuItem
						className="text-emerald-600 focus:text-emerald-600"
						disabled={isUnbanning}
						onSelect={() => onUnban(user.id)}
					>
						{t("sysadmin.users.unban_user", "Unban user")}
					</DropdownMenuItem>
				) : (
					<DropdownMenuItem
						className="text-rose-600 focus:text-rose-600"
						onSelect={() => onBan({ id: user.id, name: user.name })}
					>
						{t("sysadmin.users.ban_user", "Ban user")}
					</DropdownMenuItem>
				)}
				<DropdownMenuItem
					onSelect={() =>
						onRole({ id: user.id, name: user.name, role: user.role })
					}
				>
					{user.role === "admin"
						? t("sysadmin.users.revoke_admin", "Revoke admin")
						: t("sysadmin.users.make_admin", "Make admin")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function SysAdminUsers() {
	const { t, i18n } = useTranslation();
	useBreadcrumbs([{ label: t("sysadmin.nav.users", "Users") }]);
	const [{ page, pageSize, search, role, banned, sortBy, sortDir }, setQuery] =
		useQueryStates({
			page: parseAsInteger.withDefault(1),
			pageSize: parseAsInteger.withDefault(20),
			search: parseAsString.withDefault(""),
			role: parseAsString.withDefault(""),
			banned: parseAsString.withDefault(""),
			sortBy: parseAsString.withDefault("createdAt"),
			sortDir: parseAsString.withDefault("desc"),
		});

	const sorting: SortingState = [{ id: sortBy, desc: sortDir === "desc" }];

	const [createOpen, setCreateOpen] = useState(false);
	const [banTarget, setBanTarget] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [roleTarget, setRoleTarget] = useState<{
		id: string;
		name: string;
		role: string | null;
	} | null>(null);

	const bannedFilter =
		banned === "true" ? true : banned === "false" ? false : undefined;

	const { data, isLoading, refetch } = trpc.systemAdmin.listUsers.useQuery({
		page,
		pageSize,
		search: search || undefined,
		role: (role as "admin" | "user") || undefined,
		banned: bannedFilter,
		sortBy: sortBy as "name" | "email" | "createdAt",
		sortDir: sortDir as "asc" | "desc",
	});

	const unban = trpc.systemAdmin.unbanUser.useMutation({
		onSuccess: () => refetch(),
	});

	const rows = data?.rows ?? [];
	const total = data?.total ?? 0;

	const columns: ColumnDef<UserRow>[] = [
		{
			id: "name",
			accessorKey: "name",
			enableSorting: true,
			header: t("sysadmin.users.col_name", "Name"),
			cell: ({ row }) => (
				<Link
					to={`/sysadmin/users/${row.original.id}`}
					className="font-medium text-foreground hover:text-primary hover:underline"
				>
					{row.original.name}
				</Link>
			),
		},
		{
			id: "email",
			accessorKey: "email",
			enableSorting: true,
			header: t("sysadmin.users.col_email", "Email"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.email}
				</span>
			),
		},
		{
			id: "role",
			header: t("sysadmin.users.col_role", "Role"),
			cell: ({ row }) =>
				row.original.role === "admin" ? (
					<span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
						{t("sysadmin.users.role_admin", "Admin")}
					</span>
				) : (
					<span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
						{t("sysadmin.users.role_user", "User")}
					</span>
				),
		},
		{
			id: "status",
			header: t("sysadmin.users.col_status", "Status"),
			cell: ({ row }) =>
				row.original.banned ? (
					<span className="rounded-full bg-rose-500/10 px-2 py-0.5 font-medium text-rose-600 text-xs">
						{t("sysadmin.users.status_banned", "Banned")}
					</span>
				) : (
					<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs">
						{t("sysadmin.users.status_active", "Active")}
					</span>
				),
		},
		{
			id: "institutions",
			header: t("sysadmin.users.col_institutions", "Institutions"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.institutionCount ?? 0}
				</span>
			),
		},
		{
			id: "lastSeen",
			header: t("sysadmin.users.col_last_seen", "Last seen"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{formatDate(row.original.lastSeenAt, i18n.language)}
				</span>
			),
		},
		{
			id: "createdAt",
			accessorKey: "createdAt",
			enableSorting: true,
			header: t("sysadmin.users.col_joined", "Joined"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{formatDate(row.original.createdAt, i18n.language)}
				</span>
			),
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => (
				<RowActions
					user={row.original}
					onBan={setBanTarget}
					onUnban={(userId) => unban.mutate({ userId })}
					onRole={setRoleTarget}
					isUnbanning={unban.isPending}
				/>
			),
		},
	];

	return (
		<div className="space-y-5">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("sysadmin.users.title", "Users")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t(
							"sysadmin.users.subtitle_other",
							"{{count}} users registered on the platform",
							{ count: total },
						)}
					</p>
				</div>
				<Button onClick={() => setCreateOpen(true)}>
					<Plus className="h-4 w-4" />
					{t("sysadmin.users.create_user", "Create account")}
				</Button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1" style={{ minWidth: 220 }}>
					<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t(
							"sysadmin.users.search_placeholder",
							"Search by name or email…",
						)}
						value={search}
						onChange={(e) => setQuery({ search: e.target.value, page: 1 })}
						className="pl-9"
					/>
				</div>
				<div className="w-36">
					<Combobox
						options={[
							{ value: "", label: t("sysadmin.users.all_roles", "All roles") },
							{
								value: "admin",
								label: t("sysadmin.users.role_admin", "Admin"),
							},
							{ value: "user", label: t("sysadmin.users.role_user", "User") },
						]}
						value={role}
						onValueChange={(v) => setQuery({ role: v, page: 1 })}
						placeholder={t("sysadmin.users.all_roles", "All roles")}
					/>
				</div>
				<div className="w-40">
					<Combobox
						options={[
							{
								value: "",
								label: t("sysadmin.users.all_statuses", "All statuses"),
							},
							{
								value: "false",
								label: t("sysadmin.users.status_active", "Active"),
							},
							{
								value: "true",
								label: t("sysadmin.users.status_banned", "Banned"),
							},
						]}
						value={banned}
						onValueChange={(v) => setQuery({ banned: v, page: 1 })}
						placeholder={t("sysadmin.users.all_statuses", "All statuses")}
					/>
				</div>
			</div>

			{/* Table */}
			{rows.length === 0 && !isLoading && !search && !role && !banned ? (
				<div className="flex flex-col items-center gap-2 rounded-xl border border-border py-16 text-muted-foreground">
					<Users className="h-8 w-8 opacity-20" />
					<p className="text-sm">
						{t("sysadmin.users.no_users", "No users found.")}
					</p>
				</div>
			) : (
				<DataTable
					columns={columns}
					data={rows}
					total={total}
					page={page}
					pageSize={pageSize}
					isLoading={isLoading}
					sorting={sorting}
					onSortingChange={(s) => {
						const col = s[0];
						setQuery({
							sortBy: col?.id ?? "createdAt",
							sortDir: col?.desc ? "desc" : "asc",
							page: 1,
						});
					}}
					emptyMessage={
						search || role || banned
							? t("sysadmin.users.empty_filter", "No users match your filters")
							: t("sysadmin.users.no_users", "No users found.")
					}
					onPageChange={(p) => setQuery({ page: p })}
					onPageSizeChange={(s) => setQuery({ pageSize: s, page: 1 })}
				/>
			)}

			<CreateUserDialog
				open={createOpen}
				onClose={() => setCreateOpen(false)}
				onDone={() => refetch()}
			/>
			<BanDialog
				user={banTarget}
				onClose={() => setBanTarget(null)}
				onDone={() => refetch()}
			/>
			<RoleDialog
				user={roleTarget}
				onClose={() => setRoleTarget(null)}
				onDone={() => refetch()}
			/>
		</div>
	);
}

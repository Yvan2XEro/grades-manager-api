import type { ColumnDef } from "@tanstack/react-table";
import {
	Building2,
	KeyRound,
	LogOut,
	Mail,
	MoreHorizontal,
	Pencil,
	Plus,
	Shield,
	ShieldOff,
	Trash2,
	UserCheck,
	UserSearch,
	UserX,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DataTable } from "@/components/ui/data-table";
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
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { type RouterOutputs, trpc } from "@/utils/trpc";

type UserDetail = RouterOutputs["systemAdmin"]["getUser"];
type Membership = NonNullable<UserDetail>["memberships"][number];

function formatDate(d: string | Date | null | undefined, locale: string) {
	if (!d) return "—";
	return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(new Date(d));
}

function DetailRow({
	label,
	value,
}: {
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className="flex items-start gap-4 py-2.5">
			<span className="w-36 flex-shrink-0 text-muted-foreground text-sm">
				{label}
			</span>
			<span className="font-medium text-foreground text-sm">{value}</span>
		</div>
	);
}

// ─── Ban dialog ───────────────────────────────────────────────────────────────

function BanDialog({
	open,
	user,
	onClose,
	onDone,
}: {
	open: boolean;
	user: { id: string; name: string } | null;
	onClose: () => void;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const [reason, setReason] = useState("");
	const [expiresInDays, setExpiresInDays] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleBan = async () => {
		if (!user) return;
		setLoading(true);
		setError("");
		const res = await authClient.admin.banUser({
			userId: user.id,
			banReason: reason || undefined,
			banExpiresIn: expiresInDays ? Number(expiresInDays) * 86400 : undefined,
		});
		setLoading(false);
		if (res.error) {
			setError(res.error.message ?? "Error");
			return;
		}
		onDone();
		onClose();
		setReason("");
		setExpiresInDays("");
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>
						{t("sysadmin.users.ban_title", "Ban user?")}
					</DialogTitle>
				</DialogHeader>
				<p className="text-muted-foreground text-sm">
					<strong className="text-foreground">{user?.name}</strong>{" "}
					{t(
						"sysadmin.users.ban_desc_1",
						"will be immediately signed out and blocked from logging in.",
					)}
				</p>
				<div className="space-y-3">
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
					<div className="space-y-1.5">
						<Label htmlFor="ban-expires">
							{t(
								"sysadmin.users.detail.ban_expires_label",
								"Duration in days (leave empty = permanent)",
							)}
						</Label>
						<Input
							id="ban-expires"
							type="number"
							min="1"
							value={expiresInDays}
							onChange={(e) => setExpiresInDays(e.target.value)}
							placeholder={t(
								"sysadmin.users.detail.ban_expires_placeholder",
								"e.g. 30",
							)}
						/>
					</div>
				</div>
				{error && <p className="text-destructive text-sm">{error}</p>}
				<div className="flex justify-end gap-2 pt-1">
					<Button variant="ghost" onClick={onClose}>
						{t("cancel", "Cancel")}
					</Button>
					<Button variant="destructive" disabled={loading} onClick={handleBan}>
						{loading
							? t("sysadmin.users.banning", "Banning…")
							: t("sysadmin.users.ban_user", "Ban user")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Set password dialog ──────────────────────────────────────────────────────

function SetPasswordDialog({
	open,
	userId,
	onClose,
	onDone,
}: {
	open: boolean;
	userId: string;
	onClose: () => void;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSet = async () => {
		if (password.length < 8) {
			setError(
				t(
					"sysadmin.users.detail.set_password_error",
					"Password must be at least 8 characters",
				),
			);
			return;
		}
		setLoading(true);
		setError("");
		const res = await authClient.admin.setUserPassword({
			userId,
			newPassword: password,
		});
		setLoading(false);
		if (res.error) {
			setError(res.error.message ?? "Error");
			return;
		}
		onDone();
		onClose();
		setPassword("");
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>
						{t("sysadmin.users.detail.set_password_title", "Set new password")}
					</DialogTitle>
				</DialogHeader>
				<p className="text-muted-foreground text-sm">
					{t(
						"sysadmin.users.detail.set_password_desc",
						"Set a new password directly. The user will be able to log in with it immediately.",
					)}
				</p>
				<div className="space-y-1.5">
					<Label htmlFor="new-password">
						{t("sysadmin.users.detail.set_password_label", "New password")}
					</Label>
					<Input
						id="new-password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder={t(
							"sysadmin.users.detail.set_password_placeholder",
							"Min. 8 characters",
						)}
					/>
				</div>
				{error && <p className="text-destructive text-sm">{error}</p>}
				<div className="flex justify-end gap-2 pt-1">
					<Button variant="ghost" onClick={onClose}>
						{t("cancel", "Cancel")}
					</Button>
					<Button disabled={loading} onClick={handleSet}>
						{loading
							? t("sysadmin.users.detail.setting", "Setting…")
							: t("sysadmin.users.detail.set_password_btn", "Set password")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Update user dialog ───────────────────────────────────────────────────────

function UpdateUserDialog({
	open,
	user,
	onClose,
	onDone,
}: {
	open: boolean;
	user: { id: string; name: string; email: string } | null;
	onClose: () => void;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const [name, setName] = useState(user?.name ?? "");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const currentName = user?.name ?? "";
	if (name === "" && currentName !== "") setName(currentName);

	const handleUpdate = async () => {
		if (!user) return;
		if (!name.trim()) {
			setError(t("sysadmin.users.detail.name_required", "Name is required"));
			return;
		}
		setLoading(true);
		setError("");
		const res = await authClient.admin.updateUser({
			userId: user.id,
			data: { name: name.trim() },
		});
		setLoading(false);
		if (res.error) {
			setError(res.error.message ?? "Error");
			return;
		}
		onDone();
		onClose();
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>
						{t("sysadmin.users.detail.update_title", "Edit user")}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<div className="space-y-1.5">
						<Label htmlFor="edit-name">
							{t("sysadmin.users.detail.field_name", "Name")}
						</Label>
						<Input
							id="edit-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label>{t("sysadmin.users.detail.field_email", "Email")}</Label>
						<Input value={user?.email ?? ""} readOnly className="opacity-60" />
						<p className="text-muted-foreground text-xs">
							{t(
								"sysadmin.users.detail.email_readonly",
								"Email change requires user verification — not supported here.",
							)}
						</p>
					</div>
				</div>
				{error && <p className="text-destructive text-sm">{error}</p>}
				<div className="flex justify-end gap-2 pt-1">
					<Button variant="ghost" onClick={onClose}>
						{t("cancel", "Cancel")}
					</Button>
					<Button disabled={loading} onClick={handleUpdate}>
						{loading
							? t("sysadmin.users.saving", "Saving…")
							: t("sysadmin.users.detail.save_changes", "Save changes")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Institution search field ──────────────────────────────────────────────────

function InstitutionSearchField({
	value,
	onSelect,
}: {
	value: { id: string; name: string } | null;
	onSelect: (i: { id: string; name: string } | null) => void;
}) {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const { data } = trpc.systemAdmin.listInstitutions.useQuery(
		{ search: search || undefined, pageSize: 8, page: 1 },
		{ enabled: search.length >= 2 },
	);

	return value ? (
		<div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
			<p className="font-medium text-sm">{value.name}</p>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => onSelect(null)}
				className="h-6 px-2 text-muted-foreground text-xs"
			>
				{t("sysadmin.users.detail.change", "Change")}
			</Button>
		</div>
	) : (
		<div className="relative">
			<UserSearch className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
			<Input
				placeholder={t(
					"sysadmin.users.detail.search_institution",
					"Search institution…",
				)}
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				className="pl-9"
			/>
			{search.length >= 2 && data && data.rows.length > 0 && (
				<div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-md">
					{data.rows.map((i) => (
						<button
							key={i.id}
							type="button"
							className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted/60"
							onClick={() => {
								onSelect({ id: i.id, name: i.name });
								setSearch("");
							}}
						>
							<span className="font-medium">{i.name}</span>
							<span className="text-muted-foreground text-xs capitalize">
								{i.type}
							</span>
						</button>
					))}
				</div>
			)}
			{search.length >= 2 && data?.rows.length === 0 && (
				<div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover px-3 py-2 text-muted-foreground text-sm shadow-md">
					{t(
						"sysadmin.users.detail.no_institutions_found",
						"No institutions found",
					)}
				</div>
			)}
		</div>
	);
}

// ─── Add to institution dialog ─────────────────────────────────────────────────

function AddToInstitutionDialog({
	userId,
	open,
	onClose,
	onDone,
}: {
	userId: string;
	open: boolean;
	onClose: () => void;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const [institution, setInstitution] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [role, setRole] = useState<"admin" | "member">("member");

	const add = trpc.systemAdmin.addMember.useMutation({
		onSuccess: () => {
			onDone();
			onClose();
			setInstitution(null);
			setRole("member");
		},
	});

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>
						{t(
							"sysadmin.users.detail.add_to_institution",
							"Add to institution",
						)}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label>
							{t("sysadmin.users.detail.institution_label", "Institution")}
						</Label>
						<InstitutionSearchField
							value={institution}
							onSelect={setInstitution}
						/>
					</div>
					<div className="space-y-1.5">
						<Label>{t("sysadmin.users.detail.role_label", "Role")}</Label>
						<Combobox
							options={[
								{
									value: "member",
									label: t("sysadmin.users.detail.role_member", "Member"),
								},
								{
									value: "admin",
									label: t("sysadmin.users.role_admin", "Admin"),
								},
							]}
							value={role}
							onValueChange={(v) => setRole(v as "admin" | "member")}
							placeholder={t(
								"sysadmin.users.detail.select_role",
								"Select role",
							)}
						/>
					</div>
					{add.error && (
						<p className="text-destructive text-sm">{add.error.message}</p>
					)}
				</div>
				<div className="flex justify-end gap-2 pt-2">
					<Button variant="ghost" onClick={onClose}>
						{t("cancel", "Cancel")}
					</Button>
					<Button
						disabled={!institution || add.isPending}
						onClick={() =>
							institution &&
							add.mutate({ institutionId: institution.id, userId, role })
						}
					>
						{add.isPending
							? t("sysadmin.users.detail.adding", "Adding…")
							: t("sysadmin.users.detail.add_btn", "Add")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

export function UserProfileTab() {
	const { id } = useParams<{ id: string }>();
	const { t, i18n } = useTranslation();
	const { data, isLoading } = trpc.systemAdmin.getUser.useQuery(
		{ userId: id! },
		{ enabled: !!id },
	);

	if (isLoading) {
		return (
			<div className="space-y-3">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<Skeleton key={i} className="h-10 rounded-xl" />
				))}
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
				<p className="text-sm">
					{t("sysadmin.users.detail.not_found", "User not found.")}
				</p>
			</div>
		);
	}

	return (
		<div className="divide-y divide-border rounded-xl border border-border bg-card px-5">
			<DetailRow
				label={t("sysadmin.users.detail.field_name", "Name")}
				value={data.name}
			/>
			<DetailRow
				label={t("sysadmin.users.detail.field_email", "Email")}
				value={data.email}
			/>
			<DetailRow
				label={t(
					"sysadmin.users.detail.field_email_verified",
					"Email verified",
				)}
				value={
					data.emailVerified ? (
						<span className="text-emerald-600 text-xs">
							{t("sysadmin.users.detail.field_email_verified_yes", "Yes")}
						</span>
					) : (
						<span className="text-amber-600 text-xs">
							{t("sysadmin.users.detail.field_email_verified_no", "No")}
						</span>
					)
				}
			/>
			<DetailRow
				label={t("sysadmin.users.detail.field_platform_role", "Platform role")}
				value={
					data.role === "admin" ? (
						<span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
							{t("sysadmin.users.role_admin", "Admin")}
						</span>
					) : (
						<span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
							{t("sysadmin.users.role_user", "User")}
						</span>
					)
				}
			/>
			<DetailRow
				label={t("sysadmin.users.detail.field_status", "Status")}
				value={
					data.banned ? (
						<>
							<span className="rounded-full bg-rose-500/10 px-2 py-0.5 font-medium text-rose-600 text-xs">
								{t("sysadmin.users.detail.badge_banned", "Banned")}
							</span>
							{data.banReason && (
								<span className="ml-2 text-muted-foreground text-xs">
									{data.banReason}
								</span>
							)}
						</>
					) : (
						<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs">
							{t("sysadmin.users.status_active", "Active")}
						</span>
					)
				}
			/>
			{data.banExpires && (
				<DetailRow
					label={t("sysadmin.users.detail.field_ban_expires", "Ban expires")}
					value={formatDate(data.banExpires, i18n.language)}
				/>
			)}
			<DetailRow
				label={t(
					"sysadmin.users.detail.field_active_sessions",
					"Active sessions",
				)}
				value={
					<span
						className={
							data.sessionCount > 0
								? "text-foreground"
								: "text-muted-foreground"
						}
					>
						{data.sessionCount}
					</span>
				}
			/>
			<DetailRow
				label={t("sysadmin.users.detail.field_institutions", "Institutions")}
				value={data.memberships.length}
			/>
			<DetailRow
				label={t("sysadmin.users.detail.field_last_seen", "Last seen")}
				value={formatDate(data.lastSeenAt, i18n.language)}
			/>
			<DetailRow
				label={t("sysadmin.users.detail.field_joined", "Joined")}
				value={formatDate(data.createdAt, i18n.language)}
			/>
		</div>
	);
}

// ─── Memberships tab ──────────────────────────────────────────────────────────

export function UserMembershipsTab() {
	const { id } = useParams<{ id: string }>();
	const { t, i18n } = useTranslation();
	const [showAdd, setShowAdd] = useState(false);
	const [confirmRemove, setConfirmRemove] = useState<Membership | null>(null);

	const { data, isLoading, refetch } = trpc.systemAdmin.getUser.useQuery(
		{ userId: id! },
		{ enabled: !!id },
	);

	const removeMember = trpc.systemAdmin.removeMember.useMutation({
		onSuccess: () => {
			refetch();
			setConfirmRemove(null);
		},
	});
	const updateRole = trpc.systemAdmin.updateMemberRole.useMutation({
		onSuccess: () => refetch(),
	});

	const rows = data?.memberships ?? [];

	const columns: ColumnDef<Membership>[] = [
		{
			id: "institution",
			header: t("sysadmin.users.detail.col_institution", "Institution"),
			cell: ({ row }) => (
				<span className="font-medium text-foreground">
					{row.original.institutionName ?? "—"}
				</span>
			),
		},
		{
			id: "type",
			header: t("sysadmin.users.detail.col_type", "Type"),
			cell: ({ row }) => {
				const typeLabels: Record<string, string> = {
					lycee: t("sysadmin.institutions.type_lycee", "Lycée"),
					college: t("sysadmin.institutions.type_college", "Collège"),
					mixed: t("sysadmin.users.detail.type_mixed", "Mixed"),
				};
				const instType = row.original.institutionType;
				return (
					<span className="text-muted-foreground text-sm">
						{instType ? (typeLabels[instType] ?? instType) : "—"}
					</span>
				);
			},
		},
		{
			id: "status",
			header: t("sysadmin.users.detail.col_status", "Status"),
			cell: ({ row }) =>
				row.original.institutionSuspended ? (
					<span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-600 text-xs">
						{t("sysadmin.institutions.status_suspended", "Suspended")}
					</span>
				) : (
					<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs">
						{t("sysadmin.institutions.status_active", "Active")}
					</span>
				),
		},
		{
			id: "orgRole",
			header: t("sysadmin.users.detail.col_role", "Role"),
			cell: ({ row }) => (
				<span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs capitalize">
					{row.original.orgRole}
				</span>
			),
		},
		{
			id: "joinedAt",
			header: t("sysadmin.users.detail.col_joined", "Joined"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{formatDate(row.original.joinedAt, i18n.language)}
				</span>
			),
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => {
				const m = row.original;
				if (!m.institutionId) return null;
				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>
								{t("sysadmin.users.detail.actions", "Actions")}
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{m.orgRole === "admin" ? (
								<DropdownMenuItem
									onSelect={() =>
										id &&
										updateRole.mutate({
											institutionId: m.institutionId!,
											userId: id,
											role: "member",
										})
									}
								>
									{t("sysadmin.users.detail.set_as_member", "Set as Member")}
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem
									onSelect={() =>
										id &&
										updateRole.mutate({
											institutionId: m.institutionId!,
											userId: id,
											role: "admin",
										})
									}
								>
									{t("sysadmin.users.detail.set_as_admin", "Set as Admin")}
								</DropdownMenuItem>
							)}
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-rose-600 focus:text-rose-600"
								onSelect={() => setConfirmRemove(m)}
							>
								{t(
									"sysadmin.users.detail.remove_from_institution",
									"Remove from institution",
								)}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button size="sm" onClick={() => setShowAdd(true)}>
					<Plus className="mr-1.5 h-4 w-4" />
					{t("sysadmin.users.detail.add_to_institution", "Add to institution")}
				</Button>
			</div>

			{rows.length === 0 && !isLoading ? (
				<div className="flex flex-col items-center gap-2 rounded-xl border border-border py-16 text-muted-foreground">
					<Building2 className="h-8 w-8 opacity-20" />
					<p className="text-sm">
						{t(
							"sysadmin.users.detail.no_memberships",
							"No institution memberships.",
						)}
					</p>
				</div>
			) : (
				<DataTable
					columns={columns}
					data={rows}
					total={rows.length}
					page={1}
					pageSize={rows.length || 10}
					isLoading={isLoading}
					emptyMessage={t(
						"sysadmin.users.detail.no_memberships_yet",
						"No memberships yet.",
					)}
					onPageChange={() => {}}
					onPageSizeChange={() => {}}
				/>
			)}

			{id && (
				<AddToInstitutionDialog
					userId={id}
					open={showAdd}
					onClose={() => setShowAdd(false)}
					onDone={() => refetch()}
				/>
			)}

			<Dialog
				open={!!confirmRemove}
				onOpenChange={(v) => !v && setConfirmRemove(null)}
			>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>
							{t(
								"sysadmin.users.detail.remove_confirm_title",
								"Remove from institution?",
							)}
						</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						{t(
							"sysadmin.users.detail.remove_confirm_desc",
							"This user will lose access to {{name}} immediately.",
							{ name: confirmRemove?.institutionName },
						)}
					</p>
					<div className="flex justify-end gap-2 pt-2">
						<Button variant="ghost" onClick={() => setConfirmRemove(null)}>
							{t("cancel", "Cancel")}
						</Button>
						<Button
							variant="destructive"
							disabled={removeMember.isPending}
							onClick={() =>
								id &&
								confirmRemove?.institutionId &&
								removeMember.mutate({
									institutionId: confirmRemove.institutionId,
									userId: id,
								})
							}
						>
							{removeMember.isPending
								? t("sysadmin.users.detail.removing", "Removing…")
								: t("sysadmin.users.detail.remove_btn", "Remove")}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ─── Detail shell with action dropdown ────────────────────────────────────────

export function SysAdminUserDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const utils = trpc.useUtils();
	const { t } = useTranslation();

	const { data, isLoading, refetch } = trpc.systemAdmin.getUser.useQuery(
		{ userId: id! },
		{ enabled: !!id },
	);

	useBreadcrumbs([
		{ label: t("sysadmin.nav.users", "Users"), href: "/sysadmin/users" },
		{ label: data?.name ?? "…" },
	]);

	const [showBan, setShowBan] = useState(false);
	const [showSetPassword, setShowSetPassword] = useState(false);
	const [showUpdateUser, setShowUpdateUser] = useState(false);
	const [confirmRevokeSessions, setConfirmRevokeSessions] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);

	const [unbanPending, setUnbanPending] = useState(false);
	const [rolePending, setRolePending] = useState(false);
	const [revokePending, setRevokePending] = useState(false);
	const [deletePending, setDeletePending] = useState(false);

	const sendPasswordReset = trpc.systemAdmin.sendPasswordReset.useMutation();

	const handleUnban = async () => {
		if (!id) return;
		setUnbanPending(true);
		const res = await authClient.admin.unbanUser({ userId: id });
		setUnbanPending(false);
		if (!res.error) refetch();
	};

	const handleToggleRole = async () => {
		if (!id || !data) return;
		setRolePending(true);
		const newRole = data.role === "admin" ? "user" : "admin";
		const res = await authClient.admin.setRole({ userId: id, role: newRole });
		setRolePending(false);
		if (!res.error) refetch();
	};

	const handleRevokeSessions = async () => {
		if (!id) return;
		setRevokePending(true);
		const res = await authClient.admin.revokeUserSessions({ userId: id });
		setRevokePending(false);
		if (!res.error) {
			refetch();
			setConfirmRevokeSessions(false);
		}
	};

	const handleDelete = async () => {
		if (!id) return;
		setDeletePending(true);
		const res = await authClient.admin.removeUser({ userId: id });
		setDeletePending(false);
		if (!res.error) navigate("/sysadmin/users");
	};

	const TABS = [
		{
			to: `/sysadmin/users/${id}/profile`,
			label: t("sysadmin.users.detail.tab_profile", "Profile"),
		},
		{
			to: `/sysadmin/users/${id}/memberships`,
			label: t("sysadmin.users.detail.tab_memberships", "Memberships"),
		},
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					{isLoading ? (
						<>
							<Skeleton className="h-7 w-48" />
							<Skeleton className="mt-1 h-4 w-64" />
						</>
					) : (
						<>
							<div className="flex items-center gap-2">
								<h1 className="font-bold text-2xl text-foreground">
									{data?.name ?? t("sysadmin.nav.users", "User")}
								</h1>
								{data?.banned && (
									<span className="rounded-full bg-rose-500/10 px-2 py-0.5 font-medium text-rose-600 text-xs">
										{t("sysadmin.users.detail.badge_banned", "Banned")}
									</span>
								)}
								{data?.role === "admin" && (
									<span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
										{t(
											"sysadmin.users.detail.badge_platform_admin",
											"Platform Admin",
										)}
									</span>
								)}
							</div>
							<p className="text-muted-foreground text-sm">
								{data?.email ?? ""}
							</p>
						</>
					)}
				</div>

				{/* Actions dropdown */}
				{data && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<MoreHorizontal className="mr-1.5 h-4 w-4" />
								{t("sysadmin.users.detail.actions", "Actions")}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-52">
							<DropdownMenuItem onSelect={() => setShowUpdateUser(true)}>
								<Pencil className="mr-2 h-4 w-4" />
								{t("sysadmin.users.detail.edit_info", "Edit name / info")}
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => setShowSetPassword(true)}>
								<KeyRound className="mr-2 h-4 w-4" />
								{t(
									"sysadmin.users.detail.set_password_title",
									"Set new password",
								)}
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={sendPasswordReset.isPending}
								onSelect={() => sendPasswordReset.mutate({ userId: data.id })}
							>
								<Mail className="mr-2 h-4 w-4" />
								{t(
									"sysadmin.users.detail.send_reset_email",
									"Send password reset email",
								)}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							{data.role === "admin" ? (
								<DropdownMenuItem
									disabled={rolePending}
									onSelect={handleToggleRole}
								>
									<ShieldOff className="mr-2 h-4 w-4" />
									{rolePending
										? t("sysadmin.users.saving", "Saving…")
										: t(
												"sysadmin.users.detail.revoke_admin_action",
												"Revoke platform admin",
											)}
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem
									disabled={rolePending}
									onSelect={handleToggleRole}
								>
									<Shield className="mr-2 h-4 w-4" />
									{rolePending
										? t("sysadmin.users.saving", "Saving…")
										: t(
												"sysadmin.users.detail.grant_admin_action",
												"Grant platform admin",
											)}
								</DropdownMenuItem>
							)}
							<DropdownMenuSeparator />
							{data.banned ? (
								<DropdownMenuItem
									disabled={unbanPending}
									onSelect={handleUnban}
								>
									<UserCheck className="mr-2 h-4 w-4" />
									{unbanPending
										? t("sysadmin.users.detail.unbanning", "Unbanning…")
										: t("sysadmin.users.unban_user", "Unban user")}
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem onSelect={() => setShowBan(true)}>
									<UserX className="mr-2 h-4 w-4" />
									{t("sysadmin.users.detail.ban_action", "Ban user")}
								</DropdownMenuItem>
							)}
							<DropdownMenuItem onSelect={() => setConfirmRevokeSessions(true)}>
								<LogOut className="mr-2 h-4 w-4" />
								{t(
									"sysadmin.users.detail.revoke_sessions",
									"Revoke all sessions",
								)}
								{(data.sessionCount ?? 0) > 0 && (
									<span className="ml-auto rounded-full bg-muted px-1.5 text-xs">
										{data.sessionCount}
									</span>
								)}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onSelect={() => setConfirmDelete(true)}
								className="text-rose-600 focus:text-rose-600"
							>
								<Trash2 className="mr-2 h-4 w-4" />
								{t(
									"sysadmin.users.detail.delete_permanently_action",
									"Delete user permanently",
								)}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			{/* Tabs */}
			<div className="flex border-border border-b" role="tablist">
				{TABS.map(({ to, label }) => (
					<NavLink
						key={to}
						to={to}
						className={({ isActive }) =>
							cn(
								"inline-flex items-center justify-center whitespace-nowrap px-4 py-2 font-medium text-sm transition-colors",
								"-mb-px border-b-2 focus-visible:outline-none",
								isActive
									? "border-primary text-foreground"
									: "border-transparent text-muted-foreground hover:text-foreground",
							)
						}
					>
						{label}
					</NavLink>
				))}
			</div>

			<Outlet />

			{/* Dialogs */}
			<BanDialog
				open={showBan}
				user={data ?? null}
				onClose={() => setShowBan(false)}
				onDone={() => refetch()}
			/>

			{data && (
				<SetPasswordDialog
					open={showSetPassword}
					userId={data.id}
					onClose={() => setShowSetPassword(false)}
					onDone={() => {}}
				/>
			)}

			{data && (
				<UpdateUserDialog
					open={showUpdateUser}
					user={data}
					onClose={() => setShowUpdateUser(false)}
					onDone={() => {
						refetch();
						utils.systemAdmin.listUsers.invalidate();
					}}
				/>
			)}

			<Dialog
				open={confirmRevokeSessions}
				onOpenChange={(v) => !v && setConfirmRevokeSessions(false)}
			>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>
							{t(
								"sysadmin.users.detail.revoke_sessions_title",
								"Revoke all sessions?",
							)}
						</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						{t(
							"sysadmin.users.detail.revoke_sessions_desc",
							"{{name}} will be signed out from all devices immediately.",
							{ name: data?.name },
						)}
					</p>
					<div className="flex justify-end gap-2 pt-2">
						<Button
							variant="ghost"
							onClick={() => setConfirmRevokeSessions(false)}
						>
							{t("cancel", "Cancel")}
						</Button>
						<Button
							variant="destructive"
							disabled={revokePending}
							onClick={handleRevokeSessions}
						>
							{revokePending
								? t("sysadmin.users.detail.revoking", "Revoking…")
								: t(
										"sysadmin.users.detail.revoke_sessions_btn",
										"Revoke all sessions",
									)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={confirmDelete}
				onOpenChange={(v) => !v && setConfirmDelete(false)}
			>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>
							{t(
								"sysadmin.users.detail.delete_title",
								"Delete user permanently?",
							)}
						</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						{t(
							"sysadmin.users.detail.delete_desc",
							"This will permanently delete {{name}} along with all their sessions, accounts, and memberships. Cannot be undone.",
							{ name: data?.name },
						)}
					</p>
					<div className="flex justify-end gap-2 pt-2">
						<Button variant="ghost" onClick={() => setConfirmDelete(false)}>
							{t("cancel", "Cancel")}
						</Button>
						<Button
							variant="destructive"
							disabled={deletePending}
							onClick={handleDelete}
						>
							{deletePending
								? t("sysadmin.users.detail.deleting", "Deleting…")
								: t("sysadmin.users.detail.delete_btn", "Delete permanently")}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

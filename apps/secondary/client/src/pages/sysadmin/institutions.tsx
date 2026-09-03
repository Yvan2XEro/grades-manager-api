import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
	Building2,
	MoreHorizontal,
	Plus,
	Search,
	UserSearch,
} from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { cn } from "@/lib/utils";
import { type RouterOutputs, trpc } from "@/utils/trpc";

type Institution =
	RouterOutputs["systemAdmin"]["listInstitutions"]["rows"][number];

const TYPE_COLORS: Record<string, string> = {
	lycee: "bg-blue-500/10 text-blue-600",
	college: "bg-violet-500/10 text-violet-600",
	mixed: "bg-amber-500/10 text-amber-600",
};

function formatDate(d: string | Date | null, locale: string) {
	if (!d) return "—";
	return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(new Date(d));
}

// ─── User search field ────────────────────────────────────────────────────────

function UserSearchField({
	value,
	onSelect,
}: {
	value: { id: string; name: string } | null;
	onSelect: (u: { id: string; name: string } | null) => void;
}) {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const { data } = trpc.systemAdmin.listUsers.useQuery(
		{ search: search || undefined, pageSize: 8, page: 1 },
		{ enabled: search.length >= 2 },
	);

	return (
		<div className="space-y-1.5">
			<Label>
				{t("sysadmin.institutions.field_owner", "Owner admin (optional)")}
			</Label>
			{value ? (
				<div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
					<div>
						<p className="font-medium text-sm">{value.name}</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => onSelect(null)}
						className="h-6 px-2 text-muted-foreground text-xs"
					>
						{t("sysadmin.institutions.change", "Change")}
					</Button>
				</div>
			) : (
				<div className="relative">
					<UserSearch className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t(
							"sysadmin.institutions.search_users",
							"Search users by name or email…",
						)}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
					{search.length >= 2 && data && data.rows.length > 0 && (
						<div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-md">
							{data.rows.map((u) => (
								<button
									key={u.id}
									type="button"
									className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted/60"
									onClick={() => {
										onSelect({ id: u.id, name: u.name });
										setSearch("");
									}}
								>
									<span className="font-medium">{u.name}</span>
									<span className="text-muted-foreground text-xs">
										{u.email}
									</span>
								</button>
							))}
						</div>
					)}
					{search.length >= 2 && data?.rows.length === 0 && (
						<div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover px-3 py-2 text-muted-foreground text-sm shadow-md">
							{t("sysadmin.users.no_users", "No users found")}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ─── Create dialog ─────────────────────────────────────────────────────────────

function CreateInstitutionDialog({
	open,
	onClose,
	onCreated,
}: {
	open: boolean;
	onClose: () => void;
	onCreated: () => void;
}) {
	const { t } = useTranslation();
	const [name, setName] = useState("");
	const [type, setType] = useState<"lycee" | "college" | "mixed">("lycee");
	const [city, setCity] = useState("");
	const [minesecCode, setMinesecCode] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [address, setAddress] = useState("");
	const [owner, setOwner] = useState<{ id: string; name: string } | null>(null);

	const typeLabels: Record<string, string> = {
		lycee: t("sysadmin.institutions.type_lycee", "Lycée"),
		college: t("sysadmin.institutions.type_college", "Collège"),
		mixed: t("sysadmin.institutions.type_mixed", "Mixed"),
	};

	const create = trpc.systemAdmin.createInstitution.useMutation({
		onSuccess: () => {
			setName("");
			setType("lycee");
			setCity("");
			setMinesecCode("");
			setPhone("");
			setEmail("");
			setAddress("");
			setOwner(null);
			onClose();
			// defer refetch so Radix scroll-lock cleanup runs before re-render
			setTimeout(() => onCreated(), 0);
		},
	});

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{t("sysadmin.institutions.new_title", "New Institution")}
					</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						if (!name.trim()) return;
						create.mutate({
							name: name.trim(),
							type,
							city: city.trim() || undefined,
							minesecCode: minesecCode.trim() || undefined,
							phone: phone.trim() || undefined,
							email: email.trim() || undefined,
							address: address.trim() || undefined,
							ownerUserId: owner?.id,
						});
					}}
					className="space-y-4 pt-1"
				>
					<div className="space-y-1.5">
						<Label htmlFor="inst-name">
							{t("sysadmin.institutions.name_required", "Name *")}
						</Label>
						<Input
							id="inst-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Lycée de la Réussite"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label>{t("sysadmin.institutions.field_type", "Type")}</Label>
						<RadioGroup
							value={type}
							onValueChange={(v) => setType(v as typeof type)}
							className="flex gap-3"
						>
							{(["lycee", "college", "mixed"] as const).map((t_) => (
								<label
									key={t_}
									className={cn(
										"flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
										type === t_
											? "border-primary bg-primary/5 text-foreground"
											: "border-border text-muted-foreground hover:bg-muted/40",
									)}
								>
									<RadioGroupItem value={t_} id={`type-${t_}`} />
									{typeLabels[t_]}
								</label>
							))}
						</RadioGroup>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="inst-city">
								{t("sysadmin.institutions.field_city", "City")}
							</Label>
							<Input
								id="inst-city"
								value={city}
								onChange={(e) => setCity(e.target.value)}
								placeholder="Yaoundé"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="inst-code">
								{t("sysadmin.institutions.field_minesec_code", "MINESEC code")}
							</Label>
							<Input
								id="inst-code"
								value={minesecCode}
								onChange={(e) => setMinesecCode(e.target.value)}
								placeholder="CM-CE-001"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="inst-phone">
								{t("sysadmin.institutions.field_phone", "Phone")}
							</Label>
							<Input
								id="inst-phone"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+237 600 000 000"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="inst-email">
								{t(
									"sysadmin.institutions.field_contact_email",
									"Contact email",
								)}
							</Label>
							<Input
								id="inst-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="direction@school.cm"
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="inst-address">
							{t("sysadmin.institutions.field_address", "Address")}
						</Label>
						<Input
							id="inst-address"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							placeholder="Quartier, Rue…"
						/>
					</div>

					<UserSearchField value={owner} onSelect={setOwner} />

					{create.error && (
						<p className="text-destructive text-sm">{create.error.message}</p>
					)}

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="ghost" onClick={onClose}>
							{t("cancel", "Cancel")}
						</Button>
						<Button type="submit" disabled={create.isPending || !name.trim()}>
							{create.isPending
								? t("sysadmin.institutions.creating", "Creating…")
								: t("sysadmin.institutions.create_btn", "Create institution")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ─── Row actions ──────────────────────────────────────────────────────────────

function RowActions({
	institution,
	onSuspend,
	onActivate,
	onDelete,
}: {
	institution: Institution;
	onSuspend: (inst: { id: string; name: string }) => void;
	onActivate: (id: string) => void;
	onDelete: (inst: { id: string; name: string }) => void;
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
					<Link to={`/sysadmin/institutions/${institution.id}`}>
						{t("sysadmin.institutions.view_details", "View details")}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{institution.suspended ? (
					<DropdownMenuItem
						className="text-emerald-600 focus:text-emerald-600"
						onSelect={() => onActivate(institution.id)}
					>
						{t("sysadmin.institutions.reactivate", "Reactivate")}
					</DropdownMenuItem>
				) : (
					<DropdownMenuItem
						className="text-amber-600 focus:text-amber-600"
						onSelect={() =>
							onSuspend({ id: institution.id, name: institution.name })
						}
					>
						{t("sysadmin.institutions.suspend", "Suspend")}
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-rose-600 focus:text-rose-600"
					onSelect={() =>
						onDelete({ id: institution.id, name: institution.name })
					}
				>
					{t("sysadmin.institutions.delete_institution", "Delete institution")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function SysAdminInstitutions() {
	const { t, i18n } = useTranslation();
	useBreadcrumbs([{ label: t("sysadmin.nav.institutions", "Institutions") }]);
	const [{ page, pageSize, search, type, status, sortBy, sortDir }, setQuery] =
		useQueryStates({
			page: parseAsInteger.withDefault(1),
			pageSize: parseAsInteger.withDefault(20),
			search: parseAsString.withDefault(""),
			type: parseAsString.withDefault(""),
			status: parseAsString.withDefault(""),
			sortBy: parseAsString.withDefault("createdAt"),
			sortDir: parseAsString.withDefault("desc"),
		});

	const [showCreate, setShowCreate] = useState(false);
	const [suspendTarget, setSuspendTarget] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		name: string;
	} | null>(null);

	const sorting: SortingState = sortBy
		? [{ id: sortBy, desc: sortDir === "desc" }]
		: [];

	const { data, isLoading, refetch } =
		trpc.systemAdmin.listInstitutions.useQuery({
			page,
			pageSize,
			search: search || undefined,
			type: (type as "lycee" | "college" | "mixed") || undefined,
			status: (status as "active" | "suspended") || undefined,
			sortBy: (sortBy as "name" | "city" | "type" | "createdAt") || undefined,
			sortDir: (sortDir as "asc" | "desc") || undefined,
		});

	const suspend = trpc.systemAdmin.suspendInstitution.useMutation({
		onSuccess: () => {
			setSuspendTarget(null);
			setTimeout(() => refetch(), 0);
		},
	});
	const activate = trpc.systemAdmin.activateInstitution.useMutation({
		onSuccess: () => refetch(),
	});
	const deleteInst = trpc.systemAdmin.deleteInstitution.useMutation({
		onSuccess: () => {
			setDeleteTarget(null);
			setTimeout(() => refetch(), 0);
		},
	});

	const rows = data?.rows ?? [];
	const total = data?.total ?? 0;

	const typeLabels: Record<string, string> = {
		lycee: t("sysadmin.institutions.type_lycee", "Lycée"),
		college: t("sysadmin.institutions.type_college", "Collège"),
		mixed: t("sysadmin.institutions.type_mixed", "Mixed"),
	};

	const columns: ColumnDef<Institution>[] = [
		{
			id: "name",
			accessorKey: "name",
			enableSorting: true,
			header: t("sysadmin.institutions.col_name", "Name"),
			cell: ({ row }) => (
				<div className="flex items-center gap-2.5">
					{row.original.logoUrl ? (
						<img
							src={row.original.logoUrl}
							alt=""
							className="h-7 w-7 flex-shrink-0 rounded-md border border-border object-cover"
						/>
					) : (
						<div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-border bg-muted font-bold text-muted-foreground text-xs">
							{row.original.name.slice(0, 1).toUpperCase()}
						</div>
					)}
					<Link
						to={`/sysadmin/institutions/${row.original.id}`}
						className="font-medium text-foreground hover:text-primary hover:underline"
					>
						{row.original.name}
					</Link>
				</div>
			),
		},
		{
			id: "type",
			accessorKey: "type",
			enableSorting: true,
			header: t("sysadmin.institutions.col_type", "Type"),
			cell: ({ row }) => (
				<span
					className={`rounded-full px-2 py-0.5 font-medium text-xs ${TYPE_COLORS[row.original.type] ?? "bg-muted text-muted-foreground"}`}
				>
					{typeLabels[row.original.type] ?? row.original.type}
				</span>
			),
		},
		{
			id: "city",
			accessorKey: "city",
			enableSorting: true,
			header: t("sysadmin.institutions.col_city", "City"),
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.city ?? "—"}
				</span>
			),
		},
		{
			id: "minesecCode",
			header: t("sysadmin.institutions.col_minesec", "MINESEC"),
			cell: ({ row }) => (
				<span className="font-mono text-muted-foreground text-xs">
					{row.original.minesecCode ?? "—"}
				</span>
			),
		},
		{
			id: "members",
			header: t("sysadmin.institutions.col_members", "Members"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.memberCount ?? 0}
				</span>
			),
		},
		{
			id: "stats",
			header: t("sysadmin.institutions.col_students_staff", "Students / Staff"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.studentCount ?? 0} / {row.original.staffCount ?? 0}
				</span>
			),
		},
		{
			id: "status",
			header: t("sysadmin.institutions.col_status", "Status"),
			cell: ({ row }) =>
				row.original.suspended ? (
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
			id: "createdAt",
			accessorKey: "createdAt",
			enableSorting: true,
			header: t("sysadmin.institutions.col_created", "Created"),
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
					institution={row.original}
					onSuspend={setSuspendTarget}
					onActivate={(id) => activate.mutate({ id })}
					onDelete={setDeleteTarget}
				/>
			),
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("sysadmin.institutions.title", "Institutions")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t(
							"sysadmin.institutions.subtitle_other",
							"{{count}} institutions on the platform",
							{ count: total },
						)}
					</p>
				</div>
				<Button onClick={() => setShowCreate(true)}>
					<Plus className="mr-1.5 h-4 w-4" />
					{t("sysadmin.institutions.new_institution", "New Institution")}
				</Button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1" style={{ minWidth: 220 }}>
					<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t(
							"sysadmin.institutions.search_placeholder",
							"Search by name…",
						)}
						value={search}
						onChange={(e) => setQuery({ search: e.target.value, page: 1 })}
						className="pl-9"
					/>
				</div>
				<div className="w-40">
					<Combobox
						options={[
							{
								value: "",
								label: t("sysadmin.institutions.all_types", "All types"),
							},
							{
								value: "lycee",
								label: t("sysadmin.institutions.type_lycee", "Lycée"),
							},
							{
								value: "college",
								label: t("sysadmin.institutions.type_college", "Collège"),
							},
							{
								value: "mixed",
								label: t("sysadmin.institutions.type_mixed", "Mixed"),
							},
						]}
						value={type}
						onValueChange={(v) => setQuery({ type: v, page: 1 })}
						placeholder={t("sysadmin.institutions.all_types", "All types")}
					/>
				</div>
				<div className="w-40">
					<Combobox
						options={[
							{
								value: "",
								label: t("sysadmin.institutions.all_statuses", "All statuses"),
							},
							{
								value: "active",
								label: t("sysadmin.institutions.status_active", "Active"),
							},
							{
								value: "suspended",
								label: t("sysadmin.institutions.status_suspended", "Suspended"),
							},
						]}
						value={status}
						onValueChange={(v) => setQuery({ status: v, page: 1 })}
						placeholder={t(
							"sysadmin.institutions.all_statuses",
							"All statuses",
						)}
					/>
				</div>
			</div>

			{rows.length === 0 && !isLoading && !search && !type && !status ? (
				<div className="flex flex-col items-center gap-2 rounded-xl border border-border py-16 text-muted-foreground">
					<Building2 className="h-8 w-8 opacity-20" />
					<p className="text-sm">
						{t("sysadmin.institutions.no_institutions", "No institutions yet.")}
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowCreate(true)}
					>
						{t("sysadmin.institutions.create_first", "Create the first one")}
					</Button>
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
						search || type || status
							? t(
									"sysadmin.institutions.empty_filter",
									"No institutions match your filters",
								)
							: t(
									"sysadmin.institutions.no_institutions",
									"No institutions yet.",
								)
					}
					onPageChange={(p) => setQuery({ page: p })}
					onPageSizeChange={(s) => setQuery({ pageSize: s, page: 1 })}
				/>
			)}

			<CreateInstitutionDialog
				open={showCreate}
				onClose={() => setShowCreate(false)}
				onCreated={() => refetch()}
			/>

			{/* Suspend confirm */}
			<Dialog
				open={!!suspendTarget}
				onOpenChange={(v) => !v && setSuspendTarget(null)}
			>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>
							{t("sysadmin.institutions.suspend_title", "Suspend institution?")}
						</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						{t(
							"sysadmin.institutions.suspend_desc",
							"{{name}} will be suspended. Users cannot access it until reactivated.",
							{ name: suspendTarget?.name },
						)}
					</p>
					<div className="flex justify-end gap-2 pt-2">
						<Button variant="ghost" onClick={() => setSuspendTarget(null)}>
							{t("cancel", "Cancel")}
						</Button>
						<Button
							className="bg-amber-600 text-white hover:bg-amber-700"
							disabled={suspend.isPending}
							onClick={() =>
								suspendTarget && suspend.mutate({ id: suspendTarget.id })
							}
						>
							{suspend.isPending
								? t("sysadmin.institutions.suspending", "Suspending…")
								: t("sysadmin.institutions.suspend_btn", "Suspend")}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
			<Dialog
				open={!!deleteTarget}
				onOpenChange={(v) => !v && setDeleteTarget(null)}
			>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>
							{t("sysadmin.institutions.delete_title", "Delete institution?")}
						</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						{t(
							"sysadmin.institutions.delete_desc",
							"This will permanently delete {{name}} and all its academic data. This cannot be undone.",
							{ name: deleteTarget?.name },
						)}
					</p>
					<div className="flex justify-end gap-2 pt-2">
						<Button variant="ghost" onClick={() => setDeleteTarget(null)}>
							{t("cancel", "Cancel")}
						</Button>
						<Button
							variant="destructive"
							disabled={deleteInst.isPending}
							onClick={() =>
								deleteTarget && deleteInst.mutate({ id: deleteTarget.id })
							}
						>
							{deleteInst.isPending
								? t("sysadmin.institutions.deleting", "Deleting…")
								: t(
										"sysadmin.institutions.delete_permanently",
										"Delete permanently",
									)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
	BookOpen,
	Building2,
	Calendar,
	GraduationCap,
	ImagePlus,
	Loader2,
	MoreHorizontal,
	MoreVertical,
	PauseCircle,
	Pencil,
	PlayCircle,
	Plus,
	Trash2,
	UserSearch,
	Users,
} from "lucide-react";
import { parseAsInteger, useQueryStates } from "nuqs";
import { useState } from "react";
import { flushSync } from "react-dom";
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
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { cn } from "@/lib/utils";
import { type RouterOutputs, trpc } from "@/utils/trpc";

type Member =
	RouterOutputs["systemAdmin"]["listInstitutionMembers"]["rows"][number];
type AcademicYear =
	RouterOutputs["systemAdmin"]["listInstitutionAcademicYears"][number];

function formatDate(d: string | Date | null | undefined) {
	if (!d) return "—";
	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(new Date(d));
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
	label,
	value,
	icon,
	accent,
}: {
	label: string;
	value: number | string | undefined;
	icon: React.ReactNode;
	accent: string;
}) {
	return (
		<div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
			<div
				className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${accent}`}
			>
				{icon}
			</div>
			<div>
				<p className="text-muted-foreground text-xs">{label}</p>
				{value === undefined ? (
					<Skeleton className="mt-1 h-5 w-12" />
				) : (
					<p className="font-bold text-card-foreground text-lg leading-tight">
						{value}
					</p>
				)}
			</div>
		</div>
	);
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

// ─── User search inline ───────────────────────────────────────────────────────

function UserSearchField({
	value,
	onSelect,
}: {
	value: { id: string; name: string } | null;
	onSelect: (u: { id: string; name: string } | null) => void;
}) {
	const [search, setSearch] = useState("");
	const { data } = trpc.systemAdmin.listUsers.useQuery(
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
				Change
			</Button>
		</div>
	) : (
		<div className="relative">
			<UserSearch className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
			<Input
				placeholder="Search by name or email…"
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
							<span className="text-muted-foreground text-xs">{u.email}</span>
						</button>
					))}
				</div>
			)}
			{search.length >= 2 && data?.rows.length === 0 && (
				<div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover px-3 py-2 text-muted-foreground text-sm shadow-md">
					No users found
				</div>
			)}
		</div>
	);
}

// ─── Add member dialog ────────────────────────────────────────────────────────

function AddMemberDialog({
	institutionId,
	open,
	onClose,
	onDone,
}: {
	institutionId: string;
	open: boolean;
	onClose: () => void;
	onDone: () => void;
}) {
	const [user, setUser] = useState<{ id: string; name: string } | null>(null);
	const [role, setRole] = useState<"admin" | "member">("member");

	const add = trpc.systemAdmin.addMember.useMutation({
		onSuccess: () => {
			onDone();
			onClose();
			setUser(null);
			setRole("member");
		},
	});

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Add member</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label>User</Label>
						<UserSearchField value={user} onSelect={setUser} />
					</div>
					<div className="space-y-1.5">
						<Label>Role</Label>
						<Combobox
							options={[
								{ value: "member", label: "Member" },
								{ value: "admin", label: "Admin" },
							]}
							value={role}
							onValueChange={(v) => setRole(v as "admin" | "member")}
							placeholder="Select role"
						/>
					</div>
					{add.error && (
						<p className="text-destructive text-sm">{add.error.message}</p>
					)}
				</div>
				<div className="flex justify-end gap-2 pt-2">
					<Button variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button
						disabled={!user || add.isPending}
						onClick={() =>
							user && add.mutate({ institutionId, userId: user.id, role })
						}
					>
						{add.isPending ? "Adding…" : "Add member"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Upload helper ─────────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string> {
	const fd = new FormData();
	fd.append("file", file);
	const res = await fetch("/api/upload", {
		method: "POST",
		body: fd,
		credentials: "include",
	});
	if (!res.ok) throw new Error("Upload failed");
	const json = await res.json();
	return json.url as string;
}

// ─── Edit institution dialog ──────────────────────────────────────────────────

function EditInstitutionDialog({
	institution,
	open,
	onClose,
	onDone,
}: {
	institution: {
		id: string;
		name: string;
		type: string;
		city: string | null;
		minesecCode: string | null;
		phone: string | null;
		email: string | null;
		address: string | null;
		logoUrl: string | null;
		assessmentMode: string | null;
	};
	open: boolean;
	onClose: () => void;
	onDone: () => void;
}) {
	const [name, setName] = useState(institution.name);
	const [type, setType] = useState<"lycee" | "college" | "mixed">(
		institution.type as "lycee" | "college" | "mixed",
	);
	const [city, setCity] = useState(institution.city ?? "");
	const [minesecCode, setMinesecCode] = useState(institution.minesecCode ?? "");
	const [phone, setPhone] = useState(institution.phone ?? "");
	const [email, setEmail] = useState(institution.email ?? "");
	const [address, setAddress] = useState(institution.address ?? "");
	const [logoUrl, setLogoUrl] = useState(institution.logoUrl ?? "");
	const [uploading, setUploading] = useState(false);

	const update = trpc.systemAdmin.updateInstitution.useMutation({
		onSuccess: () => {
			onDone();
			onClose();
		},
	});

	const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		flushSync(() => setUploading(true));
		try {
			const url = await uploadFile(file);
			setLogoUrl(url);
		} catch {
			// keep existing
		} finally {
			setUploading(false);
		}
	};

	const TYPE_LABELS: Record<string, string> = {
		lycee: "Lycée",
		college: "Collège",
		mixed: "Mixed",
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Edit institution</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						update.mutate({
							id: institution.id,
							name: name.trim() || undefined,
							type,
							city: city.trim() || undefined,
							minesecCode: minesecCode.trim() || undefined,
							phone: phone.trim() || undefined,
							email: email.trim() || undefined,
							address: address.trim() || undefined,
							logoUrl: logoUrl || null,
						});
					}}
					className="space-y-4 pt-1"
				>
					{/* Logo upload */}
					<div className="space-y-2">
						<Label>Logo</Label>
						<div className="flex items-center gap-3">
							{logoUrl ? (
								<img
									src={logoUrl}
									alt="Logo"
									className="h-14 w-14 rounded-lg border border-border object-cover"
								/>
							) : (
								<div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-muted">
									<Building2 className="h-5 w-5 text-muted-foreground" />
								</div>
							)}
							<label
								className={`flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-foreground text-sm transition-colors hover:bg-muted/50 ${uploading ? "pointer-events-none opacity-60" : ""}`}
							>
								{uploading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<ImagePlus className="h-4 w-4" />
								)}
								{uploading ? "Uploading…" : "Change logo"}
								<input
									type="file"
									accept="image/*"
									className="sr-only"
									onChange={handleLogoChange}
									disabled={uploading}
								/>
							</label>
							{logoUrl && (
								<button
									type="button"
									onClick={() => setLogoUrl("")}
									className="text-muted-foreground text-xs hover:text-destructive"
								>
									Remove
								</button>
							)}
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="edit-name">Name</Label>
						<Input
							id="edit-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label>Type</Label>
						<div className="flex gap-2">
							{(["lycee", "college", "mixed"] as const).map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => setType(t)}
									className={`flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
										type === t
											? "border-primary bg-primary/5 text-foreground"
											: "border-border text-muted-foreground hover:bg-muted/40"
									}`}
								>
									{TYPE_LABELS[t]}
								</button>
							))}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="edit-city">City</Label>
							<Input
								id="edit-city"
								value={city}
								onChange={(e) => setCity(e.target.value)}
								placeholder="Yaoundé"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="edit-code">MINESEC code</Label>
							<Input
								id="edit-code"
								value={minesecCode}
								onChange={(e) => setMinesecCode(e.target.value)}
								placeholder="CM-CE-001"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="edit-phone">Phone</Label>
							<Input
								id="edit-phone"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+237 600 000 000"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="edit-email">Email</Label>
							<Input
								id="edit-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="direction@school.cm"
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="edit-address">Address</Label>
						<Input
							id="edit-address"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							placeholder="Quartier, Rue…"
						/>
					</div>

					{update.error && (
						<p className="text-destructive text-sm">{update.error.message}</p>
					)}

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="ghost" onClick={onClose}>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={update.isPending || uploading || !name.trim()}
						>
							{update.isPending ? "Saving…" : "Save changes"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

export function InstitutionOverviewTab() {
	const { id } = useParams<{ id: string }>();
	const { data, isLoading } = trpc.systemAdmin.getInstitution.useQuery(
		{ id: id! },
		{ enabled: !!id },
	);

	const TYPE_LABELS: Record<string, string> = {
		lycee: "Lycée",
		college: "Collège",
		mixed: "Mixed",
	};

	if (isLoading) {
		return (
			<div className="space-y-5">
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-20 rounded-xl" />
					))}
				</div>
				<Skeleton className="h-56 rounded-xl" />
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
				<Building2 className="h-8 w-8 opacity-20" />
				<p className="text-sm">Institution not found.</p>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			<p className="text-muted-foreground text-sm">
				{data.memberCount ?? 0} member{data.memberCount !== 1 ? "s" : ""}
			</p>

			{/* Stat cards */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<StatCard
					label="Students"
					value={data.studentCount ?? 0}
					icon={<GraduationCap className="h-4 w-4" />}
					accent="bg-blue-500/10 text-blue-600"
				/>
				<StatCard
					label="Staff"
					value={data.staffCount ?? 0}
					icon={<Users className="h-4 w-4" />}
					accent="bg-violet-500/10 text-violet-600"
				/>
				<StatCard
					label="Classes"
					value={data.classCount ?? 0}
					icon={<BookOpen className="h-4 w-4" />}
					accent="bg-amber-500/10 text-amber-600"
				/>
				<StatCard
					label="Academic years"
					value={data.academicYearCount ?? 0}
					icon={<Calendar className="h-4 w-4" />}
					accent="bg-emerald-500/10 text-emerald-600"
				/>
			</div>

			{/* Details */}
			<div className="divide-y divide-border rounded-xl border border-border bg-card px-5">
				<DetailRow label="Type" value={TYPE_LABELS[data.type] ?? data.type} />
				<DetailRow label="City" value={data.city ?? "—"} />
				<DetailRow label="Phone" value={data.phone ?? "—"} />
				<DetailRow label="Email" value={data.email ?? "—"} />
				<DetailRow label="Address" value={data.address ?? "—"} />
				<DetailRow label="MINESEC code" value={data.minesecCode ?? "—"} />
				<DetailRow label="Assessment mode" value={data.assessmentMode ?? "—"} />
				<DetailRow label="Org slug" value={data.orgSlug ?? "—"} />
				<DetailRow
					label="Status"
					value={
						data.suspended ? (
							<span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-600 text-xs">
								Suspended
							</span>
						) : (
							<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs">
								Active
							</span>
						)
					}
				/>
				<DetailRow
					label="Active year"
					value={
						data.hasActiveYear ? (
							<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs">
								Yes
							</span>
						) : (
							<span className="text-muted-foreground">No</span>
						)
					}
				/>
				<DetailRow label="Created" value={formatDate(data.createdAt)} />
			</div>
		</div>
	);
}

// ─── Members tab ──────────────────────────────────────────────────────────────

export function InstitutionMembersTab() {
	const { id } = useParams<{ id: string }>();
	const [showAdd, setShowAdd] = useState(false);
	const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);

	const [{ page, pageSize, sortBy, sortDir }, setQuery] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		pageSize: parseAsInteger.withDefault(20),
		sortBy: { parse: (v) => v, serialize: (v) => v, defaultValue: "joinedAt" },
		sortDir: { parse: (v) => v, serialize: (v) => v, defaultValue: "desc" },
	});

	const sorting: SortingState = [{ id: sortBy, desc: sortDir === "desc" }];

	const { data, isLoading, refetch } =
		trpc.systemAdmin.listInstitutionMembers.useQuery(
			{
				institutionId: id!,
				page,
				pageSize,
				sortBy: sortBy as "name" | "email" | "orgRole" | "joinedAt",
				sortDir: sortDir as "asc" | "desc",
			},
			{ enabled: !!id },
		);

	const updateRole = trpc.systemAdmin.updateMemberRole.useMutation({
		onSuccess: () => refetch(),
	});
	const remove = trpc.systemAdmin.removeMember.useMutation({
		onSuccess: () => {
			refetch();
			setConfirmRemove(null);
		},
	});

	const rows = data?.rows ?? [];
	const total = data?.total ?? 0;

	const columns: ColumnDef<Member>[] = [
		{
			id: "name",
			accessorKey: "name",
			enableSorting: true,
			header: "Name",
			cell: ({ row }) => (
				<span className="font-medium text-foreground">{row.original.name}</span>
			),
		},
		{
			id: "email",
			accessorKey: "email",
			enableSorting: true,
			header: "Email",
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.email}
				</span>
			),
		},
		{
			id: "orgRole",
			accessorKey: "orgRole",
			enableSorting: true,
			header: "Role",
			cell: ({ row }) => (
				<span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs capitalize">
					{row.original.orgRole}
				</span>
			),
		},
		{
			id: "joinedAt",
			accessorKey: "joinedAt",
			enableSorting: true,
			header: "Joined",
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{formatDate(row.original.joinedAt)}
				</span>
			),
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{row.original.orgRole === "admin" ? (
							<DropdownMenuItem
								onSelect={() =>
									updateRole.mutate({
										institutionId: id!,
										userId: row.original.userId,
										role: "member",
									})
								}
							>
								Set as Member
							</DropdownMenuItem>
						) : (
							<DropdownMenuItem
								onSelect={() =>
									updateRole.mutate({
										institutionId: id!,
										userId: row.original.userId,
										role: "admin",
									})
								}
							>
								Set as Admin
							</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-rose-600 focus:text-rose-600"
							onSelect={() => setConfirmRemove(row.original)}
						>
							Remove member
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button size="sm" onClick={() => setShowAdd(true)}>
					<Plus className="mr-1.5 h-4 w-4" />
					Add member
				</Button>
			</div>

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
						sortBy: col?.id ?? "joinedAt",
						sortDir: col?.desc ? "desc" : "asc",
						page: 1,
					});
				}}
				emptyMessage="No members — institution may have no linked organization."
				onPageChange={(p) => setQuery({ page: p })}
				onPageSizeChange={(s) => setQuery({ pageSize: s, page: 1 })}
			/>

			<AddMemberDialog
				institutionId={id!}
				open={showAdd}
				onClose={() => setShowAdd(false)}
				onDone={() => refetch()}
			/>

			<Dialog
				open={!!confirmRemove}
				onOpenChange={(v) => !v && setConfirmRemove(null)}
			>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Remove member?</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						<strong className="text-foreground">{confirmRemove?.name}</strong>{" "}
						will lose access to this institution immediately.
					</p>
					<div className="flex justify-end gap-2 pt-2">
						<Button variant="ghost" onClick={() => setConfirmRemove(null)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={remove.isPending}
							onClick={() =>
								confirmRemove &&
								remove.mutate({
									institutionId: id!,
									userId: confirmRemove.userId,
								})
							}
						>
							{remove.isPending ? "Removing…" : "Remove"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ─── Academic tab ─────────────────────────────────────────────────────────────

export function InstitutionAcademicTab() {
	const { id } = useParams<{ id: string }>();
	const { data, isLoading } =
		trpc.systemAdmin.listInstitutionAcademicYears.useQuery(
			{ institutionId: id! },
			{ enabled: !!id },
		);

	const rows = data ?? [];

	const columns: ColumnDef<AcademicYear>[] = [
		{
			id: "name",
			accessorKey: "name",
			enableSorting: true,
			header: "Year",
			cell: ({ row }) => (
				<span className="font-medium text-foreground">{row.original.name}</span>
			),
		},
		{
			id: "status",
			accessorKey: "status",
			enableSorting: true,
			header: "Status",
			cell: ({ row }) => {
				const s = row.original.status;
				const cls =
					s === "active"
						? "bg-emerald-500/10 text-emerald-600"
						: s === "closed"
							? "bg-muted text-muted-foreground"
							: "bg-amber-500/10 text-amber-600";
				return (
					<span
						className={`rounded-full px-2 py-0.5 font-medium text-xs capitalize ${cls}`}
					>
						{s}
					</span>
				);
			},
		},
		{
			id: "dates",
			header: "Period",
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{formatDate(row.original.startDate)} →{" "}
					{formatDate(row.original.endDate)}
				</span>
			),
		},
		{
			id: "terms",
			accessorKey: "termCount",
			enableSorting: true,
			header: "Terms",
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.termCount ?? 0}
				</span>
			),
		},
		{
			id: "classes",
			accessorKey: "classCount",
			enableSorting: true,
			header: "Classes",
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{row.original.classCount ?? 0}
				</span>
			),
		},
		{
			id: "mode",
			header: "Assessment",
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm capitalize">
					{row.original.assessmentMode ?? "—"}
				</span>
			),
		},
	];

	return (
		<DataTable
			columns={columns}
			data={rows}
			total={rows.length}
			page={1}
			pageSize={rows.length || 10}
			isLoading={isLoading}
			emptyMessage="No academic years configured yet."
			onPageChange={() => {}}
			onPageSizeChange={() => {}}
		/>
	);
}

// ─── Detail shell ─────────────────────────────────────────────────────────────

export function SysAdminInstitutionDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const utils = trpc.useUtils();
	const { t } = useTranslation();

	const { data, isLoading, refetch } = trpc.systemAdmin.getInstitution.useQuery(
		{ id: id! },
		{ enabled: !!id },
	);

	useBreadcrumbs([
		{
			label: t("sysadmin.nav.institutions", "Institutions"),
			href: "/sysadmin/institutions",
		},
		{ label: data?.name ?? "…" },
	]);

	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);

	const suspend = trpc.systemAdmin.suspendInstitution.useMutation({
		onSuccess: () => {
			refetch();
			utils.systemAdmin.listInstitutions.invalidate();
		},
	});
	const activate = trpc.systemAdmin.activateInstitution.useMutation({
		onSuccess: () => {
			refetch();
			utils.systemAdmin.listInstitutions.invalidate();
		},
	});
	const deleteInstitution = trpc.systemAdmin.deleteInstitution.useMutation({
		onSuccess: () => navigate("/sysadmin/institutions"),
	});

	const TABS = [
		{ to: `/sysadmin/institutions/${id}/overview`, label: "Overview" },
		{ to: `/sysadmin/institutions/${id}/members`, label: "Members" },
		{ to: `/sysadmin/institutions/${id}/academic`, label: "Academic" },
		{
			to: `/sysadmin/institutions/${id}/templates`,
			label: t("sysadmin.templates.tab"),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					{isLoading ? (
						<div className="flex items-center gap-3">
							<Skeleton className="h-12 w-12 rounded-xl" />
							<div>
								<Skeleton className="h-7 w-64" />
								<Skeleton className="mt-1 h-4 w-32" />
							</div>
						</div>
					) : (
						<div className="flex items-center gap-3">
							{data?.logoUrl ? (
								<img
									src={data.logoUrl}
									alt=""
									className="h-12 w-12 flex-shrink-0 rounded-xl border border-border object-cover"
								/>
							) : (
								<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-muted font-bold text-lg text-muted-foreground">
									{(data?.name ?? "?").slice(0, 1).toUpperCase()}
								</div>
							)}
							<div>
								<div className="flex items-center gap-2">
									<h1 className="font-bold text-2xl text-foreground">
										{data?.name ?? "Institution"}
									</h1>
									{data?.suspended && (
										<span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-600 text-xs">
											Suspended
										</span>
									)}
								</div>
								<p className="text-muted-foreground text-sm">
									{data?.city ? `${data.city} · ` : ""}
									{data?.minesecCode ?? ""}
								</p>
							</div>
						</div>
					)}
				</div>

				{!isLoading && data && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<MoreVertical className="h-4 w-4" />
								<span className="ml-1.5 hidden sm:inline">Actions</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-52">
							<DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
								<Pencil className="mr-2 h-4 w-4" />
								Edit institution
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							{data.suspended ? (
								<DropdownMenuItem
									disabled={activate.isPending}
									onSelect={() => activate.mutate({ id: data.id })}
								>
									<PlayCircle className="mr-2 h-4 w-4" />
									{activate.isPending
										? "Reactivating…"
										: "Reactivate institution"}
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem
									disabled={suspend.isPending}
									onSelect={() => suspend.mutate({ id: data.id })}
								>
									<PauseCircle className="mr-2 h-4 w-4" />
									{suspend.isPending ? "Suspending…" : "Suspend institution"}
								</DropdownMenuItem>
							)}
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-rose-600 focus:text-rose-600"
								onSelect={() => setShowDeleteDialog(true)}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete institution
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

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

			{/* Edit dialog */}
			{data && (
				<EditInstitutionDialog
					institution={data}
					open={showEditDialog}
					onClose={() => setShowEditDialog(false)}
					onDone={() => {
						refetch();
						utils.systemAdmin.listInstitutions.invalidate();
					}}
				/>
			)}

			{/* Delete confirm dialog */}
			<Dialog
				open={showDeleteDialog}
				onOpenChange={(v) => !v && setShowDeleteDialog(false)}
			>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Delete institution?</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						<strong className="text-foreground">{data?.name}</strong> and all
						its data will be permanently deleted. This action cannot be undone.
					</p>
					<div className="flex justify-end gap-2 pt-2">
						<Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={deleteInstitution.isPending}
							onClick={() => id && deleteInstitution.mutate({ id })}
						>
							{deleteInstitution.isPending ? "Deleting…" : "Delete institution"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

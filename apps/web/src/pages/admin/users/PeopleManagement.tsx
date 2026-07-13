import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ClassSelect } from "@/components/inputs/ClassSelect";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

// Local type aliases — mirrors server/src/db/schema/app-schema.ts exports
type BusinessRole =
	| "super_admin"
	| "administrator"
	| "dean"
	| "teacher"
	| "grade_editor"
	| "staff"
	| "student";

type DomainUserStatus = "active" | "inactive" | "suspended";

/** Roles surfaced in the filter chips (excludes super_admin). */
const ROLES: Array<Exclude<BusinessRole, "super_admin">> = [
	"administrator",
	"dean",
	"teacher",
	"grade_editor",
	"staff",
	"student",
];

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
	administrator: "default",
	dean: "default",
	teacher: "secondary",
	grade_editor: "secondary",
	staff: "outline",
	student: "outline",
};

export default function PeopleManagement() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [role, setRole] = useState<BusinessRole | "all">("all");
	const [status, setStatus] = useState<DomainUserStatus | "all">("all");
	const [search, setSearch] = useState("");
	const [classId, setClassId] = useState<string | null>(null);
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

	const debouncedSearch = useDebounce(search, 300);
	const isStudent = role === "student";

	// Reset to page 1 whenever a filter changes
	const handleFilter =
		<T,>(setter: (v: T) => void) =>
		(v: T) => {
			setter(v);
			setPage(1);
		};

	const queryParams = {
		page,
		pageSize,
		role: role === "all" ? undefined : role,
		status: status === "all" ? undefined : status,
		search: debouncedSearch || undefined,
		classId: isStudent ? (classId ?? undefined) : undefined,
		academicYearId: isStudent ? (academicYearId ?? undefined) : undefined,
	};

	const { data, isLoading } = useQuery(
		trpc.users.listPaged.queryOptions(queryParams),
	);

	const deleteMutation = useMutation({
		mutationFn: (id: string) => trpcClient.users.deleteProfile.mutate({ id }),
		onSuccess: () => {
			toast.success(t("common.deleted", { defaultValue: "Deleted" }));
			// Invalidate all listPaged variants so any cached pages refresh
			queryClient.invalidateQueries(trpc.users.listPaged.queryKey());
			setDeleteTarget(null);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const items = data?.items ?? [];

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="font-semibold text-xl">
						{t("usersHub.people.title", { defaultValue: "People" })}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t("usersHub.people.subtitle", {
							defaultValue: "All profiles in the institution.",
						})}
					</p>
				</div>
				<Button onClick={() => navigate("/admin/users/people/new")}>
					<Plus className="mr-2 h-4 w-4" />
					{t("usersHub.people.add", { defaultValue: "Add person" })}
				</Button>
			</div>

			{/* Filters */}
			<div className="space-y-3">
				{/* Search + Status row */}
				<div className="flex flex-wrap gap-2">
					<div className="relative min-w-48 flex-1">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							className="pl-9"
							placeholder={t("usersHub.people.searchPlaceholder", {
								defaultValue: "Search by name or email…",
							})}
							value={search}
							onChange={(e) => handleFilter(setSearch)(e.target.value)}
						/>
					</div>
					<Select
						value={status}
						onValueChange={handleFilter<DomainUserStatus | "all">(setStatus)}
					>
						<SelectTrigger className="w-36">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{t("common.filters.allStatuses", {
									defaultValue: "All statuses",
								})}
							</SelectItem>
							<SelectItem value="active">
								{t("common.active", { defaultValue: "Active" })}
							</SelectItem>
							<SelectItem value="inactive">
								{t("common.inactive", { defaultValue: "Inactive" })}
							</SelectItem>
							<SelectItem value="suspended">
								{t("common.suspended", { defaultValue: "Suspended" })}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Role chips */}
				<div className="flex flex-wrap gap-2">
					{(["all", ...ROLES] as const).map((r) => (
						<button
							key={r}
							type="button"
							onClick={() => handleFilter<BusinessRole | "all">(setRole)(r)}
							className={`rounded-full border px-3 py-1 text-sm transition ${
								role === r
									? "border-primary bg-primary text-primary-foreground"
									: "border-border hover:border-primary"
							}`}
						>
							{r === "all"
								? t("common.filters.all", { defaultValue: "All" })
								: t(`roles.${r}`, { defaultValue: r })}
						</button>
					))}
				</div>

				{/* Student-specific filters */}
				{isStudent && (
					<div className="flex flex-wrap gap-2">
						<div className="w-48">
							<ClassSelect
								value={classId}
								onChange={(v) => {
									setClassId(v);
									setPage(1);
								}}
							/>
						</div>
						<AcademicYearSelect
							value={academicYearId}
							onChange={(v) => {
								setAcademicYearId(v);
								setPage(1);
							}}
							allowAll
							autoSelectActive={false}
							className="w-48"
						/>
					</div>
				)}
			</div>

			{/* Table */}
			{isLoading ? (
				<TableSkeleton columns={isStudent ? 5 : 4} rows={8} />
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								{t("common.fields.name", { defaultValue: "Name" })}
							</TableHead>
							<TableHead>
								{t("common.fields.role", { defaultValue: "Role" })}
							</TableHead>
							{isStudent ? (
								<>
									<TableHead>
										{t("usersHub.people.class", { defaultValue: "Class" })}
									</TableHead>
									<TableHead>
										{t("usersHub.people.regNumber", {
											defaultValue: "Reg. number",
										})}
									</TableHead>
									<TableHead>
										{t("usersHub.people.enrollmentStatus", {
											defaultValue: "Enrollment",
										})}
									</TableHead>
								</>
							) : (
								<TableHead>
									{t("common.fields.email", { defaultValue: "Email" })}
								</TableHead>
							)}
							<TableHead>
								{t("common.fields.status", { defaultValue: "Status" })}
							</TableHead>
							<TableHead className="w-10" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={isStudent ? 7 : 5}
									className="py-12 text-center text-muted-foreground"
								>
									{t("usersHub.people.empty", {
										defaultValue: "No people found.",
									})}
								</TableCell>
							</TableRow>
						) : (
							items.map((person) => (
								<TableRow
									key={person.id}
									className="cursor-pointer"
									onClick={() => navigate(`/admin/profiles/${person.id}`)}
								>
									<TableCell className="font-medium">
										{person.firstName} {person.lastName}
									</TableCell>
									<TableCell>
										{person.role ? (
											<Badge
												variant={roleBadgeVariant[person.role] ?? "outline"}
											>
												{t(`roles.${person.role}`, {
													defaultValue: person.role,
												})}
											</Badge>
										) : (
											<span className="text-muted-foreground text-sm">—</span>
										)}
									</TableCell>
									{isStudent ? (
										<>
											<TableCell>
												{"currentClassName" in person
													? (person.currentClassName ?? "—")
													: "—"}
											</TableCell>
											<TableCell>
												{"registrationNumber" in person
													? (person.registrationNumber ?? "—")
													: "—"}
											</TableCell>
											<TableCell>
												{"currentEnrollmentStatus" in person &&
												person.currentEnrollmentStatus ? (
													<Badge variant="outline">
														{t(
															`enrollments.status.${person.currentEnrollmentStatus}`,
															{
																defaultValue: person.currentEnrollmentStatus,
															},
														)}
													</Badge>
												) : (
													<span className="text-muted-foreground text-sm">
														—
													</span>
												)}
											</TableCell>
										</>
									) : (
										<TableCell className="text-muted-foreground text-sm">
											{person.primaryEmail}
										</TableCell>
									)}
									<TableCell>
										<Badge
											variant={
												person.status === "active" ? "default" : "secondary"
											}
										>
											{t(`common.${person.status}`, {
												defaultValue: person.status ?? "",
											})}
										</Badge>
									</TableCell>
									<TableCell onClick={(e) => e.stopPropagation()}>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon-sm">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() =>
														navigate(`/admin/profiles/${person.id}`)
													}
												>
													{t("common.actions.open", { defaultValue: "Open" })}
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													className="text-destructive"
													onClick={() => setDeleteTarget(person.id)}
												>
													{t("common.actions.delete", {
														defaultValue: "Delete",
													})}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			)}

			<TablePagination
				page={page}
				pageCount={data?.pageCount ?? 1}
				total={data?.total ?? 0}
				pageSize={pageSize}
				onPageChange={setPage}
				onPageSizeChange={(s) => {
					setPageSize(s);
					setPage(1);
				}}
			/>

			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("common.confirmDelete", {
								defaultValue: "Confirm delete",
							})}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("usersHub.people.deleteConfirm", {
								defaultValue: "This will permanently delete the profile.",
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("common.cancel", { defaultValue: "Cancel" })}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								deleteTarget && deleteMutation.mutate(deleteTarget)
							}
						>
							{t("common.delete", { defaultValue: "Delete" })}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

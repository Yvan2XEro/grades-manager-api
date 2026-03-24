import { zodResolver } from "@hookform/resolvers/zod";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { KeyRound, Pencil, PlusIcon, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { Badge } from "../../components/ui/badge";
import { BulkActionBar } from "../../components/ui/bulk-action-bar";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { DatePicker } from "../../components/ui/date-picker";
import { DialogFooter } from "../../components/ui/dialog";
import FormModal from "../../components/modals/FormModal";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { Separator } from "../../components/ui/separator";
import { Spinner } from "../../components/ui/spinner";
import { Switch } from "../../components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { TableSkeleton } from "../../components/ui/table-skeleton";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { FilterBar } from "@/components/ui/filter-bar";
import { DebouncedSearchField } from "@/components/inputs";
import { useDebounce } from "../../hooks/useDebounce";
import { useRowSelection } from "../../hooks/useRowSelection";
import { authClient } from "../../lib/auth-client";
import type { RouterOutputs } from "../../utils/trpc";
import { trpcClient } from "../../utils/trpc";

const ASSIGNABLE_ROLES = [
	"administrator",
	"dean",
	"teacher",
	"staff",
	"student",
] as const;

type DomainUser = RouterOutputs["users"]["list"]["items"][number];

const getDisplayName = (user: DomainUser) =>
	[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

const toDomainRole = (role: "admin" | "teacher") =>
	role === "admin" ? "administrator" : role;

const formatDateInput = (value?: string | Date | null) => {
	if (!value) return "";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toISOString().split("T")[0];
};

const mapFormToProfile = (data: UserForm) => ({
	firstName: data.firstName.trim(),
	lastName: data.lastName.trim(),
	email: data.email.trim(),
	phone: data.phone?.trim() || undefined,
	gender: data.gender || undefined,
	dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
	placeOfBirth: data.placeOfBirth?.trim() || undefined,
	nationality: data.nationality?.trim() || undefined,
	status: data.status || "active",
});

const buildFullName = (data: Pick<UserForm, "firstName" | "lastName">) =>
	`${data.firstName} ${data.lastName}`.trim();

const buildUserSchema = (t: TFunction) =>
	z
		.object({
			firstName: z.string().min(1, t("admin.users.validation.firstName")),
			lastName: z.string().min(1, t("admin.users.validation.lastName")),
			email: z.string().email(t("admin.users.validation.email")),
			phone: z.string().optional(),
			gender: z.enum(["male", "female", "other"]).optional(),
			dateOfBirth: z.string().optional(),
			placeOfBirth: z.string().optional(),
			nationality: z.string().optional(),
			status: z.enum(["active", "inactive", "suspended"]).optional(),
			// System access fields (create mode only)
			canConnect: z.boolean().default(false),
			password: z.string().optional(),
			memberRole: z
				.enum(ASSIGNABLE_ROLES as unknown as [string, ...string[]])
				.optional(),
		})
		.superRefine((data, ctx) => {
			if (!data.canConnect) return;
			if (!data.password || data.password.length < 8) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["password"],
					message: t("admin.users.validation.passwordMin", {
						defaultValue: "Password must be at least 8 characters",
					}),
				});
			}
			if (!data.memberRole) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["memberRole"],
					message: t("admin.users.validation.memberRoleRequired", {
						defaultValue: "Role is required when system access is enabled",
					}),
				});
			}
		});

type UserForm = z.infer<ReturnType<typeof buildUserSchema>>;

function generatePassword(length = 16) {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
	let pwd = "";
	for (let i = 0; i < length; i++) {
		pwd += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return pwd;
}

export default function UserManagement() {
	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const userSchema = useMemo(() => buildUserSchema(t), [t]);
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 500);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<DomainUser | null>(null);
	const [userToDelete, setUserToDelete] = useState<DomainUser | null>(null);
	const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "teacher">(
		"all",
	);
	const [statusFilter, setStatusFilter] = useState<
		"all" | "active" | "inactive" | "suspended"
	>("all");
	const genderOptions = useMemo(
		() => [
			{
				value: "male",
				label: t("admin.users.gender.male", { defaultValue: "Male" }),
			},
			{
				value: "female",
				label: t("admin.users.gender.female", { defaultValue: "Female" }),
			},
			{
				value: "other",
				label: t("admin.users.gender.other", { defaultValue: "Other" }),
			},
		],
		[t],
	);
	const statusOptions = useMemo(
		() => [
			{ value: "active", label: t("admin.users.status.active") },
			{ value: "inactive", label: t("admin.users.status.inactive") },
			{ value: "suspended", label: t("admin.users.status.suspended") },
		],
		[t],
	);

	const { data, isLoading: isLoadingUsers, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
		queryKey: ["users", roleFilter, statusFilter],
		queryFn: async ({ pageParam }) =>
			trpcClient.users.list.query({
				cursor: pageParam,
				limit: 10,
				role: roleFilter === "all" ? undefined : toDomainRole(roleFilter),
				status: statusFilter === "all" ? undefined : statusFilter,
			}),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
	const users = data?.pages.flatMap((p) => p.items) ?? [];
	const sentinelRef = useInfiniteScroll(fetchNextPage, { enabled: hasNextPage && !isFetchingNextPage });
	const displayedUsers = users.filter((user) => {
		if (!debouncedSearch) return true;
		const needle = debouncedSearch.toLowerCase();
		const name = getDisplayName(user).toLowerCase();
		const email = (user.email ?? "").toLowerCase();
		return name.includes(needle) || email.includes(needle);
	});
	const selection = useRowSelection(displayedUsers);

	const bulkDeleteMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			const usersToDelete = displayedUsers.filter((u) => ids.includes(u.id));
			await Promise.all(
				usersToDelete.map(async (user) => {
					if (user.authUserId) {
						await authClient.admin.removeUser({ userId: user.authUserId });
					}
					return trpcClient.users.deleteProfile.mutate({ id: user.id });
				}),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["users"] });
			selection.clear();
			toast.success(
				t("common.bulkActions.deleteSuccess", {
					defaultValue: "Items deleted successfully",
				}),
			);
		},
		onError: () =>
			toast.error(
				t("common.bulkActions.deleteError", {
					defaultValue: "Failed to delete items",
				}),
			),
	});

	const form = useForm<UserForm>({
		resolver: zodResolver(userSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
			gender: undefined,
			dateOfBirth: "",
			placeOfBirth: "",
			nationality: "",
			status: "active",
			canConnect: false,
			password: "",
			memberRole: undefined,
		},
	});
	const canConnect = form.watch("canConnect");

	const openCreate = () => {
		setEditingUser(null);
		form.reset({
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
			gender: undefined,
			dateOfBirth: "",
			placeOfBirth: "",
			nationality: "",
			status: "active",
			canConnect: false,
			password: "",
			memberRole: undefined,
		});
		setIsModalOpen(true);
	};

	const openEdit = (user: DomainUser) => {
		setEditingUser(user);
		form.reset({
			firstName: user.firstName || "",
			lastName: user.lastName || "",
			email: user.email || "",
			phone: user.phone || "",
			gender: (user.gender as UserForm["gender"]) || undefined,
			dateOfBirth: formatDateInput(user.dateOfBirth),
			placeOfBirth: user.placeOfBirth || "",
			nationality: user.nationality || "",
			status: (user.status as UserForm["status"]) || "active",
			canConnect: false,
			password: "",
			memberRole: undefined,
		});
		setIsModalOpen(true);
	};

	const closeModal = () => setIsModalOpen(false);

	const createMutation = useMutation({
		mutationFn: async (data: UserForm) => {
			await trpcClient.users.createWithAuth.mutate({
				...mapFormToProfile(data),
				canConnect: data.canConnect,
				password: data.canConnect ? data.password : undefined,
				memberRole: data.canConnect ? data.memberRole : undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("admin.users.toast.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["users"] });
			closeModal();
		},
		onError: (err: unknown) =>
			toast.error((err as Error).message || t("admin.users.toast.createError")),
	});

	const updateMutation = useMutation({
		mutationFn: async ({
			authUserId,
			id,
			...data
		}: { authUserId?: string | null; id: string } & UserForm) => {
			if (authUserId) {
				const fullName = buildFullName(data);
				await authClient.admin.adminUpdateUser({
					userId: authUserId,
					data: { name: fullName, email: data.email },
				});
			}
			await trpcClient.users.updateProfile.mutate({
				id,
				...mapFormToProfile(data),
			});
		},
		onSuccess: () => {
			toast.success(t("admin.users.toast.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: ["users"] });
			closeModal();
		},
		onError: (err: unknown) =>
			toast.error((err as Error).message || t("admin.users.toast.updateError")),
	});

	const deleteMutation = useMutation({
		mutationFn: async (user: DomainUser) => {
			if (user.authUserId) {
				await authClient.admin.removeUser({ userId: user.authUserId });
			}
			await trpcClient.users.deleteProfile.mutate({ id: user.id });
		},
		onSuccess: () => {
			toast.success(t("admin.users.toast.deleteSuccess"));
			queryClient.invalidateQueries({ queryKey: ["users"] });
			setUserToDelete(null);
		},
		onError: (err: unknown) =>
			toast.error((err as Error).message || t("admin.users.toast.deleteError")),
	});

	const onSubmit = (data: UserForm) => {
		if (editingUser) {
			updateMutation.mutate({
				id: editingUser.id,
				authUserId: editingUser.authUserId,
				...data,
			});
		} else {
			createMutation.mutate(data);
		}
	};

	return (
		<div className="space-y-6">
			<div className="mb-4 flex items-center justify-between gap-3">
				<h1 className="text-foreground">
					{t("admin.users.title")}
				</h1>
				<Button onClick={openCreate}>
					<PlusIcon className="h-4 w-4" />
					{t("admin.users.actions.create")}
				</Button>
			</div>

			<FilterBar
				activeCount={[roleFilter !== "all", statusFilter !== "all", !!debouncedSearch].filter(Boolean).length}
				onReset={() => { setRoleFilter("all"); setStatusFilter("all"); setSearch(""); }}
				defaultOpen
			>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<div className="space-y-1.5">
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Recherche</p>
						<DebouncedSearchField
							value={search}
							onChange={setSearch}
							placeholder={t("admin.users.filters.searchPlaceholder")}
						/>
					</div>
					<div className="space-y-1.5">
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Rôle</p>
						<Select value={roleFilter} onValueChange={setRoleFilter}>
							<SelectTrigger>
								<SelectValue placeholder={t("admin.users.filters.roles.all")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("admin.users.filters.roles.all")}</SelectItem>
								<SelectItem value="admin">{t("admin.users.filters.roles.admin")}</SelectItem>
								<SelectItem value="teacher">{t("admin.users.filters.roles.teacher")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{t("admin.users.table.status")}</p>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger>
								<SelectValue placeholder={t("admin.users.filters.status.all")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("admin.users.filters.status.all")}</SelectItem>
								<SelectItem value="active">{t("admin.users.status.active")}</SelectItem>
								<SelectItem value="inactive">{t("admin.users.status.inactive")}</SelectItem>
								<SelectItem value="suspended">{t("admin.users.status.suspended")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</FilterBar>
			<BulkActionBar
				selectedCount={selection.selectedCount}
				onClear={selection.clear}
			>
				<Button
					variant="destructive"
					size="sm"
					onClick={() => {
						if (
							window.confirm(
								t("common.bulkActions.confirmDelete", {
									defaultValue:
										"Are you sure you want to delete the selected items?",
								}),
							)
						) {
							bulkDeleteMutation.mutate([...selection.selectedIds]);
						}
					}}
					disabled={bulkDeleteMutation.isPending}
				>
					<Trash2 className="mr-1 h-3.5 w-3.5" />
					{t("common.actions.delete")}
				</Button>
			</BulkActionBar>

			<div className="min-h-[50vh] overflow-x-auto">
				{isLoadingUsers ? (
					<TableSkeleton columns={6} rows={8} />
				) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-10">
								<Checkbox
									checked={
										selection.isAllSelected
											? true
											: selection.isSomeSelected
												? "indeterminate"
												: false
									}
									onCheckedChange={(checked) =>
										selection.toggleAll(Boolean(checked))
									}
								/>
							</TableHead>
							<TableHead>{t("admin.users.table.name")}</TableHead>
							<TableHead>{t("admin.users.table.email")}</TableHead>
							<TableHead className="w-28">{t("admin.users.table.role")}</TableHead>
							<TableHead className="w-24">{t("admin.users.table.status")}</TableHead>
							<TableHead className="w-[100px] text-right">
								{t("common.table.actions")}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{displayedUsers.map((user) => (
							<TableRow
							key={user.id}
							actions={
								<>
									<ContextMenuItem onSelect={() => openEdit(user)}>
										<span>{t("common.actions.edit", { defaultValue: "Edit" })}</span>
									</ContextMenuItem>
									<ContextMenuSeparator />
									<ContextMenuItem variant="destructive" onSelect={() => setUserToDelete(user)}>
										<span>{t("common.actions.delete")}</span>
									</ContextMenuItem>
								</>
							}
						>
								<TableCell className="w-10">
									<Checkbox
										checked={selection.isSelected(user.id)}
										onCheckedChange={() => selection.toggle(user.id)}
									/>
								</TableCell>
								<TableCell className="font-medium">
									{getDisplayName(user)}
								</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>
									{user.role
										? t(
												`admin.users.roles.${
													user.role === "administrator" ? "admin" : user.role
												}`,
												{ defaultValue: user.role },
											)
										: ""}
								</TableCell>
								<TableCell>
									<Badge
										variant={user.status === "active" ? "default" : "secondary"}
									>
										{t(`admin.users.status.${user.status}`, {
											defaultValue: user.status,
										})}
									</Badge>
								</TableCell>
								<TableCell className="text-right">
									<div className="row-action-fade flex justify-end gap-1">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="h-8 w-8"
											onClick={() => openEdit(user)}
											aria-label={t("admin.users.actions.edit")}
										>
											<Pencil className="h-3.5 w-3.5" />
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => setUserToDelete(user)}
											aria-label={t("common.actions.delete")}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
						{displayedUsers.length === 0 && (
							<TableRow>
								<TableCell colSpan={6} className="py-4 text-center">
									{t("admin.users.empty")}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				)}
			</div>

			<div ref={sentinelRef} className="h-1" />

			<FormModal
				isOpen={isModalOpen}
				onClose={closeModal}
				title={editingUser ? t("admin.users.form.editTitle") : t("admin.users.form.createTitle")}
				maxWidth={editingUser ? "sm:max-w-xl" : "sm:max-w-4xl"}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						{/* Two-column layout in create mode; single-column in edit mode */}
						<div className={editingUser ? "space-y-4" : "grid grid-cols-1 gap-x-8 md:grid-cols-2"}>
							{/* Left column — Profile fields */}
							<div className="space-y-4">
								{!editingUser && (
									<p className="font-semibold text-sm">
										{t("admin.users.form.profileSection", { defaultValue: "Profile" })}
									</p>
								)}
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="firstName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("admin.users.form.firstNameLabel")}</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="lastName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("admin.users.form.lastNameLabel")}</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("admin.users.form.emailLabel")}</FormLabel>
											<FormControl>
												<Input type="email" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="phone"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("admin.users.form.phoneLabel")}</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="gender"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("admin.users.form.genderLabel")}</FormLabel>
												<Select value={field.value} onValueChange={field.onChange}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder={t("admin.users.form.genderPlaceholder")} />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{genderOptions.map((option) => (
															<SelectItem key={option.value} value={option.value}>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="dateOfBirth"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("admin.users.form.dateOfBirthLabel")}</FormLabel>
												<FormControl>
													<DatePicker value={field.value ?? ""} onChange={field.onChange} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="placeOfBirth"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("admin.users.form.placeOfBirthLabel")}</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="nationality"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("admin.users.form.nationalityLabel")}</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="status"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("admin.users.form.statusLabel")}</FormLabel>
												<Select value={field.value} onValueChange={field.onChange}>
													<FormControl>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{statusOptions.map((option) => (
															<SelectItem key={option.value} value={option.value}>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>

							{/* Right column — System access (create mode only) */}
							{!editingUser && (
								<div className="space-y-4 border-l pl-8">
									<div className="flex items-center gap-2">
										<KeyRound className="h-4 w-4 text-muted-foreground" />
										<p className="font-semibold text-sm">
											{t("admin.users.form.systemAccessSection", { defaultValue: "System Access" })}
										</p>
									</div>
									<FormField
										control={form.control}
										name="canConnect"
										render={({ field }) => (
											<FormItem className="flex items-center gap-3 rounded-lg border p-3">
												<FormControl>
													<Switch checked={field.value} onCheckedChange={field.onChange} />
												</FormControl>
												<div className="space-y-0.5">
													<FormLabel className="cursor-pointer text-sm">
														{t("admin.users.form.canConnectLabel", { defaultValue: "Can log in" })}
													</FormLabel>
													<p className="text-muted-foreground text-xs">
														{t("admin.users.form.canConnectDescription", {
															defaultValue: "Creates a system account with login access",
														})}
													</p>
												</div>
											</FormItem>
										)}
									/>
									{canConnect && (
										<>
											<Separator />
											<FormField
												control={form.control}
												name="memberRole"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("admin.users.form.memberRoleLabel", { defaultValue: "Role" })}
														</FormLabel>
														<Select value={field.value ?? ""} onValueChange={field.onChange}>
															<FormControl>
																<SelectTrigger>
																	<SelectValue
																		placeholder={t("admin.users.form.memberRolePlaceholder", { defaultValue: "Select a role" })}
																	/>
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{ASSIGNABLE_ROLES.map((role) => (
																	<SelectItem key={role} value={role}>
																		{t(`admin.users.roles.${role}`, { defaultValue: role })}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="password"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("admin.users.form.passwordLabel", { defaultValue: "Password" })}
														</FormLabel>
														<FormControl>
															<div className="flex gap-2">
																<Input
																	type="text"
																	autoComplete="new-password"
																	className="font-mono"
																	{...field}
																/>
																<Button
																	type="button"
																	variant="outline"
																	size="icon"
																	onClick={() => form.setValue("password", generatePassword())}
																	title={t("admin.users.form.generatePassword", { defaultValue: "Generate password" })}
																>
																	<RefreshCw className="h-4 w-4" />
																</Button>
															</div>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</>
									)}
								</div>
							)}
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={closeModal}
								disabled={
									form.formState.isSubmitting ||
									createMutation.isPending ||
									updateMutation.isPending
								}
							>
								{t("common.actions.cancel")}
							</Button>
							<Button
								type="submit"
								disabled={
									form.formState.isSubmitting ||
									createMutation.isPending ||
									updateMutation.isPending
								}
							>
								{form.formState.isSubmitting ||
								createMutation.isPending ||
								updateMutation.isPending ? (
									<>
										<Spinner className="mr-2" />
										{t("common.loading")}
									</>
								) : (
									t("common.actions.save")
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</FormModal>

			<ConfirmModal
				isOpen={Boolean(userToDelete)}
				onClose={() => setUserToDelete(null)}
				onConfirm={() => userToDelete && deleteMutation.mutate(userToDelete)}
				title={t("admin.users.confirm.delete.title")}
				message={t("admin.users.confirm.delete.message")}
				confirmText={t("common.actions.delete")}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}

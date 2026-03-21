import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Pencil, PlusIcon, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
import { PaginationBar } from "../../components/ui/pagination-bar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { Spinner } from "../../components/ui/spinner";
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
import { useCursorPagination } from "../../hooks/useCursorPagination";
import { useDebounce } from "../../hooks/useDebounce";
import { useRowSelection } from "../../hooks/useRowSelection";
import { authClient } from "../../lib/auth-client";
import type { RouterOutputs } from "../../utils/trpc";
import { trpcClient } from "../../utils/trpc";

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
	z.object({
		firstName: z.string().min(1, t("admin.users.validation.firstName")),
		lastName: z.string().min(1, t("admin.users.validation.lastName")),
		email: z.string().email(t("admin.users.validation.email")),
		phone: z.string().optional(),
		gender: z.enum(["male", "female", "other"]).optional(),
		dateOfBirth: z.string().optional(),
		placeOfBirth: z.string().optional(),
		nationality: z.string().optional(),
		status: z.enum(["active", "inactive", "suspended"]).optional(),
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
	const pagination = useCursorPagination({ pageSize: 10 });
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

	const { data, isLoading: isLoadingUsers } = useQuery({
		queryKey: ["users", pagination.cursor, roleFilter, statusFilter],
		queryFn: async () =>
			trpcClient.users.list.query({
				cursor: pagination.cursor,
				limit: pagination.pageSize,
				role: roleFilter === "all" ? undefined : toDomainRole(roleFilter),
				status: statusFilter === "all" ? undefined : statusFilter,
			}),
	});
	const users = data?.items ?? [];
	const nextCursor = data?.nextCursor;
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
					await trpcClient.users.deleteProfile.mutate({ id: user.id });
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset cursor when filters change
	useEffect(() => {
		pagination.reset();
	}, [debouncedSearch, roleFilter, statusFilter]);

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
		},
	});

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
		});
		setIsModalOpen(true);
	};

	const closeModal = () => setIsModalOpen(false);

	const createMutation = useMutation({
		mutationFn: async (data: UserForm) => {
			const autoPassword = generatePassword();
			const fullName = buildFullName(data);
			const response = await authClient.admin.createUser({
				email: data.email,
				name: fullName,
				role: "teacher",
				password: autoPassword,
			});
			const authUserId = response?.user?.id;
			if (!authUserId) {
				throw new Error(t("admin.users.toast.createError"));
			}
			await trpcClient.users.createProfile.mutate({
				...mapFormToProfile(data),
				authUserId,
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
			if (!user.authUserId) {
				throw new Error(t("admin.users.toast.deleteError"));
			}
			await authClient.admin.removeUser({ userId: user.authUserId });
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
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Statut</p>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger>
								<SelectValue placeholder="Tous les statuts" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tous les statuts</SelectItem>
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
											disabled={!user.authUserId}
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

			<PaginationBar
				hasPrev={pagination.hasPrev}
				hasNext={Boolean(nextCursor)}
				onPrev={pagination.handlePrev}
				onNext={() => pagination.handleNext(nextCursor)}
				isLoading={isLoadingUsers}
			/>

			<FormModal
				isOpen={isModalOpen}
				onClose={closeModal}
				title={editingUser ? t("admin.users.form.editTitle") : t("admin.users.form.createTitle")}
				maxWidth="sm:max-w-xl"
			>
				<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="firstName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("admin.users.form.firstNameLabel")}
											</FormLabel>
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
											<FormLabel>
												{t("admin.users.form.lastNameLabel")}
											</FormLabel>
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
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={t(
																"admin.users.form.genderPlaceholder",
															)}
														/>
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
											<FormLabel>
												{t("admin.users.form.dateOfBirthLabel")}
											</FormLabel>
											<FormControl>
												<DatePicker
													value={field.value ?? ""}
													onChange={field.onChange}
												/>
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
											<FormLabel>
												{t("admin.users.form.placeOfBirthLabel")}
											</FormLabel>
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
											<FormLabel>
												{t("admin.users.form.nationalityLabel")}
											</FormLabel>
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
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
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

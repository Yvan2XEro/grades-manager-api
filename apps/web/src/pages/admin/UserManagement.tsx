import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import {
	Copy,
	Eye,
	EyeOff,
	Pencil,
	PlusIcon,
	Search,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "../../components/ui/input-group";
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
import { useDebounce } from "../../hooks/useDebounce";
import { authClient } from "../../lib/auth-client";
import type { RouterOutputs } from "../../utils/trpc";
import { trpcClient } from "../../utils/trpc";

type DomainUser = RouterOutputs["users"]["list"]["items"][number];

const getDisplayName = (user: DomainUser) =>
	[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

const toFormRole = (role?: string | null): "admin" | "teacher" =>
	role === "administrator" ? "admin" : "teacher";

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
	role: toDomainRole(data.role),
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
		role: z.enum(["admin", "teacher"], {
			errorMap: () => ({ message: t("admin.users.validation.role") }),
		}),
		password: z.string().optional(),
	});

type UserForm = z.infer<ReturnType<typeof buildUserSchema>>;

function generatePassword(length = 12) {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
	const [showPassword, setShowPassword] = useState(false);
	const [cursor, setCursor] = useState<string | undefined>();
	const [prevCursors, setPrevCursors] = useState<string[]>([]);
	const pageSize = 10;
	const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "teacher">(
		"all",
	);
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

	const { data } = useQuery({
		queryKey: ["users", cursor, roleFilter],
		queryFn: async () =>
			trpcClient.users.list.query({
				cursor,
				limit: pageSize,
				role: roleFilter === "all" ? undefined : toDomainRole(roleFilter),
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset cursor when filters change
	useEffect(() => {
		setCursor(undefined);
		setPrevCursors([]);
	}, [debouncedSearch, roleFilter]);

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
			role: "teacher",
			password: "",
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
			role: "teacher",
			password: "",
		});
		setShowPassword(false);
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
			role: toFormRole(user.businessRole),
			password: "",
		});
		setShowPassword(false);
		setIsModalOpen(true);
	};

	const closeModal = () => setIsModalOpen(false);

	const createMutation = useMutation({
		mutationFn: async (data: UserForm) => {
			if (!data.password) {
				throw new Error(t("admin.users.validation.passwordRequired"));
			}
			const fullName = buildFullName(data);
			const response = await authClient.admin.createUser({
				email: data.email,
				name: fullName,
				role: data.role,
				password: data.password,
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
					data: { name: fullName, email: data.email, role: data.role },
				});
				if (data.password) {
					await authClient.admin.setUserPassword({
						userId: authUserId,
						password: data.password,
					});
				}
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

	const handleGeneratePassword = () => {
		const pwd = generatePassword();
		form.setValue("password", pwd);
		setShowPassword(true);
	};

	const handleCopyPassword = () => {
		const pwd = form.getValues("password");
		if (pwd) {
			navigator.clipboard.writeText(pwd);
			toast.success(t("admin.users.toast.passwordCopied"));
		}
	};

	const onSubmit = (data: UserForm) => {
		if (!editingUser && !data.password) {
			toast.error(t("admin.users.validation.passwordRequired"));
			return;
		}
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
		<div className="p-6">
			<div className="mb-4 flex items-center justify-between gap-3">
				<h1 className="font-semibold text-xl">{t("admin.users.title")}</h1>
				<Button onClick={openCreate}>
					<PlusIcon className="h-4 w-4" />
					{t("admin.users.actions.create")}
				</Button>
			</div>

			<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative w-full sm:max-w-xs">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 text-muted-foreground" />
					<Input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t("admin.users.filters.searchPlaceholder")}
						className="pl-9"
					/>
				</div>
				<div className="flex flex-wrap gap-2">
					<Select value={roleFilter} onValueChange={setRoleFilter}>
						<SelectTrigger className="min-w-[180px]">
							<SelectValue placeholder={t("admin.users.filters.roles.all")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{t("admin.users.filters.roles.all")}
							</SelectItem>
							<SelectItem value="admin">
								{t("admin.users.filters.roles.admin")}
							</SelectItem>
							<SelectItem value="teacher">
								{t("admin.users.filters.roles.teacher")}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			<div className="min-h-[50vh] overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("admin.users.table.name")}</TableHead>
							<TableHead>{t("admin.users.table.email")}</TableHead>
							<TableHead>{t("admin.users.table.role")}</TableHead>
							<TableHead>{t("admin.users.table.status")}</TableHead>
							<TableHead className="w-1 text-right">
								{t("common.table.actions")}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{displayedUsers.map((user) => (
							<TableRow key={user.id}>
								<TableCell className="font-medium">
									{getDisplayName(user)}
								</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>
									{user.businessRole
										? t(
												`admin.users.roles.${
													user.businessRole === "administrator"
														? "admin"
														: user.businessRole
												}`,
												{ defaultValue: user.businessRole },
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
									<div className="flex justify-end gap-2">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => openEdit(user)}
											aria-label={t("admin.users.actions.edit")}
										>
											<Pencil className="h-4 w-4" />
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
								<TableCell colSpan={5} className="py-4 text-center">
									{t("admin.users.empty")}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="mt-4 flex items-center justify-center gap-2">
				<button
					type="button"
					className="btn btn-sm"
					onClick={() => {
						const prev = prevCursors[prevCursors.length - 1];
						setPrevCursors((p) => p.slice(0, -1));
						setCursor(prev || undefined);
					}}
					disabled={prevCursors.length === 0}
				>
					{t("common.pagination.previous")}
				</button>
				<button
					type="button"
					className="btn btn-sm"
					onClick={() => {
						if (nextCursor) {
							setPrevCursors((p) => [...p, cursor || ""]);
							setCursor(nextCursor);
						}
					}}
					disabled={!nextCursor}
				>
					{t("common.pagination.next")}
				</button>
			</div>

			<Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
				<DialogContent className="max-w-xl">
					<DialogHeader>
						<DialogTitle>
							{editingUser
								? t("admin.users.form.editTitle")
								: t("admin.users.form.createTitle")}
						</DialogTitle>
					</DialogHeader>
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
												<Input type="date" {...field} />
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
							<FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.users.form.roleLabel")}</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t("admin.users.filters.roles.all")}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="admin">
													{t("admin.users.filters.roles.admin")}
												</SelectItem>
												<SelectItem value="teacher">
													{t("admin.users.filters.roles.teacher")}
												</SelectItem>
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
											{editingUser
												? t("admin.users.form.newPasswordLabel")
												: t("admin.users.form.passwordLabel")}
										</FormLabel>
										<FormControl>
											<InputGroup>
												<InputGroupInput
													type={showPassword ? "text" : "password"}
													placeholder={
														editingUser
															? t("admin.users.form.passwordPlaceholder")
															: undefined
													}
													{...field}
												/>
												<InputGroupAddon
													align="inline-end"
													className="gap-1.5 pr-1.5"
												>
													<InputGroupButton
														type="button"
														size="sm"
														variant="ghost"
														onClick={() => setShowPassword((s) => !s)}
													>
														{showPassword ? (
															<EyeOff className="h-4 w-4" />
														) : (
															<Eye className="h-4 w-4" />
														)}
													</InputGroupButton>
													<InputGroupButton
														type="button"
														size="sm"
														variant="ghost"
														onClick={handleCopyPassword}
													>
														<Copy className="h-4 w-4" />
													</InputGroupButton>
													{!editingUser && (
														<InputGroupButton
															type="button"
															size="sm"
															variant="ghost"
															onClick={handleGeneratePassword}
														>
															{t("admin.users.form.generatePassword")}
														</InputGroupButton>
													)}
												</InputGroupAddon>
											</InputGroup>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
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
				</DialogContent>
			</Dialog>

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

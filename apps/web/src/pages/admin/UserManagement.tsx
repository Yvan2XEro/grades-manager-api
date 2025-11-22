import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import {
	Copy,
	Eye,
	EyeOff,
	MoreVertical,
	PlusIcon,
	Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
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
import { useDebounce } from "../../hooks/useDebounce";
import { authClient } from "../../lib/auth-client";
import { trpcClient } from "../../utils/trpc";

interface User {
	id: string;
	name?: string;
	email?: string;
	role?: string;
	banned?: boolean | null;
	emailVerified?: boolean | null;
}

const buildUserSchema = (t: TFunction) =>
	z.object({
		name: z.string().min(1, t("admin.users.validation.name")),
		email: z.string().email(t("admin.users.validation.email")),
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
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [confirm, setConfirm] = useState<{
		user: User;
		action: "delete" | "ban" | "unban";
	} | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [cursor, setCursor] = useState<string | undefined>();
	const [prevCursors, setPrevCursors] = useState<string[]>([]);
	const pageSize = 10;
	const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "teacher">("all");
	const [banFilter, setBanFilter] = useState<"all" | "active" | "banned">("all");
	const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");

	const { data } = useQuery({
		queryKey: ["users", cursor, roleFilter, banFilter, verifiedFilter],
		queryFn: async () =>
			trpcClient.users.list.query({
				cursor,
				limit: pageSize,
				role: roleFilter === "all" ? undefined : roleFilter,
				banned:
					banFilter === "banned"
						? true
						: banFilter === "active"
							? false
							: undefined,
				emailVerified:
					verifiedFilter === "verified"
						? true
						: verifiedFilter === "unverified"
							? false
							: undefined,
			}),
	});
	const users = data?.items ?? [];
	const nextCursor = data?.nextCursor;
	const displayedUsers = users.filter((u) =>
		debouncedSearch
			? u.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
				u.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
			: true,
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset cursor when filters change
	useEffect(() => {
		setCursor(undefined);
		setPrevCursors([]);
	}, [debouncedSearch, roleFilter, banFilter, verifiedFilter]);

	const form = useForm<UserForm>({
		resolver: zodResolver(userSchema),
		defaultValues: { role: "teacher" },
	});

	const openCreate = () => {
		setEditingUser(null);
		form.reset({ name: "", email: "", role: "teacher", password: "" });
		setShowPassword(false);
		setIsModalOpen(true);
	};

	const openEdit = (user: User) => {
		setEditingUser(user);
		form.reset({
			name: user.name || "",
			email: user.email || "",
			role: (user.role as "admin" | "teacher") || "teacher",
			password: "",
		});
		setShowPassword(false);
		setIsModalOpen(true);
	};

	const closeModal = () => setIsModalOpen(false);

	const createMutation = useMutation({
		mutationFn: async (data: UserForm) => {
			await authClient.admin.createUser({
				email: data.email,
				name: data.name,
				role: data.role,
				password: data.password ?? "",
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
		mutationFn: async ({ id, ...data }: { id: string } & UserForm) => {
			await authClient.admin.adminUpdateUser({
				userId: id,
				data: { name: data.name, email: data.email, role: data.role },
			});
			if (data.password) {
				await authClient.admin.setUserPassword({
					userId: id,
					password: data.password,
				});
			}
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
		mutationFn: (user: User) =>
			authClient.admin.removeUser({ userId: user.id }),
		onSuccess: () => {
			toast.success(t("admin.users.toast.deleteSuccess"));
			queryClient.invalidateQueries({ queryKey: ["users"] });
			setConfirm(null);
		},
		onError: (err: unknown) =>
			toast.error((err as Error).message || t("admin.users.toast.deleteError")),
	});

	const banMutation = useMutation({
		mutationFn: (user: User) =>
			authClient.admin.banUser({
				userId: user.id,
				banReason: t("admin.users.ban.reason"),
				banExpiresIn: 60 * 60 * 24 * 7,
			}),
		onSuccess: () => {
			toast.success(t("admin.users.toast.banSuccess"));
			queryClient.invalidateQueries({ queryKey: ["users"] });
			setConfirm(null);
		},
		onError: (err: unknown) =>
			toast.error((err as Error).message || t("admin.users.toast.banError")),
	});

	const unbanMutation = useMutation({
		mutationFn: (user: User) => authClient.admin.unbanUser({ userId: user.id }),
		onSuccess: () => {
			toast.success(t("admin.users.toast.unbanSuccess"));
			queryClient.invalidateQueries({ queryKey: ["users"] });
			setConfirm(null);
		},
		onError: (err: unknown) =>
			toast.error((err as Error).message || t("admin.users.toast.unbanError")),
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
			updateMutation.mutate({ id: editingUser.id, ...data });
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
					<Search className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
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
					<Select value={banFilter} onValueChange={setBanFilter}>
						<SelectTrigger className="min-w-[180px]">
							<SelectValue placeholder={t("admin.users.filters.status.all")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{t("admin.users.filters.status.all")}
							</SelectItem>
							<SelectItem value="active">
								{t("admin.users.filters.status.active")}
							</SelectItem>
							<SelectItem value="banned">
								{t("admin.users.filters.status.banned")}
							</SelectItem>
						</SelectContent>
					</Select>
					<Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
						<SelectTrigger className="min-w-[180px]">
							<SelectValue placeholder={t("admin.users.filters.email.all")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{t("admin.users.filters.email.all")}
							</SelectItem>
							<SelectItem value="verified">
								{t("admin.users.filters.email.verified")}
							</SelectItem>
							<SelectItem value="unverified">
								{t("admin.users.filters.email.unverified")}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			<div className="min-h-[50vh] overflow-x-auto overflow-y-visible">
				<table className="table w-full">
					<thead>
						<tr>
							<th>{t("admin.users.table.name")}</th>
							<th>{t("admin.users.table.email")}</th>
							<th>{t("admin.users.table.role")}</th>
							<th>{t("admin.users.table.emailVerified")}</th>
							<th>{t("admin.users.table.status")}</th>
							<th className="w-1" />
						</tr>
					</thead>
					<tbody>
						{displayedUsers.map((u: User) => (
							<tr key={u.id}>
								<td>{u.name}</td>
								<td>{u.email}</td>
								<td>{u.role ? t(`admin.users.roles.${u.role}`) : ""}</td>
								<td>
									<div
										className={`badge ${u.emailVerified ? "badge-success" : "badge-warning"}`}
									>
										{u.emailVerified
											? t("admin.users.status.emailVerified")
											: t("admin.users.status.emailUnverified")}
									</div>
								</td>
								<td>
									<div
										className={`badge ${u.banned ? "badge-error" : "badge-success"}`}
									>
										{u.banned
											? t("admin.users.status.banned")
											: t("admin.users.status.active")}
									</div>
								</td>
								<td className="w-1 text-right">
									<div className="dropdown dropdown-end">
										<button
											type="button"
											tabIndex={0}
											className="btn btn-ghost btn-sm"
										>
											<MoreVertical className="h-4 w-4" />
										</button>
										<ul className="dropdown-content menu menu-sm z-[1] mt-2 w-40 rounded-box bg-base-100 p-2 shadow">
											<li>
												<button type="button" onClick={() => openEdit(u)}>
													{t("admin.users.actions.edit")}
												</button>
											</li>
											{u.banned ? (
												<li>
													<button
														type="button"
														onClick={() =>
															setConfirm({ user: u, action: "unban" })
														}
													>
														{t("admin.users.actions.unban")}
													</button>
												</li>
											) : (
												<li>
													<button
														type="button"
														onClick={() =>
															setConfirm({ user: u, action: "ban" })
														}
													>
														{t("admin.users.actions.ban")}
													</button>
												</li>
											)}
											<li>
												<button
													type="button"
													className="text-error"
													onClick={() =>
														setConfirm({ user: u, action: "delete" })
													}
												>
													{t("common.actions.delete")}
												</button>
											</li>
										</ul>
									</div>
								</td>
							</tr>
						))}
						{displayedUsers.length === 0 && (
							<tr>
								<td colSpan={6} className="py-4 text-center">
									{t("admin.users.empty")}
								</td>
							</tr>
						)}
					</tbody>
				</table>
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
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.users.form.nameLabel")}</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
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
				isOpen={!!confirm}
				onClose={() => setConfirm(null)}
				onConfirm={() => {
					if (!confirm) return;
					if (confirm.action === "delete") deleteMutation.mutate(confirm.user);
					if (confirm.action === "ban") banMutation.mutate(confirm.user);
					if (confirm.action === "unban") unbanMutation.mutate(confirm.user);
				}}
				title={
					confirm?.action === "delete"
						? t("admin.users.confirm.delete.title")
						: confirm?.action === "ban"
							? t("admin.users.confirm.ban.title")
							: t("admin.users.confirm.unban.title")
				}
				message={
					confirm?.action === "delete"
						? t("admin.users.confirm.delete.message")
						: confirm?.action === "ban"
							? t("admin.users.confirm.ban.message")
							: t("admin.users.confirm.unban.message")
				}
				confirmText={
					confirm?.action === "delete"
						? t("common.actions.delete")
						: confirm?.action === "ban"
							? t("admin.users.actions.ban")
							: t("admin.users.actions.unban")
				}
				isLoading={
					deleteMutation.isPending ||
					banMutation.isPending ||
					unbanMutation.isPending
				}
			/>
		</div>
	);
}

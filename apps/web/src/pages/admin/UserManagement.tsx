import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Copy,
	Eye,
	EyeOff,
	MoreVertical,
	PlusIcon,
	Search,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { useDebounce } from "../../hooks/useDebounce";
import { authClient } from "../../lib/auth-client";
import { trpcClient } from "../../utils/trpc";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

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
	const [roleFilter, setRoleFilter] = useState("");
	const [banFilter, setBanFilter] = useState("");
	const [verifiedFilter, setVerifiedFilter] = useState("");
	const nameId = useId();
	const emailId = useId();
	const roleId = useId();
	const passwordId = useId();

	const { data } = useQuery({
		queryKey: ["users", cursor, roleFilter, banFilter, verifiedFilter],
		queryFn: async () =>
			trpcClient.users.list.query({
				cursor,
				limit: pageSize,
				role: roleFilter || undefined,
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

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		getValues,
		formState: { errors, isSubmitting },
	} = useForm<UserForm>({
		resolver: zodResolver(userSchema),
		defaultValues: { role: "teacher" },
	});

	const openCreate = () => {
		setEditingUser(null);
		reset({ name: "", email: "", role: "teacher", password: "" });
		setShowPassword(false);
		setIsModalOpen(true);
	};

	const openEdit = (user: User) => {
		setEditingUser(user);
		reset({
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
		setValue("password", pwd);
		setShowPassword(true);
	};

	const handleCopyPassword = () => {
		const pwd = getValues("password");
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
			<div className="mb-4 flex items-center justify-between">
				<h1 className="font-semibold text-xl">{t("admin.users.title")}</h1>
				<button type="button" className="btn btn-primary" onClick={openCreate}>
					<PlusIcon className="mr-2 h-4 w-4" />
					{t("admin.users.actions.create")}
				</button>
			</div>

			<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative w-full sm:max-w-xs">
					<Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t("admin.users.filters.searchPlaceholder")}
						className="input input-bordered w-full pl-9"
					/>
				</div>
				<div className="flex flex-wrap gap-2">
					<select
						className="select select-bordered"
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value)}
					>
						<option value="">{t("admin.users.filters.roles.all")}</option>
						<option value="admin">{t("admin.users.filters.roles.admin")}</option>
						<option value="teacher">{t("admin.users.filters.roles.teacher")}</option>
					</select>
					<select
						className="select select-bordered"
						value={banFilter}
						onChange={(e) => setBanFilter(e.target.value)}
					>
						<option value="">{t("admin.users.filters.status.all")}</option>
						<option value="active">{t("admin.users.filters.status.active")}</option>
						<option value="banned">{t("admin.users.filters.status.banned")}</option>
					</select>
					<select
						className="select select-bordered"
						value={verifiedFilter}
						onChange={(e) => setVerifiedFilter(e.target.value)}
					>
						<option value="">{t("admin.users.filters.email.all")}</option>
						<option value="verified">{t("admin.users.filters.email.verified")}</option>
						<option value="unverified">{t("admin.users.filters.email.unverified")}</option>
					</select>
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

			<FormModal
				isOpen={isModalOpen}
				onClose={closeModal}
				title={
					editingUser
						? t("admin.users.form.editTitle")
						: t("admin.users.form.createTitle")
				}
			>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div>
						<label htmlFor={nameId} className="mb-1 block font-medium text-sm">
							{t("admin.users.form.nameLabel")}
						</label>
						<input
							id={nameId}
							{...register("name")}
							className="input input-bordered w-full"
						/>
						{errors.name && (
							<p className="mt-1 text-error text-sm">{errors.name.message}</p>
						)}
					</div>
						<div>
							<label htmlFor={emailId} className="mb-1 block font-medium text-sm">
								{t("admin.users.form.emailLabel")}
							</label>
						<input
							id={emailId}
							type="email"
							{...register("email")}
							className="input input-bordered w-full"
						/>
						{errors.email && (
							<p className="mt-1 text-error text-sm">{errors.email.message}</p>
						)}
					</div>
						<div>
							<label htmlFor={roleId} className="mb-1 block font-medium text-sm">
								{t("admin.users.form.roleLabel")}
							</label>
						<select
							id={roleId}
							{...register("role")}
							className="select select-bordered w-full"
						>
							<option value="admin">{t("admin.users.filters.roles.admin")}</option>
							<option value="teacher">{t("admin.users.filters.roles.teacher")}</option>
						</select>
					</div>
					<div>
						<label
							htmlFor={passwordId}
							className="mb-1 block font-medium text-sm"
						>
							{editingUser
								? t("admin.users.form.newPasswordLabel")
								: t("admin.users.form.passwordLabel")}
						</label>
						<div className="join w-full">
							<input
								id={passwordId}
								type={showPassword ? "text" : "password"}
								{...register("password", {
									required: editingUser
										? false
										: t("admin.users.validation.passwordRequired"),
								})}
								className="input input-bordered join-item w-full"
								placeholder={
									editingUser
										? t("admin.users.form.passwordPlaceholder")
										: undefined
								}
							/>
							<button
								type="button"
								className="btn btn-ghost join-item"
								onClick={() => setShowPassword((s) => !s)}
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
							<button
								type="button"
								className="btn btn-ghost join-item"
								onClick={handleCopyPassword}
							>
								<Copy className="h-4 w-4" />
							</button>
							{!editingUser && (
								<button
									type="button"
									className="btn btn-ghost join-item"
									onClick={handleGeneratePassword}
								>
									{t("admin.users.form.generatePassword")}
								</button>
							)}
						</div>
						{errors.password && (
							<p className="mt-1 text-error text-sm">
								{errors.password.message}
							</p>
						)}
					</div>
					<div className="modal-action">
						<button
							type="button"
							className="btn btn-ghost"
							onClick={closeModal}
							disabled={
								isSubmitting ||
								createMutation.isPending ||
								updateMutation.isPending
							}
						>
							{t("common.actions.cancel")}
						</button>
						<button
							type="submit"
							className="btn btn-primary"
							disabled={
								isSubmitting ||
								createMutation.isPending ||
								updateMutation.isPending
							}
						>
							{isSubmitting ||
							createMutation.isPending ||
							updateMutation.isPending ? (
								<span className="loading loading-spinner loading-sm" />
							) : (
								t("common.actions.save")
							)}
						</button>
					</div>
				</form>
			</FormModal>

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

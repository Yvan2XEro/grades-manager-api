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
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
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

const userSchema = z.object({
	name: z.string().min(1, "Required"),
	email: z.string().email(),
	role: z.enum(["admin", "teacher"]),
	password: z.string().optional(),
});

type UserForm = z.infer<typeof userSchema>;

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
			toast.success("User created");
			queryClient.invalidateQueries({ queryKey: ["users"] });
			closeModal();
		},
		onError: (err: unknown) => toast.error((err as Error).message),
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
			toast.success("User updated");
			queryClient.invalidateQueries({ queryKey: ["users"] });
			closeModal();
		},
		onError: (err: unknown) => toast.error((err as Error).message),
	});

	const deleteMutation = useMutation({
		mutationFn: (user: User) =>
			authClient.admin.removeUser({ userId: user.id }),
		onSuccess: () => {
			toast.success("User deleted");
			queryClient.invalidateQueries({ queryKey: ["users"] });
			setConfirm(null);
		},
		onError: (err: unknown) => toast.error((err as Error).message),
	});

	const banMutation = useMutation({
		mutationFn: (user: User) =>
			authClient.admin.banUser({
				userId: user.id,
				banReason: "Violation",
				banExpiresIn: 60 * 60 * 24 * 7,
			}),
		onSuccess: () => {
			toast.success("User banned");
			queryClient.invalidateQueries({ queryKey: ["users"] });
			setConfirm(null);
		},
		onError: (err: unknown) => toast.error((err as Error).message),
	});

	const unbanMutation = useMutation({
		mutationFn: (user: User) => authClient.admin.unbanUser({ userId: user.id }),
		onSuccess: () => {
			toast.success("User unbanned");
			queryClient.invalidateQueries({ queryKey: ["users"] });
			setConfirm(null);
		},
		onError: (err: unknown) => toast.error((err as Error).message),
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
			toast.success("Password copied");
		}
	};

	const onSubmit = (data: UserForm) => {
		if (!editingUser && !data.password) {
			toast.error("Password is required");
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
				<h1 className="font-semibold text-xl">User Management</h1>
				<button type="button" className="btn btn-primary" onClick={openCreate}>
					<PlusIcon className="mr-2 h-4 w-4" /> Create User
				</button>
			</div>

			<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative w-full sm:max-w-xs">
					<Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search users..."
						className="input input-bordered w-full pl-9"
					/>
				</div>
				<div className="flex flex-wrap gap-2">
					<select
						className="select select-bordered"
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value)}
					>
						<option value="">All Roles</option>
						<option value="admin">Admin</option>
						<option value="teacher">Teacher</option>
					</select>
					<select
						className="select select-bordered"
						value={banFilter}
						onChange={(e) => setBanFilter(e.target.value)}
					>
						<option value="">All Statuses</option>
						<option value="active">Active</option>
						<option value="banned">Banned</option>
					</select>
					<select
						className="select select-bordered"
						value={verifiedFilter}
						onChange={(e) => setVerifiedFilter(e.target.value)}
					>
						<option value="">All Emails</option>
						<option value="verified">Verified</option>
						<option value="unverified">Unverified</option>
					</select>
				</div>
			</div>
			<div className="min-h-[50vh] overflow-x-auto overflow-y-visible">
				<table className="table w-full">
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Role</th>
							<th>Email Verified</th>
							<th>Status</th>
							<th className="w-1" />
						</tr>
					</thead>
					<tbody>
						{displayedUsers.map((u: User) => (
							<tr key={u.id}>
								<td>{u.name}</td>
								<td>{u.email}</td>
								<td className="capitalize">{u.role}</td>
								<td>
									<div
										className={`badge ${u.emailVerified ? "badge-success" : "badge-warning"}`}
									>
										{u.emailVerified ? "Verified" : "Unverified"}
									</div>
								</td>
								<td>
									<div
										className={`badge ${u.banned ? "badge-error" : "badge-success"}`}
									>
										{u.banned ? "Banned" : "Active"}
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
													Edit
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
														Unban
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
														Ban
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
													Delete
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
									No users found
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
					Previous
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
					Next
				</button>
			</div>

			<FormModal
				isOpen={isModalOpen}
				onClose={closeModal}
				title={editingUser ? "Update User" : "Create User"}
			>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div>
						<label htmlFor={nameId} className="mb-1 block font-medium text-sm">
							Name
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
							Email
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
							Role
						</label>
						<select
							id={roleId}
							{...register("role")}
							className="select select-bordered w-full"
						>
							<option value="admin">Admin</option>
							<option value="teacher">Teacher</option>
						</select>
					</div>
					<div>
						<label
							htmlFor={passwordId}
							className="mb-1 block font-medium text-sm"
						>
							{editingUser ? "New Password" : "Password"}
						</label>
						<div className="join w-full">
							<input
								id={passwordId}
								type={showPassword ? "text" : "password"}
								{...register("password", { required: !editingUser })}
								className="input input-bordered join-item w-full"
								placeholder={
									editingUser ? "Leave blank to keep existing" : undefined
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
									Generate
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
							Cancel
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
								"Save"
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
						? "Delete User"
						: confirm?.action === "ban"
							? "Ban User"
							: "Unban User"
				}
				message={
					confirm?.action === "delete"
						? "Are you sure you want to delete this user?"
						: confirm?.action === "ban"
							? "Are you sure you want to ban this user?"
							: "Are you sure you want to unban this user?"
				}
				confirmText={
					confirm?.action === "delete"
						? "Delete"
						: confirm?.action === "ban"
							? "Ban"
							: "Unban"
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

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, Search } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { authClient } from "../../lib/auth-client";

interface User {
	id: string;
	name?: string;
	email?: string;
	role?: string;
	banned?: boolean | null;
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
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [confirm, setConfirm] = useState<{
		user: User;
		action: "delete" | "ban" | "unban";
	} | null>(null);

	const { data: users = [] } = useQuery({
		queryKey: ["users", search],
		queryFn: async () => {
			const res: any = await authClient.admin.listUsers({
				query: { searchValue: search || undefined },
			});
			return res.users ?? res.data?.users ?? [];
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<UserForm>({
		resolver: zodResolver(userSchema),
		defaultValues: { role: "teacher" },
	});

	const openCreate = () => {
		setEditingUser(null);
		reset({ name: "", email: "", role: "teacher", password: "" });
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
		setIsModalOpen(true);
	};

	const closeModal = () => setIsModalOpen(false);

	const createMutation = useMutation({
		mutationFn: async (data: UserForm) => {
			const password = generatePassword();
			await authClient.admin.createUser({
				email: data.email,
				name: data.name,
				role: data.role,
				password,
			});
			return password;
		},
		onSuccess: (password) => {
			toast.success(`User created. Password: ${password}`);
			queryClient.invalidateQueries({ queryKey: ["users"] });
			closeModal();
		},
		onError: (err: any) => toast.error(err.message),
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
		onError: (err: any) => toast.error(err.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (user: User) =>
			authClient.admin.removeUser({ userId: user.id }),
		onSuccess: () => {
			toast.success("User deleted");
			queryClient.invalidateQueries({ queryKey: ["users"] });
			setConfirm(null);
		},
		onError: (err: any) => toast.error(err.message),
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
		onError: (err: any) => toast.error(err.message),
	});

	const unbanMutation = useMutation({
		mutationFn: (user: User) => authClient.admin.unbanUser({ userId: user.id }),
		onSuccess: () => {
			toast.success("User unbanned");
			queryClient.invalidateQueries({ queryKey: ["users"] });
			setConfirm(null);
		},
		onError: (err: any) => toast.error(err.message),
	});

	const onSubmit = (data: UserForm) => {
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
				<button className="btn btn-primary" onClick={openCreate}>
					<PlusIcon className="mr-2 h-4 w-4" /> Create User
				</button>
			</div>

			<div className="mb-4">
				<div className="relative">
					<Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search users..."
						className="input input-bordered w-full pl-9"
					/>
				</div>
			</div>

			<div className="overflow-x-auto">
				<table className="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Role</th>
							<th>Status</th>
							<th className="w-1" />
						</tr>
					</thead>
					<tbody>
						{users.map((u: User) => (
							<tr key={u.id}>
								<td>{u.name}</td>
								<td>{u.email}</td>
								<td className="capitalize">{u.role}</td>
								<td>{u.banned ? "Banned" : "Active"}</td>
								<td className="space-x-2">
									<button
										className="btn btn-ghost btn-sm"
										onClick={() => openEdit(u)}
									>
										Edit
									</button>
									{u.banned ? (
										<button
											className="btn btn-ghost btn-sm"
											onClick={() => setConfirm({ user: u, action: "unban" })}
										>
											Unban
										</button>
									) : (
										<button
											className="btn btn-ghost btn-sm"
											onClick={() => setConfirm({ user: u, action: "ban" })}
										>
											Ban
										</button>
									)}
									<button
										className="btn btn-ghost btn-sm text-error"
										onClick={() => setConfirm({ user: u, action: "delete" })}
									>
										Delete
									</button>
								</td>
							</tr>
						))}
						{users.length === 0 && (
							<tr>
								<td colSpan={5} className="py-4 text-center">
									No users found
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<FormModal
				isOpen={isModalOpen}
				onClose={closeModal}
				title={editingUser ? "Update User" : "Create User"}
			>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div>
						<label className="mb-1 block font-medium text-sm">Name</label>
						<input
							{...register("name")}
							className="input input-bordered w-full"
						/>
						{errors.name && (
							<p className="mt-1 text-error text-sm">{errors.name.message}</p>
						)}
					</div>
					<div>
						<label className="mb-1 block font-medium text-sm">Email</label>
						<input
							type="email"
							{...register("email")}
							className="input input-bordered w-full"
						/>
						{errors.email && (
							<p className="mt-1 text-error text-sm">{errors.email.message}</p>
						)}
					</div>
					<div>
						<label className="mb-1 block font-medium text-sm">Role</label>
						<select
							{...register("role")}
							className="select select-bordered w-full"
						>
							<option value="admin">Admin</option>
							<option value="teacher">Teacher</option>
						</select>
					</div>
					{editingUser && (
						<div>
							<label className="mb-1 block font-medium text-sm">
								New Password
							</label>
							<input
								type="text"
								{...register("password")}
								className="input input-bordered w-full"
								placeholder="Leave blank to keep existing"
							/>
						</div>
					)}
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

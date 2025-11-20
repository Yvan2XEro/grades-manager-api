import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { trpcClient } from "../../utils/trpc";

const buildFacultySchema = (t: TFunction) =>
	z.object({
		name: z.string().min(2, t("teacher.faculties.validation.name")),
		description: z.string().optional(),
	});

type FacultyFormData = z.infer<ReturnType<typeof buildFacultySchema>>;

interface Faculty {
	id: string;
	name: string;
	description: string | null;
}

export default function FacultyManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const facultySchema = useMemo(() => buildFacultySchema(t), [t]);

	const { data: faculties, isLoading } = useQuery({
		queryKey: ["faculties"],
		queryFn: async () => {
			const { items } = await trpcClient.faculties.list.query({});
			return items as Faculty[];
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<FacultyFormData>({
		resolver: zodResolver(facultySchema),
	});

	const createMutation = useMutation({
		mutationFn: async (data: FacultyFormData) => {
			await trpcClient.faculties.create.mutate(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["faculties"] });
			toast.success(t("teacher.faculties.toast.createSuccess"));
			setIsFormOpen(false);
			reset();
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.faculties.toast.createError"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: FacultyFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.faculties.update.mutate({ id, ...updateData });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["faculties"] });
			toast.success(t("teacher.faculties.toast.updateSuccess"));
			setIsFormOpen(false);
			setEditingFaculty(null);
			reset();
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.faculties.toast.updateError"));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.faculties.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["faculties"] });
			toast.success(t("teacher.faculties.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.faculties.toast.deleteError"));
		},
	});

	const onSubmit = async (data: FacultyFormData) => {
		if (editingFaculty) {
			updateMutation.mutate({ ...data, id: editingFaculty.id });
		} else {
			createMutation.mutate(data);
		}
	};

	const openDeleteModal = (id: string) => {
		setDeleteId(id);
		setIsDeleteOpen(true);
	};

	const handleDelete = () => {
		if (deleteId) {
			deleteMutation.mutate(deleteId);
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<span className="loading loading-spinner loading-lg" />
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">{t("teacher.faculties.title")}</h1>
					<p className="text-base-content/60">
						{t("teacher.faculties.subtitle")}
					</p>
				</div>
				<button
					onClick={() => {
						setEditingFaculty(null);
						reset();
						setIsFormOpen(true);
					}}
					className="btn btn-primary"
				>
					<Plus className="mr-2 h-5 w-5" />
					{t("teacher.faculties.actions.add")}
				</button>
			</div>

			<div className="card bg-base-100 shadow-xl">
				{faculties?.length === 0 ? (
					<div className="card-body items-center py-12 text-center">
						<Building2 className="h-16 w-16 text-base-content/20" />
						<h2 className="card-title mt-4">
							{t("teacher.faculties.empty.title")}
						</h2>
						<p className="text-base-content/60">
							{t("teacher.faculties.empty.description")}
						</p>
						<button
							onClick={() => {
								setEditingFaculty(null);
								reset();
								setIsFormOpen(true);
							}}
							className="btn btn-primary mt-4"
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("teacher.faculties.actions.add")}
						</button>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="table">
							<thead>
								<tr>
									<th>{t("teacher.faculties.table.name")}</th>
									<th>{t("teacher.faculties.table.description")}</th>
									<th>{t("common.table.actions")}</th>
								</tr>
							</thead>
							<tbody>
								{faculties?.map((faculty) => (
									<tr key={faculty.id}>
										<td className="font-medium">{faculty.name}</td>
										<td>
											{faculty.description || (
												<span className="text-base-content/40 italic">
													{t("teacher.faculties.table.noDescription")}
												</span>
											)}
										</td>
										<td>
											<div className="flex gap-2">
												<button
													onClick={() => {
														setEditingFaculty(faculty);
														reset({
															name: faculty.name,
															description: faculty.description || "",
														});
														setIsFormOpen(true);
													}}
													className="btn btn-square btn-sm btn-ghost"
												>
													<Pencil className="h-4 w-4" />
												</button>
												<button
													onClick={() => openDeleteModal(faculty.id)}
													className="btn btn-square btn-sm btn-ghost text-error"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<FormModal
				isOpen={isFormOpen}
				onClose={() => {
					setIsFormOpen(false);
					setEditingFaculty(null);
					reset();
				}}
				title={
					editingFaculty
						? t("teacher.faculties.form.editTitle")
						: t("teacher.faculties.form.createTitle")
				}
			>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="form-control">
						<label className="label">
							<span className="label-text">
								{t("teacher.faculties.form.nameLabel")}
							</span>
						</label>
						<input
							type="text"
							{...register("name")}
							className="input input-bordered"
							placeholder={t("teacher.faculties.form.namePlaceholder")}
						/>
						{errors.name && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.name.message}
								</span>
							</label>
						)}
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">
								{t("teacher.faculties.form.descriptionLabel")}
							</span>
						</label>
						<textarea
							{...register("description")}
							className="textarea textarea-bordered"
							placeholder={t("teacher.faculties.form.descriptionPlaceholder")}
							rows={3}
						/>
						{errors.description && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.description.message}
								</span>
							</label>
						)}
					</div>

					<div className="modal-action">
						<button
							type="button"
							onClick={() => {
								setIsFormOpen(false);
								setEditingFaculty(null);
								reset();
							}}
							className="btn btn-ghost"
							disabled={isSubmitting}
						>
							{t("common.actions.cancel")}
						</button>
						<button
							type="submit"
							className="btn btn-primary"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<span className="loading loading-spinner loading-sm" />
							) : editingFaculty ? (
								t("common.actions.saveChanges")
							) : (
								t("teacher.faculties.form.submit")
							)}
						</button>
					</div>
				</form>
			</FormModal>

			<ConfirmModal
				isOpen={isDeleteOpen}
				onClose={() => {
					setIsDeleteOpen(false);
					setDeleteId(null);
				}}
				onConfirm={handleDelete}
				title={t("teacher.faculties.delete.title")}
				message={t("teacher.faculties.delete.message")}
				confirmText={t("common.actions.delete")}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}

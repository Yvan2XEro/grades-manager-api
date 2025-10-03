import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, School, Trash2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { trpcClient } from "../../utils/trpc";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

const buildProgramSchema = (t: TFunction) =>
	z.object({
		name: z.string().min(2, t("teacher.programs.validation.name")),
		description: z.string().optional(),
		faculty: z.string({ required_error: t("teacher.programs.validation.faculty") }),
	});

type ProgramFormData = z.infer<ReturnType<typeof buildProgramSchema>>;

interface Program {
	id: string;
	name: string;
	description: string | null;
	faculty_id: string;
	faculty: {
		name: string;
	};
}

export default function ProgramManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingProgram, setEditingProgram] = useState<Program | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const nameId = useId();
	const facultyId = useId();
	const descId = useId();

	const queryClient = useQueryClient();
  const { t } = useTranslation();
  const programSchema = useMemo(() => buildProgramSchema(t), [t]);

	const { data: programs, isLoading } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const [programRes, facultyRes] = await Promise.all([
				trpcClient.programs.list.query({}),
				trpcClient.faculties.list.query({}),
			]);
			const facultyMap = new Map(facultyRes.items.map((f) => [f.id, f.name]));
			return programRes.items.map((p) => ({
				id: p.id,
				name: p.name,
				description: p.description ?? null,
				faculty_id: p.faculty,
				faculty: { name: facultyMap.get(p.faculty) ?? "" },
			})) as Program[];
		},
	});

	const { data: faculties } = useQuery({
		queryKey: ["faculties"],
		queryFn: async () => {
			const { items } = await trpcClient.faculties.list.query({});
			return items;
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<ProgramFormData>({
		resolver: zodResolver(programSchema),
	});

	const createMutation = useMutation({
		mutationFn: async (data: ProgramFormData) => {
			await trpcClient.programs.create.mutate(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			toast.success(t("teacher.programs.toast.createSuccess"));
			setIsFormOpen(false);
			reset();
		},
		onError: (error: unknown) => {
			toast.error((error as Error).message || t("teacher.programs.toast.createError"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: ProgramFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.programs.update.mutate({ id, ...updateData });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			toast.success(t("teacher.programs.toast.updateSuccess"));
			setIsFormOpen(false);
			setEditingProgram(null);
			reset();
		},
		onError: (error: unknown) => {
			toast.error((error as Error).message || t("teacher.programs.toast.updateError"));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.programs.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			toast.success(t("teacher.programs.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: unknown) => {
			toast.error((error as Error).message || t("teacher.programs.toast.deleteError"));
		},
	});

	const onSubmit = async (data: ProgramFormData) => {
		if (editingProgram) {
			updateMutation.mutate({ ...data, id: editingProgram.id });
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
					<h1 className="font-bold text-2xl">{t("teacher.programs.title")}</h1>
					<p className="text-base-content/60">
						{t("teacher.programs.subtitle")}
					</p>
				</div>
				<button
					type="button"
					onClick={() => {
						setEditingProgram(null);
						reset();
						setIsFormOpen(true);
					}}
					className="btn btn-primary"
				>
					<Plus className="mr-2 h-5 w-5" />
					{t("teacher.programs.actions.add")}
				</button>
			</div>

			<div className="card bg-base-100 shadow-xl">
				{programs?.length === 0 ? (
					<div className="card-body items-center py-12 text-center">
						<School className="h-16 w-16 text-base-content/20" />
						<h2 className="card-title mt-4">
							{t("teacher.programs.empty.title")}
						</h2>
						<p className="text-base-content/60">
							{t("teacher.programs.empty.description")}
						</p>
						<button
							type="button"
							onClick={() => {
								setEditingProgram(null);
								reset();
								setIsFormOpen(true);
							}}
							className="btn btn-primary mt-4"
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("teacher.programs.actions.add")}
						</button>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="table">
							<thead>
								<tr>
									<th>{t("teacher.programs.table.name")}</th>
									<th>{t("teacher.programs.table.faculty")}</th>
									<th>{t("teacher.programs.table.description")}</th>
									<th>{t("common.table.actions")}</th>
								</tr>
							</thead>
							<tbody>
								{programs?.map((program) => (
									<tr key={program.id}>
										<td className="font-medium">{program.name}</td>
										<td>{program.faculty?.name}</td>
										<td>
											{program.description || (
												<span className="text-base-content/40 italic">
													{t("teacher.programs.table.noDescription")}
												</span>
											)}
										</td>
										<td>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => {
														setEditingProgram(program);
														reset({
															name: program.name,
															description: program.description || "",
															faculty: program.faculty_id,
														});
														setIsFormOpen(true);
													}}
													className="btn btn-square btn-sm btn-ghost"
												>
													<Pencil className="h-4 w-4" />
												</button>
												<button
													type="button"
													onClick={() => openDeleteModal(program.id)}
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
					setEditingProgram(null);
					reset();
				}}
				title={editingProgram ? "Edit Program" : "Add New Program"}
			>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="form-control">
						<label className="label" htmlFor={nameId}>
							<span className="label-text">Program Name</span>
						</label>
						<input
							id={nameId}
							type="text"
							{...register("name")}
							className="input input-bordered"
							placeholder="Enter program name"
						/>
						{errors.name && (
							<p className="label-text-alt text-error">{errors.name.message}</p>
						)}
					</div>

					<div className="form-control">
						<label className="label" htmlFor={facultyId}>
							<span className="label-text">Faculty</span>
						</label>
						<select
							id={facultyId}
							{...register("faculty")}
							className="select select-bordered w-full"
						>
							<option value="">Select a faculty</option>
							{faculties?.map((faculty) => (
								<option key={faculty.id} value={faculty.id}>
									{faculty.name}
								</option>
							))}
						</select>
						{errors.faculty && (
							<p className="label-text-alt text-error">
								{errors.faculty.message}
							</p>
						)}
					</div>

					<div className="form-control">
						<label className="label" htmlFor={descId}>
							<span className="label-text">Description</span>
						</label>
						<textarea
							id={descId}
							{...register("description")}
							className="textarea textarea-bordered"
							placeholder="Enter program description"
							rows={3}
						/>
						{errors.description && (
							<p className="label-text-alt text-error">
								{errors.description.message}
							</p>
						)}
					</div>

					<div className="modal-action">
						<button
							type="button"
							onClick={() => {
								setIsFormOpen(false);
								setEditingProgram(null);
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
							) : editingProgram ? (
								t("common.actions.saveChanges")
							) : (
								t("teacher.programs.form.submit")
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
				title={t("teacher.programs.delete.title")}
				message={t("teacher.programs.delete.message")}
				confirmText={t("common.actions.delete")}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}

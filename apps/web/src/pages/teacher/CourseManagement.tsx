import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, PlusIcon, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { trpcClient } from "../../utils/trpc";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

const buildCourseSchema = (t: TFunction) =>
	z.object({
		name: z.string().min(2, t("teacher.courses.manage.validation.name")),
		credits: z.number().min(1, t("teacher.courses.manage.validation.credits")),
		hours: z.number().min(1, t("teacher.courses.manage.validation.hours")),
		program: z.string({ required_error: t("teacher.courses.manage.validation.program") }),
		defaultTeacher: z.string({ required_error: t("teacher.courses.manage.validation.teacher") }),
	});

type CourseFormData = z.infer<ReturnType<typeof buildCourseSchema>>;

interface Course {
	id: string;
	name: string;
	credits: number;
	hours: number;
	program: string;
	defaultTeacher: string;
}

interface Program {
	id: string;
	name: string;
}

interface Teacher {
	id: string;
	name: string;
	role: string | null;
}

export default function CourseManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingCourse, setEditingCourse] = useState<Course | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const queryClient = useQueryClient();
  const { t } = useTranslation();
  const courseSchema = useMemo(() => buildCourseSchema(t), [t]);

	const { data: courses, isLoading } = useQuery({
		queryKey: ["courses"],
		queryFn: async () => {
			const { items } = await trpcClient.courses.list.query({});
			return items as Course[];
		},
	});

	const { data: programs } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({});
			return items as Program[];
		},
	});

	const { data: teachers } = useQuery({
		queryKey: ["teachers"],
		queryFn: async () => {
			const { items } = await trpcClient.users.list.query({
				role: "teacher",
				limit: 100,
			});
			return items as Teacher[];
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<CourseFormData>({
		resolver: zodResolver(courseSchema),
	});

	const programMap = new Map((programs ?? []).map((p) => [p.id, p.name]));
	const teacherMap = new Map((teachers ?? []).map((t) => [t.id, t.name]));

	const createMutation = useMutation({
		mutationFn: async (data: CourseFormData) => {
			await trpcClient.courses.create.mutate(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			toast.success(t("teacher.courses.manage.toast.createSuccess"));
			setIsFormOpen(false);
			reset();
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.courses.manage.toast.createError"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: CourseFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.courses.update.mutate({ id, ...updateData });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			toast.success(t("teacher.courses.manage.toast.updateSuccess"));
			setIsFormOpen(false);
			setEditingCourse(null);
			reset();
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.courses.manage.toast.updateError"));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.courses.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			toast.success(t("teacher.courses.manage.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.courses.manage.toast.deleteError"));
		},
	});

	const onSubmit = async (data: CourseFormData) => {
		if (editingCourse) {
			updateMutation.mutate({ ...data, id: editingCourse.id });
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
				<h1 className="font-bold text-2xl">{t("teacher.courses.manage.title")}</h1>
				<button
					onClick={() => {
						setEditingCourse(null);
						reset();
						setIsFormOpen(true);
					}}
					className="btn btn-primary"
				>
					<PlusIcon className="mr-2 h-5 w-5" />
					{t("teacher.courses.manage.actions.add")}
				</button>
			</div>

			<div className="card bg-base-100 shadow-xl">
				<div className="overflow-x-auto">
					<table className="table">
						<thead>
							<tr>
								<th>{t("teacher.courses.manage.table.name")}</th>
								<th>{t("teacher.courses.manage.table.program")}</th>
								<th>{t("teacher.courses.manage.table.credits")}</th>
								<th>{t("teacher.courses.manage.table.hours")}</th>
								<th>{t("teacher.courses.manage.table.teacher")}</th>
								<th>{t("common.table.actions")}</th>
							</tr>
						</thead>
						<tbody>
							{courses?.map((course) => (
								<tr key={course.id}>
									<td>{course.name}</td>
									<td>{programMap.get(course.program)}</td>
									<td>{course.credits}</td>
									<td>{course.hours}</td>
									<td>{teacherMap.get(course.defaultTeacher)}</td>
									<td>
										<div className="flex gap-2">
											<button
												onClick={() => {
													setEditingCourse(course);
													reset({
														name: course.name,
														credits: course.credits,
														hours: course.hours,
														program: course.program,
														defaultTeacher: course.defaultTeacher,
													});
													setIsFormOpen(true);
												}}
												className="btn btn-square btn-sm btn-ghost"
											>
												<Pencil className="h-4 w-4" />
											</button>
											<button
												onClick={() => openDeleteModal(course.id)}
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
			</div>

			<FormModal
				isOpen={isFormOpen}
				onClose={() => {
					setIsFormOpen(false);
					setEditingCourse(null);
					reset();
				}}
				title={editingCourse ? "Edit Course" : "Add New Course"}
			>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="form-control">
						<label className="label">
							<span className="label-text">Course Name</span>
						</label>
						<input
							type="text"
							{...register("name")}
							className="input input-bordered"
							placeholder="Enter course name"
						/>
						{errors.name && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.name.message}
								</span>
							</label>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="form-control">
						<label className="label">
							<span className="label-text">
								{t("teacher.courses.manage.form.creditsLabel")}
							</span>
						</label>
							<input
								type="number"
								{...register("credits", { valueAsNumber: true })}
							className="input input-bordered"
							placeholder={t("teacher.courses.manage.form.creditsPlaceholder")}
							/>
							{errors.credits && (
								<label className="label">
									<span className="label-text-alt text-error">
										{errors.credits.message}
									</span>
								</label>
							)}
						</div>

						<div className="form-control">
						<label className="label">
							<span className="label-text">
								{t("teacher.courses.manage.form.hoursLabel")}
							</span>
						</label>
							<input
								type="number"
								{...register("hours", { valueAsNumber: true })}
							className="input input-bordered"
							placeholder={t("teacher.courses.manage.form.hoursPlaceholder")}
							/>
							{errors.hours && (
								<label className="label">
									<span className="label-text-alt text-error">
										{errors.hours.message}
									</span>
								</label>
							)}
						</div>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">
								{t("teacher.courses.manage.form.programLabel")}
							</span>
						</label>
						<select
							{...register("program")}
							className="select select-bordered w-full"
						>
							<option value="">
								{t("teacher.courses.manage.form.programPlaceholder")}
							</option>
							{programs?.map((program) => (
								<option key={program.id} value={program.id}>
									{program.name}
								</option>
							))}
						</select>
						{errors.program && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.program.message}
								</span>
							</label>
						)}
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">
								{t("teacher.courses.manage.form.teacherLabel")}
							</span>
						</label>
						<select
							{...register("defaultTeacher")}
							className="select select-bordered w-full"
						>
							<option value="">
								{t("teacher.courses.manage.form.teacherPlaceholder")}
							</option>
							{teachers?.map((teacher) => (
								<option key={teacher.id} value={teacher.id}>
									{teacher.name}
								</option>
							))}
						</select>
						{errors.defaultTeacher && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.defaultTeacher.message}
								</span>
							</label>
						)}
					</div>

					<div className="modal-action">
						<button
							type="button"
							onClick={() => {
								setIsFormOpen(false);
								setEditingCourse(null);
								reset();
							}}
							className="btn btn-ghost"
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
							) : editingCourse ? (
								t("common.actions.saveChanges")
							) : (
								t("teacher.courses.manage.form.submit")
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
				title={t("teacher.courses.manage.delete.title")}
				message={t("teacher.courses.manage.delete.message")}
				confirmText={t("common.actions.delete")}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}

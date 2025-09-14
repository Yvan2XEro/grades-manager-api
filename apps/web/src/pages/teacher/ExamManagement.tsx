import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { trpcClient } from "../../utils/trpc";

const examSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	type: z.string().min(2, "Type must be at least 2 characters"),
	date: z.string().min(1, "Date is required"),
	percentage: z
		.number()
		.min(1, "Percentage must be at least 1")
		.max(100, "Percentage cannot exceed 100"),
	classCourseId: z.string({ required_error: "Please select a course" }),
});

type ExamFormData = z.infer<typeof examSchema>;

interface Exam {
	id: string;
	name: string;
	type: string;
	date: string;
	percentage: number;
	classCourse: string;
	isLocked: boolean;
}

interface ClassCourse {
	id: string;
	class: string;
	course: string;
}

interface Class {
	id: string;
	name: string;
}

interface Course {
	id: string;
	name: string;
}

export default function ExamManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingExam, setEditingExam] = useState<Exam | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const queryClient = useQueryClient();

	const { data: exams, isLoading } = useQuery({
		queryKey: ["exams"],
		queryFn: async () => {
			const { items } = await trpcClient.exams.list.query({});
			return items as Exam[];
		},
	});

	const { data: classCourses } = useQuery({
		queryKey: ["classCourses"],
		queryFn: async () => {
			const { items } = await trpcClient.classCourses.list.query({});
			return items as ClassCourse[];
		},
	});

	const { data: classes } = useQuery({
		queryKey: ["classes"],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({});
			return items as Class[];
		},
	});

	const { data: courses } = useQuery({
		queryKey: ["courses"],
		queryFn: async () => {
			const { items } = await trpcClient.courses.list.query({});
			return items as Course[];
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<ExamFormData>({
		resolver: zodResolver(examSchema),
	});

	const classMap = new Map((classes ?? []).map((c) => [c.id, c.name]));
	const courseMap = new Map((courses ?? []).map((c) => [c.id, c.name]));
	const classCourseMap = new Map((classCourses ?? []).map((cc) => [cc.id, cc]));

	const createMutation = useMutation({
		mutationFn: async (data: ExamFormData) => {
			await trpcClient.exams.create.mutate({
				...data,
				date: new Date(data.date),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exams"] });
			toast.success("Exam created successfully");
			setIsFormOpen(false);
			reset();
		},
		onError: (error: any) => {
			toast.error(`Error creating exam: ${error.message}`);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: ExamFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.exams.update.mutate({
				id,
				...updateData,
				date: new Date(updateData.date),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exams"] });
			toast.success("Exam updated successfully");
			setIsFormOpen(false);
			setEditingExam(null);
			reset();
		},
		onError: (error: any) => {
			toast.error(`Error updating exam: ${error.message}`);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.exams.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exams"] });
			toast.success("Exam deleted successfully");
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: any) => {
			toast.error(`Error deleting exam: ${error.message}`);
		},
	});

	const onSubmit = async (data: ExamFormData) => {
		if (editingExam) {
			updateMutation.mutate({ ...data, id: editingExam.id });
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
					<h1 className="font-bold text-2xl">Exam Management</h1>
					<p className="text-base-content/60">Create and manage course exams</p>
				</div>
				<button
					onClick={() => {
						setEditingExam(null);
						reset();
						setIsFormOpen(true);
					}}
					className="btn btn-primary"
				>
					<Plus className="mr-2 h-5 w-5" />
					Add Exam
				</button>
			</div>

			<div className="card bg-base-100 shadow-xl">
				{exams?.length === 0 ? (
					<div className="card-body items-center py-12 text-center">
						<ClipboardList className="h-16 w-16 text-base-content/20" />
						<h2 className="card-title mt-4">No Exams Found</h2>
						<p className="text-base-content/60">
							Get started by adding your first exam.
						</p>
						<button
							onClick={() => {
								setEditingExam(null);
								reset();
								setIsFormOpen(true);
							}}
							className="btn btn-primary mt-4"
						>
							<Plus className="mr-2 h-4 w-4" />
							Add Exam
						</button>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="table">
							<thead>
								<tr>
									<th>Name</th>
									<th>Course</th>
									<th>Class</th>
									<th>Type</th>
									<th>Date</th>
									<th>Percentage</th>
									<th>Status</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{exams?.map((exam) => (
									<tr key={exam.id}>
										<td className="font-medium">{exam.name}</td>
										<td>
											{courseMap.get(
												classCourseMap.get(exam.classCourse)?.course || "",
											)}
										</td>
										<td>
											{classMap.get(
												classCourseMap.get(exam.classCourse)?.class || "",
											)}
										</td>
										<td>{exam.type}</td>
										<td>{format(new Date(exam.date), "MMM d, yyyy")}</td>
										<td>{exam.percentage}%</td>
										<td>
											<span
												className={`badge ${exam.isLocked ? "badge-warning" : "badge-success"
													}`}
											>
												{exam.isLocked ? "Locked" : "Open"}
											</span>
										</td>
										<td>
											<div className="flex gap-2">
												<button
													onClick={() => {
														setEditingExam(exam);
														reset({
															name: exam.name,
															type: exam.type,
															date: exam.date.split("T")[0],
															percentage: exam.percentage,
															classCourseId: exam.classCourse,
														});
														setIsFormOpen(true);
													}}
													className="btn btn-square btn-sm btn-ghost"
													disabled={exam.isLocked}
												>
													<Pencil className="h-4 w-4" />
												</button>
												<button
													onClick={() => openDeleteModal(exam.id)}
													className="btn btn-square btn-sm btn-ghost text-error"
													disabled={exam.isLocked}
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
					setEditingExam(null);
					reset();
				}}
				title={editingExam ? "Edit Exam" : "Add New Exam"}
			>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="form-control">
						<label className="label">
							<span className="label-text">Course</span>
						</label>
						<select
							{...register("classCourseId")}
							className="select select-bordered w-full"
						>
							<option value="">Select a course</option>
							{classCourses?.map((cc) => (
								<option key={cc.id} value={cc.id}>
									{courseMap.get(cc.course)} - {classMap.get(cc.class)}
								</option>
							))}
						</select>
						{errors.classCourseId && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.classCourseId.message}
								</span>
							</label>
						)}
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">Exam Name</span>
						</label>
						<input
							type="text"
							{...register("name")}
							className="input input-bordered"
							placeholder="Enter exam name"
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
							<span className="label-text">Type</span>
						</label>
						<input
							type="text"
							{...register("type")}
							className="input input-bordered"
							placeholder="e.g., Midterm, Final"
						/>
						{errors.type && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.type.message}
								</span>
							</label>
						)}
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">Date</span>
						</label>
						<input
							type="date"
							{...register("date")}
							className="input input-bordered"
						/>
						{errors.date && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.date.message}
								</span>
							</label>
						)}
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">Percentage</span>
						</label>
						<input
							type="number"
							{...register("percentage", { valueAsNumber: true })}
							className="input input-bordered"
							placeholder="Enter percentage (1-100)"
						/>
						{errors.percentage && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.percentage.message}
								</span>
							</label>
						)}
					</div>

					<div className="modal-action">
						<button
							type="button"
							onClick={() => {
								setIsFormOpen(false);
								setEditingExam(null);
								reset();
							}}
							className="btn btn-ghost"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="btn btn-primary"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<span className="loading loading-spinner loading-sm" />
							) : editingExam ? (
								"Save Changes"
							) : (
								"Create Exam"
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
				title="Delete Exam"
				message="Are you sure you want to delete this exam? This action cannot be undone and will also delete all associated grades."
				confirmText="Delete"
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}

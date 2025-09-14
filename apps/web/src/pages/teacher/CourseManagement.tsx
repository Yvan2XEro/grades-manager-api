import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, PlusIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { trpcClient } from "../../utils/trpc";

const courseSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	credits: z.number().min(1, "Credits must be at least 1"),
	hours: z.number().min(1, "Hours must be at least 1"),
	program: z.string({ required_error: "Please select a program" }),
	defaultTeacher: z.string({ required_error: "Please select a teacher" }),
});

type CourseFormData = z.infer<typeof courseSchema>;

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
			toast.success("Course created successfully");
			setIsFormOpen(false);
			reset();
		},
		onError: (error: any) => {
			toast.error(`Error creating course: ${error.message}`);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: CourseFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.courses.update.mutate({ id, ...updateData });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			toast.success("Course updated successfully");
			setIsFormOpen(false);
			setEditingCourse(null);
			reset();
		},
		onError: (error: any) => {
			toast.error(`Error updating course: ${error.message}`);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.courses.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			toast.success("Course deleted successfully");
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: any) => {
			toast.error(`Error deleting course: ${error.message}`);
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
				<h1 className="font-bold text-2xl">Course Management</h1>
				<button
					onClick={() => {
						setEditingCourse(null);
						reset();
						setIsFormOpen(true);
					}}
					className="btn btn-primary"
				>
					<PlusIcon className="mr-2 h-5 w-5" />
					Add Course
				</button>
			</div>

			<div className="card bg-base-100 shadow-xl">
				<div className="overflow-x-auto">
					<table className="table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Program</th>
								<th>Credits</th>
								<th>Hours</th>
								<th>Default Teacher</th>
								<th>Actions</th>
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
								<span className="label-text">Credits</span>
							</label>
							<input
								type="number"
								{...register("credits", { valueAsNumber: true })}
								className="input input-bordered"
								placeholder="Enter credits"
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
								<span className="label-text">Hours</span>
							</label>
							<input
								type="number"
								{...register("hours", { valueAsNumber: true })}
								className="input input-bordered"
								placeholder="Enter hours"
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
							<span className="label-text">Program</span>
						</label>
						<select
							{...register("program")}
							className="select select-bordered w-full"
						>
							<option value="">Select a program</option>
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
							<span className="label-text">Default Teacher</span>
						</label>
						<select
							{...register("defaultTeacher")}
							className="select select-bordered w-full"
						>
							<option value="">Select a teacher</option>
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
							Cancel
						</button>
						<button
							type="submit"
							className="btn btn-primary"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<span className="loading loading-spinner loading-sm" />
							) : editingCourse ? (
								"Save Changes"
							) : (
								"Create Course"
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
				title="Delete Course"
				message="Are you sure you want to delete this course? This action cannot be undone."
				confirmText="Delete"
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}

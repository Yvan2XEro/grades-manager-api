import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { trpcClient } from "../../utils/trpc";

const classCourseSchema = z.object({
	class: z.string({ required_error: "Please select a class" }),
	course: z.string({ required_error: "Please select a course" }),
	teacher: z.string({ required_error: "Please select a teacher" }),
});

type ClassCourseFormData = z.infer<typeof classCourseSchema>;

interface ClassCourse {
	id: string;
	class: string;
	course: string;
	teacher: string;
}

interface Class {
	id: string;
	name: string;
	program: string;
}

interface Course {
	id: string;
	name: string;
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

export default function ClassCourseManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingClassCourse, setEditingClassCourse] =
		useState<ClassCourse | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const queryClient = useQueryClient();

	const { data: activeYear } = useQuery({
		queryKey: ["activeYear"],
		queryFn: async () => {
			const { items } = await trpcClient.academicYears.list.query({});
			return items.find((y: any) => y.isActive);
		},
	});

	const { data: classes } = useQuery({
		queryKey: ["activeClasses", activeYear?.id],
		queryFn: async () => {
			if (!activeYear) return [];
			const { items } = await trpcClient.classes.list.query({
				academicYearId: activeYear.id,
			});
			return items as Class[];
		},
		enabled: !!activeYear,
	});

	const { data: programs } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({});
			return items as Program[];
		},
	});

	const { data: courses } = useQuery({
		queryKey: ["courses"],
		queryFn: async () => {
			const { items } = await trpcClient.courses.list.query({});
			return items as Course[];
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

	const { data: classCourses, isLoading } = useQuery({
		queryKey: ["classCourses"],
		queryFn: async () => {
			const { items } = await trpcClient.classCourses.list.query({});
			return items as ClassCourse[];
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<ClassCourseFormData>({
		resolver: zodResolver(classCourseSchema),
	});

	const classMap = new Map((classes ?? []).map((c) => [c.id, c]));
	const courseMap = new Map((courses ?? []).map((c) => [c.id, c.name]));
	const programMap = new Map((programs ?? []).map((p) => [p.id, p.name]));
	const teacherMap = new Map((teachers ?? []).map((t) => [t.id, t.name]));
	const activeClassIds = new Set((classes ?? []).map((c) => c.id));
	const displayedClassCourses = (classCourses ?? []).filter((cc) =>
		activeClassIds.has(cc.class),
	);

	const createMutation = useMutation({
		mutationFn: async (data: ClassCourseFormData) => {
			await trpcClient.classCourses.create.mutate(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classCourses"] });
			toast.success("Course assignment created successfully");
			setIsFormOpen(false);
			reset();
		},
		onError: (error: any) => {
			toast.error(`Error creating course assignment: ${error.message}`);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: ClassCourseFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.classCourses.update.mutate({ id, ...updateData });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classCourses"] });
			toast.success("Course assignment updated successfully");
			setIsFormOpen(false);
			setEditingClassCourse(null);
			reset();
		},
		onError: (error: any) => {
			toast.error(`Error updating course assignment: ${error.message}`);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.classCourses.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classCourses"] });
			toast.success("Course assignment deleted successfully");
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: any) => {
			toast.error(`Error deleting course assignment: ${error.message}`);
		},
	});

	const onSubmit = async (data: ClassCourseFormData) => {
		if (editingClassCourse) {
			updateMutation.mutate({ ...data, id: editingClassCourse.id });
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
					<h1 className="font-bold text-2xl">Course Assignments</h1>
					<p className="text-base-content/60">
						Manage course assignments for classes
					</p>
				</div>
				<button
					onClick={() => {
						setEditingClassCourse(null);
						reset();
						setIsFormOpen(true);
					}}
					className="btn btn-primary"
				>
					<Plus className="mr-2 h-5 w-5" />
					Assign Course
				</button>
			</div>

			<div className="card bg-base-100 shadow-xl">
				{displayedClassCourses.length === 0 ? (
					<div className="card-body items-center py-12 text-center">
						<BookOpen className="h-16 w-16 text-base-content/20" />
						<h2 className="card-title mt-4">No Course Assignments</h2>
						<p className="text-base-content/60">
							Get started by assigning a course to a class.
						</p>
						<button
							onClick={() => {
								setEditingClassCourse(null);
								reset();
								setIsFormOpen(true);
							}}
							className="btn btn-primary mt-4"
						>
							<Plus className="mr-2 h-4 w-4" />
							Assign Course
						</button>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="table">
							<thead>
								<tr>
									<th>Class</th>
									<th>Program</th>
									<th>Course</th>
									<th>Teacher</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{displayedClassCourses?.map((cc) => (
									<tr key={cc.id}>
										<td className="font-medium">
											{classMap.get(cc.class)?.name}
										</td>
										<td>
											{programMap.get(classMap.get(cc.class)?.program || "")}
										</td>
										<td>{courseMap.get(cc.course)}</td>
										<td>{teacherMap.get(cc.teacher)}</td>
										<td>
											<div className="flex gap-2">
												<button
													onClick={() => {
														setEditingClassCourse(cc);
														reset({
															class: cc.class,
															course: cc.course,
															teacher: cc.teacher,
														});
														setIsFormOpen(true);
													}}
													className="btn btn-square btn-sm btn-ghost"
												>
													<Pencil className="h-4 w-4" />
												</button>
												<button
													onClick={() => openDeleteModal(cc.id)}
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
					setEditingClassCourse(null);
					reset();
				}}
				title={
					editingClassCourse
						? "Edit Course Assignment"
						: "New Course Assignment"
				}
			>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="form-control">
						<label className="label">
							<span className="label-text">Class</span>
						</label>
						<select
							{...register("class")}
							className="select select-bordered w-full"
						>
							<option value="">Select a class</option>
							{classes?.map((cls) => (
								<option key={cls.id} value={cls.id}>
									{cls.name} - {programMap.get(cls.program)}
								</option>
							))}
						</select>
						{errors.class && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.class.message}
								</span>
							</label>
						)}
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">Course</span>
						</label>
						<select
							{...register("course")}
							className="select select-bordered w-full"
						>
							<option value="">Select a course</option>
							{courses?.map((course) => (
								<option key={course.id} value={course.id}>
									{course.name}
								</option>
							))}
						</select>
						{errors.course && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.course.message}
								</span>
							</label>
						)}
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">Teacher</span>
						</label>
						<select
							{...register("teacher")}
							className="select select-bordered w-full"
						>
							<option value="">Select a teacher</option>
							{teachers?.map((teacher) => (
								<option key={teacher.id} value={teacher.id}>
									{teacher.name}
								</option>
							))}
						</select>
						{errors.teacher && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.teacher.message}
								</span>
							</label>
						)}
					</div>

					<div className="modal-action">
						<button
							type="button"
							onClick={() => {
								setIsFormOpen(false);
								setEditingClassCourse(null);
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
							) : editingClassCourse ? (
								"Save Changes"
							) : (
								"Create Assignment"
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
				title="Delete Course Assignment"
				message="Are you sure you want to delete this course assignment? This action cannot be undone and will also delete all associated exams and grades."
				confirmText="Delete"
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Pencil, PlusIcon, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { Spinner } from "../../components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import type { RouterOutputs } from "../../utils/trpc";
import { trpcClient } from "../../utils/trpc";

const buildCourseSchema = (t: TFunction) =>
	z.object({
		name: z.string().min(2, t("teacher.courses.manage.validation.name")),
		credits: z.number().min(1, t("teacher.courses.manage.validation.credits")),
		hours: z.number().min(1, t("teacher.courses.manage.validation.hours")),
		program: z.string({
			required_error: t("teacher.courses.manage.validation.program"),
		}),
		defaultTeacher: z.string({
			required_error: t("teacher.courses.manage.validation.teacher"),
		}),
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

type Teacher = RouterOutputs["users"]["list"]["items"][number];

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
			return items;
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<CourseFormData>({
		resolver: zodResolver(courseSchema),
	});

	const programMap = new Map((programs ?? []).map((p) => [p.id, p.name]));
	const formatTeacherName = (teacher: Teacher) =>
		[teacher.firstName, teacher.lastName].filter(Boolean).join(" ") ||
		teacher.email;
	const teacherOptions = useMemo(
		() =>
			(teachers ?? []).filter(
				(
					teacher,
				): teacher is Teacher & {
					authUserId: string;
				} => Boolean(teacher.authUserId),
			),
		[teachers],
	);
	const teacherMap = new Map(
		teacherOptions.map((teacher) => [
			teacher.authUserId,
			formatTeacherName(teacher),
		]),
	);

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
			toast.error(
				error.message || t("teacher.courses.manage.toast.createError"),
			);
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
			toast.error(
				error.message || t("teacher.courses.manage.toast.updateError"),
			);
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
			toast.error(
				error.message || t("teacher.courses.manage.toast.deleteError"),
			);
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
				<Spinner className="h-6 w-6" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">
						{t("teacher.courses.manage.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("teacher.courses.manage.subtitle", {
							defaultValue: t("teacher.classCourses.subtitle"),
						})}
					</p>
				</div>
				<Button
					onClick={() => {
						setEditingCourse(null);
						reset();
						setIsFormOpen(true);
					}}
				>
					<PlusIcon className="mr-2 h-5 w-5" />
					{t("teacher.courses.manage.actions.add")}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("teacher.courses.manage.title")}</CardTitle>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("teacher.courses.manage.table.name")}</TableHead>
								<TableHead>
									{t("teacher.courses.manage.table.program")}
								</TableHead>
								<TableHead>
									{t("teacher.courses.manage.table.credits")}
								</TableHead>
								<TableHead>{t("teacher.courses.manage.table.hours")}</TableHead>
								<TableHead>
									{t("teacher.courses.manage.table.teacher")}
								</TableHead>
								<TableHead className="text-right">
									{t("common.table.actions")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{courses?.map((course) => (
								<TableRow key={course.id}>
									<TableCell className="font-medium">{course.name}</TableCell>
									<TableCell>{programMap.get(course.program)}</TableCell>
									<TableCell>{course.credits}</TableCell>
									<TableCell>{course.hours}</TableCell>
									<TableCell>{teacherMap.get(course.defaultTeacher)}</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Button
												variant="ghost"
												size="icon"
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
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="text-destructive"
												onClick={() => openDeleteModal(course.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<FormModal
				isOpen={isFormOpen}
				onClose={() => {
					setIsFormOpen(false);
					setEditingCourse(null);
					reset();
				}}
				title={editingCourse ? "Edit Course" : "Add New Course"}
			>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="course-name">Course Name</Label>
						<Input
							id="course-name"
							type="text"
							{...register("name")}
							placeholder="Enter course name"
						/>
						{errors.name ? (
							<p className="text-destructive text-sm">{errors.name.message}</p>
						) : null}
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="course-credits">
								{t("teacher.courses.manage.form.creditsLabel")}
							</Label>
							<Input
								id="course-credits"
								type="number"
								{...register("credits", { valueAsNumber: true })}
								placeholder={t(
									"teacher.courses.manage.form.creditsPlaceholder",
								)}
							/>
							{errors.credits ? (
								<p className="text-destructive text-sm">
									{errors.credits.message}
								</p>
							) : null}
						</div>

						<div className="space-y-2">
							<Label htmlFor="course-hours">
								{t("teacher.courses.manage.form.hoursLabel")}
							</Label>
							<Input
								id="course-hours"
								type="number"
								{...register("hours", { valueAsNumber: true })}
								placeholder={t("teacher.courses.manage.form.hoursPlaceholder")}
							/>
							{errors.hours ? (
								<p className="text-destructive text-sm">
									{errors.hours.message}
								</p>
							) : null}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="course-program">
							{t("teacher.courses.manage.form.programLabel")}
						</Label>
						<Select
							value={watch("program")}
							onValueChange={(value) => setValue("program", value)}
						>
							<SelectTrigger id="course-program">
								<SelectValue
									placeholder={t(
										"teacher.courses.manage.form.programPlaceholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								{programs?.map((program) => (
									<SelectItem key={program.id} value={program.id}>
										{program.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.program ? (
							<p className="text-destructive text-sm">
								{errors.program.message}
							</p>
						) : null}
					</div>

					<div className="space-y-2">
						<Label htmlFor="course-teacher">
							{t("teacher.courses.manage.form.teacherLabel")}
						</Label>
						<Select
							value={watch("defaultTeacher")}
							onValueChange={(value) => setValue("defaultTeacher", value)}
						>
							<SelectTrigger id="course-teacher">
								<SelectValue
									placeholder={t(
										"teacher.courses.manage.form.teacherPlaceholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								{teacherOptions.map((teacher) => (
									<SelectItem
										key={teacher.authUserId}
										value={teacher.authUserId}
									>
										{formatTeacherName(teacher)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.defaultTeacher ? (
							<p className="text-destructive text-sm">
								{errors.defaultTeacher.message}
							</p>
						) : null}
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setIsFormOpen(false);
								setEditingCourse(null);
								reset();
							}}
							disabled={isSubmitting}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<Spinner className="mr-2" />
							) : editingCourse ? (
								t("common.actions.saveChanges")
							) : (
								t("teacher.courses.manage.form.submit")
							)}
						</Button>
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

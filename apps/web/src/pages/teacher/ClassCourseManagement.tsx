import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Empty } from "../../components/ui/empty";
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

const buildClassCourseSchema = (t: TFunction) =>
	z.object({
		class: z.string({
			required_error: t("teacher.classCourses.validation.class"),
		}),
		course: z.string({
			required_error: t("teacher.classCourses.validation.course"),
		}),
		teacher: z.string({
			required_error: t("teacher.classCourses.validation.teacher"),
		}),
	});

type ClassCourseFormData = z.infer<ReturnType<typeof buildClassCourseSchema>>;

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

type Teacher = RouterOutputs["users"]["list"]["items"][number];

export default function ClassCourseManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingClassCourse, setEditingClassCourse] =
		useState<ClassCourse | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const classCourseSchema = useMemo(() => buildClassCourseSchema(t), [t]);

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
			return items;
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
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<ClassCourseFormData>({
		resolver: zodResolver(classCourseSchema),
	});

	const classMap = new Map((classes ?? []).map((c) => [c.id, c]));
	const courseMap = new Map((courses ?? []).map((c) => [c.id, c.name]));
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
			toast.success(t("teacher.classCourses.toast.createSuccess"));
			setIsFormOpen(false);
			reset();
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.classCourses.toast.createError"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: ClassCourseFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.classCourses.update.mutate({ id, ...updateData });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classCourses"] });
			toast.success(t("teacher.classCourses.toast.updateSuccess"));
			setIsFormOpen(false);
			setEditingClassCourse(null);
			reset();
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.classCourses.toast.updateError"));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.classCourses.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classCourses"] });
			toast.success(t("teacher.classCourses.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: any) => {
			toast.error(error.message || t("teacher.classCourses.toast.deleteError"));
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
				<Spinner className="h-6 w-6" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">
						{t("teacher.classCourses.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("teacher.classCourses.subtitle")}
					</p>
				</div>
				<Button
					onClick={() => {
						setEditingClassCourse(null);
						reset();
						setIsFormOpen(true);
					}}
				>
					<Plus className="mr-2 h-5 w-5" />
					{t("teacher.classCourses.actions.add")}
				</Button>
			</div>

			<Card>
				{displayedClassCourses.length === 0 ? (
					<Empty
						icon={BookOpen}
						title={t("teacher.classCourses.empty.title")}
						description={t("teacher.classCourses.empty.description")}
						actionLabel={t("teacher.classCourses.actions.add")}
						onAction={() => {
							setEditingClassCourse(null);
							reset();
							setIsFormOpen(true);
						}}
					/>
				) : (
					<>
						<CardHeader>
							<CardTitle>{t("teacher.classCourses.title")}</CardTitle>
						</CardHeader>
						<CardContent className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											{t("teacher.classCourses.table.class")}
										</TableHead>
										<TableHead>
											{t("teacher.classCourses.table.program")}
										</TableHead>
										<TableHead>
											{t("teacher.classCourses.table.course")}
										</TableHead>
										<TableHead>
											{t("teacher.classCourses.table.teacher")}
										</TableHead>
										<TableHead className="text-right">
											{t("common.table.actions")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{displayedClassCourses?.map((cc) => (
										<TableRow key={cc.id}>
											<TableCell className="font-medium">
												{classMap.get(cc.class)?.name}
											</TableCell>
											<TableCell>
												{programMap.get(classMap.get(cc.class)?.program || "")}
											</TableCell>
											<TableCell>{courseMap.get(cc.course)}</TableCell>
											<TableCell>{teacherMap.get(cc.teacher)}</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="ghost"
														size="icon"
														onClick={() => {
															setEditingClassCourse(cc);
															reset({
																class: cc.class,
																course: cc.course,
																teacher: cc.teacher,
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
														onClick={() => openDeleteModal(cc.id)}
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
					</>
				)}
			</Card>

			<FormModal
				isOpen={isFormOpen}
				onClose={() => {
					setIsFormOpen(false);
					setEditingClassCourse(null);
					reset();
				}}
				title={
					editingClassCourse
						? t("teacher.classCourses.form.editTitle")
						: t("teacher.classCourses.form.createTitle")
				}
			>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="class-select">
							{t("teacher.classCourses.form.classLabel")}
						</Label>
						<Select
							value={watch("class")}
							onValueChange={(value) => setValue("class", value)}
						>
							<SelectTrigger id="class-select">
								<SelectValue
									placeholder={t("teacher.classCourses.form.classPlaceholder")}
								/>
							</SelectTrigger>
							<SelectContent>
								{classes?.map((cls) => (
									<SelectItem key={cls.id} value={cls.id}>
										{cls.name} - {programMap.get(cls.program)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.class ? (
							<p className="text-destructive text-sm">{errors.class.message}</p>
						) : null}
					</div>

					<div className="space-y-2">
						<Label htmlFor="course-select">
							{t("teacher.classCourses.form.courseLabel")}
						</Label>
						<Select
							value={watch("course")}
							onValueChange={(value) => setValue("course", value)}
						>
							<SelectTrigger id="course-select">
								<SelectValue
									placeholder={t("teacher.classCourses.form.coursePlaceholder")}
								/>
							</SelectTrigger>
							<SelectContent>
								{courses?.map((course) => (
									<SelectItem key={course.id} value={course.id}>
										{course.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.course ? (
							<p className="text-destructive text-sm">
								{errors.course.message}
							</p>
						) : null}
					</div>

					<div className="space-y-2">
						<Label htmlFor="teacher-select">
							{t("teacher.classCourses.form.teacherLabel")}
						</Label>
						<Select
							value={watch("teacher")}
							onValueChange={(value) => setValue("teacher", value)}
						>
							<SelectTrigger id="teacher-select">
								<SelectValue
									placeholder={t(
										"teacher.classCourses.form.teacherPlaceholder",
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
						{errors.teacher ? (
							<p className="text-destructive text-sm">
								{errors.teacher.message}
							</p>
						) : null}
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setIsFormOpen(false);
								setEditingClassCourse(null);
								reset();
							}}
							disabled={isSubmitting}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<Spinner className="mr-2" />
							) : editingClassCourse ? (
								t("common.actions.saveChanges")
							) : (
								t("teacher.classCourses.form.submit")
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
				title={t("teacher.classCourses.delete.title")}
				message={t("teacher.classCourses.delete.message")}
				confirmText={t("common.actions.delete")}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}

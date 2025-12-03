import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { generateClassCourseCode } from "@/lib/code-generator";
import type { RouterOutputs } from "@/utils/trpc";
import { trpcClient } from "@/utils/trpc";

const buildClassCourseSchema = (t: TFunction) =>
	z
		.object({
			class: z.string({
				required_error: t("admin.classCourses.validation.class"),
			}),
			course: z.string({
				required_error: t("admin.classCourses.validation.course"),
			}),
			teacher: z.string({
				required_error: t("admin.classCourses.validation.teacher"),
			}),
		})
		.extend({
			code: z.string().min(
				3,
				t("admin.classCourses.validation.code", {
					defaultValue: "Code is required",
				}),
			),
			semesterId: z.string().optional(),
		});

type ClassCourseFormData = z.infer<ReturnType<typeof buildClassCourseSchema>>;

interface ClassCourse {
	id: string;
	code: string;
	class: string;
	course: string;
	teacher: string;
	semesterId: string | null;
	courseName?: string | null;
	courseCode?: string | null;
}

interface Class {
	id: string;
	name: string;
	code: string;
	program: string;
	programCode?: string | null;
	academicYearName?: string;
	semesterId?: string | null;
	semesterCode?: string | null;
	cycleLevelCode?: string | null;
}

interface Program {
	id: string;
	name: string;
	code?: string | null;
}

interface Course {
	id: string;
	name: string;
	code: string;
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

	const { data: classes } = useQuery({
		queryKey: ["classes"],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({});
			return items.map(
				(cls) =>
					({
						id: cls.id,
						name: cls.name,
						code: cls.code,
						program: cls.program,
						programCode: cls.programInfo?.code ?? null,
						cycleLevelCode: cls.cycleLevel?.code ?? null,
						academicYearName: cls.academicYearInfo?.name ?? "",
						semesterId: cls.semester?.id ?? null,
						semesterCode: cls.semester?.code ?? null,
					}) as Class,
			);
		},
	});

	const { data: programs } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({});
			return items.map(
				(program) =>
					({
						id: program.id,
						name: program.name,
						code: program.code,
					}) as Program,
			);
		},
	});

	const { data: courses } = useQuery({
		queryKey: ["courses"],
		queryFn: async () => {
			const { items } = await trpcClient.courses.list.query({});
			return items.map(
				(course) =>
					({
						id: course.id,
						name: course.name,
						code: course.code,
					}) as Course,
			);
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
			return items.map(
				(cc) =>
					({
						id: cc.id,
						code: cc.code,
						class: cc.class,
						course: cc.course,
						teacher: cc.teacher,
						semesterId: cc.semesterId ?? null,
						courseName: cc.courseName,
						courseCode: cc.courseCode,
					}) as ClassCourse,
			);
		},
	});

	const { data: semesters } = useQuery({
		queryKey: ["semesters"],
		queryFn: () => trpcClient.semesters.list.query(),
	});

	const form = useForm<ClassCourseFormData>({
		resolver: zodResolver(classCourseSchema),
		defaultValues: {
			class: "",
			course: "",
			teacher: "",
			code: "",
			semesterId: "",
		},
	});
	const { watch } = form;
	const selectedClassId = watch("class");
	const selectedCourseId = watch("course");
	const selectedSemesterId = watch("semesterId");
	const codeValue = watch("code");
	const selectedSemester = useMemo(
		() => semesters?.find((semester) => semester.id === selectedSemesterId),
		[semesters, selectedSemesterId],
	);

	const formatTeacherName = (teacher: Teacher) =>
		[teacher.firstName, teacher.lastName].filter(Boolean).join(" ") ||
		teacher.email;

	const teacherOptions = teachers ?? [];

	const classMap = new Map((classes ?? []).map((c) => [c.id, c]));
	const programMap = new Map((programs ?? []).map((p) => [p.id, p]));
	const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));
	const teacherMap = new Map(
		teacherOptions.map((teacher) => [teacher.id, formatTeacherName(teacher)]),
	);
	const selectedClass = selectedClassId
		? classMap.get(selectedClassId)
		: undefined;
	const selectedCourse = selectedCourseId
		? courseMap.get(selectedCourseId)
		: undefined;
	const classCourseCodes = useMemo(
		() => (classCourses ?? []).map((cc) => cc.code).filter(Boolean),
		[classCourses],
	);
	const semesterDirty = Boolean(form.formState.dirtyFields.semesterId);
	useEffect(() => {
		if (editingClassCourse) return;
		if (semesterDirty) return;
		if (selectedClass?.semesterId) {
			form.setValue("semesterId", selectedClass.semesterId, {
				shouldDirty: false,
			});
			return;
		}
		if (!selectedSemesterId && semesters && semesters.length > 0) {
			form.setValue("semesterId", semesters[0].id, { shouldDirty: false });
		}
	}, [
		editingClassCourse,
		form,
		selectedClass?.semesterId,
		selectedSemesterId,
		semesters,
		semesterDirty,
	]);

	const codeDirty = Boolean(form.formState.dirtyFields.code);
	useEffect(() => {
		if (editingClassCourse) return;
		if (codeDirty) return;
		const programCode =
			selectedClass?.programCode ??
			programMap.get(selectedClass?.program ?? "")?.code;
		if (!programCode) return;
		const suggestion = generateClassCourseCode({
			programCode,
			levelCode: selectedClass?.cycleLevelCode,
			semesterCode: selectedSemester?.code ?? selectedClass?.semesterCode,
			existingCodes: classCourseCodes,
		});
		if (suggestion && codeValue !== suggestion) {
			form.setValue("code", suggestion, { shouldDirty: false });
		}
	}, [
		classCourseCodes,
		codeDirty,
		codeValue,
		editingClassCourse,
		form,
		programMap,
		selectedClass?.cycleLevelCode,
		selectedClass?.program,
		selectedClass?.programCode,
		selectedClass?.semesterCode,
		selectedSemester?.code,
	]);

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
			toast.success(t("admin.classCourses.toast.createSuccess"));
			handleCloseForm();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classCourses.toast.createError");
			toast.error(message);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: ClassCourseFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.classCourses.update.mutate({ id, ...updateData });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classCourses"] });
			toast.success(t("admin.classCourses.toast.updateSuccess"));
			handleCloseForm();
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classCourses.toast.updateError");
			toast.error(message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.classCourses.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["classCourses"] });
			toast.success(t("admin.classCourses.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classCourses.toast.deleteError");
			toast.error(message);
		},
	});

	const onSubmit = (data: ClassCourseFormData) => {
		if (editingClassCourse) {
			updateMutation.mutate({ ...data, id: editingClassCourse.id });
		} else {
			createMutation.mutate(data);
		}
	};

	const startCreate = () => {
		setEditingClassCourse(null);
		form.reset({
			class: "",
			course: "",
			teacher: "",
			code: "",
			semesterId: "",
		});
		setIsFormOpen(true);
	};

	const startEdit = (classCourse: ClassCourse) => {
		setEditingClassCourse(classCourse);
		form.reset({
			class: classCourse.class,
			course: classCourse.course,
			teacher: classCourse.teacher,
			code: classCourse.code,
			semesterId: classCourse.semesterId ?? "",
		});
		setIsFormOpen(true);
	};

	const handleCloseForm = () => {
		setIsFormOpen(false);
		setEditingClassCourse(null);
		form.reset({
			class: "",
			course: "",
			teacher: "",
			code: "",
			semesterId: "",
		});
	};

	const confirmDelete = (id: string) => {
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
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl">
						{t("admin.classCourses.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.classCourses.subtitle")}
					</p>
				</div>
				<Button onClick={startCreate}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.classCourses.actions.assign")}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("admin.classCourses.title")}</CardTitle>
					<CardDescription>{t("admin.classCourses.subtitle")}</CardDescription>
				</CardHeader>
				<CardContent>
					{displayedClassCourses.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										{t("admin.classCourses.table.code", {
											defaultValue: "Code",
										})}
									</TableHead>
									<TableHead>{t("admin.classCourses.table.class")}</TableHead>
									<TableHead>{t("admin.classCourses.table.program")}</TableHead>
									<TableHead>{t("admin.classCourses.table.course")}</TableHead>
									<TableHead>
										{t("admin.classCourses.table.semester", {
											defaultValue: "Semester",
										})}
									</TableHead>
									<TableHead>{t("admin.classCourses.table.teacher")}</TableHead>
									<TableHead className="text-right">
										{t("common.table.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{displayedClassCourses.map((classCourse) => (
									<TableRow key={classCourse.id}>
										<TableCell>
											<ClipboardCopy
												value={classCourse.code}
												label={t("admin.classCourses.table.code", {
													defaultValue: "Code",
												})}
											/>
										</TableCell>
										<TableCell className="font-medium">
											{classMap.get(classCourse.class)?.name}
										</TableCell>
										<TableCell>
											{programMap.get(
												classMap.get(classCourse.class)?.program ?? "",
											)?.name ??
												t("common.labels.notAvailable", {
													defaultValue: "N/A",
												})}
										</TableCell>
										<TableCell>
											{(() => {
												const info = courseMap.get(classCourse.course);
												if (!info) {
													return t("common.labels.notAvailable", {
														defaultValue: "N/A",
													});
												}
												return (
													<div className="space-y-0.5">
														<p className="font-medium text-sm">{info.name}</p>
														{info.code && (
															<p className="text-muted-foreground text-xs">
																{info.code}
															</p>
														)}
													</div>
												);
											})()}
										</TableCell>
										<TableCell>
											{(() => {
												const semester = semesters?.find(
													(item) => item.id === classCourse.semesterId,
												);
												if (!semester) {
													return t("common.labels.notAvailable", {
														defaultValue: "N/A",
													});
												}
												return `${semester.name} (${semester.code})`;
											})()}
										</TableCell>
										<TableCell>{teacherMap.get(classCourse.teacher)}</TableCell>
										<TableCell>
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => startEdit(classCourse)}
													aria-label={t("admin.classCourses.form.editTitle")}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon-sm"
													className="text-destructive hover:text-destructive"
													onClick={() => confirmDelete(classCourse.id)}
													aria-label={t("admin.classCourses.delete.title")}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="py-12 text-center">
							<BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
							<p className="mt-4 font-medium">
								{t("admin.classCourses.empty.title")}
							</p>
							<p className="text-muted-foreground text-sm">
								{t("admin.classCourses.empty.description")}
							</p>
							<Button className="mt-4" onClick={startCreate}>
								<Plus className="mr-2 h-4 w-4" />
								{t("admin.classCourses.actions.assign")}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={isFormOpen}
				onOpenChange={(open) => {
					setIsFormOpen(open);
					if (!open) handleCloseForm();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingClassCourse
								? t("admin.classCourses.form.editTitle")
								: t("admin.classCourses.form.createTitle")}
						</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="class"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.classCourses.form.classLabel")}
										</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"admin.classCourses.form.classPlaceholder",
														)}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{classes?.map((cls) => (
													<SelectItem key={cls.id} value={cls.id}>
														{cls.name} •{" "}
														{programMap.get(cls.program)?.name ??
															t("common.labels.notAvailable", {
																defaultValue: "N/A",
															})}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="course"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.classCourses.form.courseLabel")}
										</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"admin.classCourses.form.coursePlaceholder",
														)}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{courses?.map((course) => (
													<SelectItem key={course.id} value={course.id}>
														{course.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="teacher"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.classCourses.form.teacherLabel")}
										</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"admin.classCourses.form.teacherPlaceholder",
														)}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{teacherOptions.map((teacher) => (
													<SelectItem key={teacher.id} value={teacher.id}>
														{formatTeacherName(teacher)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="semesterId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.classCourses.form.semesterLabel", {
												defaultValue: "Semester",
											})}
										</FormLabel>
										<Select
											value={field.value}
											onValueChange={field.onChange}
											disabled={!semesters || semesters.length === 0}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"admin.classCourses.form.semesterPlaceholder",
															{ defaultValue: "Select semester" },
														)}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{semesters?.map((semester) => (
													<SelectItem key={semester.id} value={semester.id}>
														{semester.name} ({semester.code})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.classCourses.form.codeLabel", {
												defaultValue: "Code",
											})}
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder={t(
													"admin.classCourses.form.codePlaceholder",
													{ defaultValue: "INF11-CLS24-01" },
												)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
								<Button
									type="button"
									variant="outline"
									onClick={handleCloseForm}
									disabled={form.formState.isSubmitting}
								>
									{t("common.actions.cancel")}
								</Button>
								<Button type="submit" disabled={form.formState.isSubmitting}>
									{form.formState.isSubmitting ? (
										<Spinner className="mr-2 h-4 w-4" />
									) : editingClassCourse ? (
										t("common.actions.saveChanges")
									) : (
										t("admin.classCourses.form.createSubmit")
									)}
								</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={isDeleteOpen}
				onOpenChange={(open) => {
					setIsDeleteOpen(open);
					if (!open) setDeleteId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("admin.classCourses.delete.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("admin.classCourses.delete.message")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteMutation.isPending}>
							{t("common.actions.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : (
								<>
									<Trash2 className="mr-2 h-4 w-4" />
									{t("common.actions.delete")}
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

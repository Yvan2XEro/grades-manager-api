import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Pencil, PlusIcon, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { CodedEntitySelect } from "@/components/forms";
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
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter as ModalFooter,
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
import type { RouterOutputs } from "@/utils/trpc";
import { trpcClient } from "@/utils/trpc";

const buildCourseSchema = (t: TFunction) =>
	z.object({
		name: z.string().min(2, t("admin.courses.validation.name")),
		hours: z.coerce.number().min(1, t("admin.courses.validation.hours")),
		program: z.string({
			required_error: t("admin.courses.validation.program"),
		}),
		defaultTeacher: z.string({
			required_error: t("admin.courses.validation.teacher"),
		}),
		code: z
			.string()
			.trim()
			.min(
				2,
				t("admin.courses.validation.code", {
					defaultValue: "Code is required",
				}),
			),
	});

type CourseFormData = z.infer<ReturnType<typeof buildCourseSchema>>;

interface Course {
	id: string;
	code: string;
	name: string;
	hours: number;
	program: string;
	defaultTeacher: string;
}

type ProgramOption = RouterOutputs["programs"]["list"]["items"][number];

type Teacher = RouterOutputs["users"]["list"]["items"][number];

export default function CourseManagement() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingCourse, setEditingCourse] = useState<Course | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [programSearch, setProgramSearch] = useState("");

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

	const { data: defaultPrograms = [] } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({ limit: 100 });
			return items as ProgramOption[];
		},
	});

	const { data: searchPrograms = [] } = useQuery({
		queryKey: ["programs", "search", programSearch],
		queryFn: async () => {
			const items = await trpcClient.programs.search.query({
				query: programSearch,
			});
			return items as ProgramOption[];
		},
		enabled: programSearch.length >= 2,
	});

	const programs = programSearch.length >= 2 ? searchPrograms : defaultPrograms;

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

	const form = useForm<CourseFormData>({
		resolver: zodResolver(courseSchema),
		defaultValues: {
			name: "",
			hours: undefined as unknown as number,
			program: "",
			defaultTeacher: "",
			code: "",
		},
	});
	const { watch } = form;
	const selectedProgramId = watch("program");
	const selectedProgram = useMemo(
		() => programs?.find((program) => program.id === selectedProgramId),
		[programs, selectedProgramId],
	);

	const formatTeacherName = (teacher: Teacher) =>
		[teacher.firstName, teacher.lastName].filter(Boolean).join(" ") ||
		teacher.email;

	const teacherOptions = teachers ?? [];
	const programMap = useMemo(
		() => new Map((programs ?? []).map((program) => [program.id, program])),
		[programs],
	);
	const teacherMap = new Map(
		teacherOptions.map((teacher) => [teacher.id, formatTeacherName(teacher)]),
	);

	const createMutation = useMutation({
		mutationFn: async (data: CourseFormData) => {
			await trpcClient.courses.create.mutate(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			toast.success(t("admin.courses.toast.createSuccess"));
			handleCloseForm();
		},
		onError: (error: any) => {
			toast.error(error.message || t("admin.courses.toast.createError"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: CourseFormData & { id: string }) => {
			const { id, ...updateData } = data;
			await trpcClient.courses.update.mutate({ id, ...updateData });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			toast.success(t("admin.courses.toast.updateSuccess"));
			handleCloseForm();
		},
		onError: (error: any) => {
			toast.error(error.message || t("admin.courses.toast.updateError"));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.courses.delete.mutate({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			toast.success(t("admin.courses.toast.deleteSuccess"));
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: any) => {
			toast.error(error.message || t("admin.courses.toast.deleteError"));
		},
	});

	const onSubmit = (data: CourseFormData) => {
		if (editingCourse) {
			updateMutation.mutate({ ...data, id: editingCourse.id });
		} else {
			createMutation.mutate(data);
		}
	};

	const startCreate = () => {
		setEditingCourse(null);
		form.reset({
			name: "",
			hours: undefined as unknown as number,
			program: "",
			defaultTeacher: "",
			code: "",
		});
		setIsFormOpen(true);
	};

	const startEdit = (course: Course) => {
		setEditingCourse(course);
		form.reset({
			name: course.name,
			hours: course.hours,
			program: course.program,
			defaultTeacher: course.defaultTeacher,
			code: course.code,
		});
		setIsFormOpen(true);
	};

	const handleCloseForm = () => {
		setIsFormOpen(false);
		setEditingCourse(null);
		form.reset({
			name: "",
			hours: undefined as unknown as number,
			program: "",
			defaultTeacher: "",
			code: "",
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
						{t("admin.courses.title", { defaultValue: "Course management" })}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.courses.subtitle", {
							defaultValue: "Manage courses, workloads, and default teachers.",
						})}
					</p>
				</div>
				<Button onClick={startCreate}>
					<PlusIcon className="mr-2 h-4 w-4" />
					{t("admin.courses.actions.add")}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("admin.courses.title")}</CardTitle>
					<CardDescription>
						{t("admin.courses.subtitle", {
							defaultValue: "Manage courses, workloads, and default teachers.",
						})}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{courses && courses.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										{t("admin.courses.table.code", { defaultValue: "Code" })}
									</TableHead>
									<TableHead>{t("admin.courses.table.name")}</TableHead>
									<TableHead>{t("admin.courses.table.program")}</TableHead>
									<TableHead>{t("admin.courses.table.hours")}</TableHead>
									<TableHead>{t("admin.courses.table.teacher")}</TableHead>
									<TableHead className="text-right">
										{t("common.table.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{courses.map((course) => (
									<TableRow key={course.id}>
										<TableCell>
											<ClipboardCopy
												value={course.code}
												label={t("admin.courses.table.code", {
													defaultValue: "Code",
												})}
											/>
										</TableCell>
										<TableCell>{course.name}</TableCell>
										<TableCell>
											{(() => {
												const programInfo = programMap.get(course.program);
												if (!programInfo) {
													return t("common.labels.notAvailable", {
														defaultValue: "N/A",
													});
												}
												return (
													<div className="space-y-0.5">
														<p>{programInfo.name}</p>
														{programInfo.facultyInfo?.name && (
															<p className="text-muted-foreground text-xs">
																{t("admin.courses.table.facultyInfo", {
																	defaultValue: "Faculty: {{value}}",
																	value: programInfo.facultyInfo.name,
																})}
															</p>
														)}
													</div>
												);
											})()}
										</TableCell>
										<TableCell>{course.hours}</TableCell>
										<TableCell>
											{teacherMap.get(course.defaultTeacher) ??
												t("admin.courses.form.teacherPlaceholder")}
										</TableCell>
										<TableCell>
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => startEdit(course)}
													aria-label={t("admin.courses.form.editTitle")}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon-sm"
													className="text-destructive hover:text-destructive"
													onClick={() => confirmDelete(course.id)}
													aria-label={t("admin.courses.delete.title")}
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
							<p className="font-semibold">
								{t("admin.courses.empty.title", {
									defaultValue: "No courses available",
								})}
							</p>
							<p className="text-muted-foreground text-sm">
								{t("admin.courses.empty.description", {
									defaultValue: "Create a course to populate the catalog.",
								})}
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={isFormOpen}
				onOpenChange={(open) => {
					setIsFormOpen(open);
					if (!open) {
						handleCloseForm();
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingCourse
								? t("admin.courses.form.editTitle")
								: t("admin.courses.form.createTitle")}
						</DialogTitle>
						<DialogDescription>
							{t("admin.courses.subtitle", {
								defaultValue:
									"Manage courses, workloads, and default teachers.",
							})}
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.courses.form.nameLabel")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("admin.courses.form.namePlaceholder")}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="hours"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("admin.courses.form.hoursLabel")}</FormLabel>
										<FormControl>
											<Input
												type="number"
												value={field.value ?? ""}
												onChange={(event) =>
													field.onChange(
														event.target.value === ""
															? undefined
															: Number(event.target.value),
													)
												}
												placeholder={t("admin.courses.form.hoursPlaceholder")}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<CodedEntitySelect
								items={programs}
								onSearch={setProgramSearch}
								value={
									programs.find((p) => p.id === form.watch("program"))?.code ||
									null
								}
								onChange={(code) => {
									const program = programs.find((p) => p.code === code);
									form.setValue("program", program?.id || "");
								}}
								label={t("admin.courses.form.programLabel")}
								placeholder={t("admin.courses.form.programPlaceholder")}
								error={form.formState.errors.program?.message}
								searchMode="hybrid"
								getItemSubtitle={(program) => program.facultyInfo?.name || ""}
								required
							/>

							<FormField
								control={form.control}
								name="defaultTeacher"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.courses.form.teacherLabel")}
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value || undefined}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"admin.courses.form.teacherPlaceholder",
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
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.courses.form.codeLabel", {
												defaultValue: "Code",
											})}
										</FormLabel>
										<FormControl>
											<Input
												placeholder={t("admin.courses.form.codePlaceholder", {
													defaultValue: "INF111",
												})}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<ModalFooter className="gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={handleCloseForm}
								>
									{t("common.actions.cancel")}
								</Button>
								<Button type="submit" disabled={form.formState.isSubmitting}>
									{form.formState.isSubmitting ? (
										<Spinner className="mr-2 h-4 w-4" />
									) : editingCourse ? (
										t("common.actions.saveChanges")
									) : (
										t("admin.courses.form.createSubmit")
									)}
								</Button>
							</ModalFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={isDeleteOpen}
				onOpenChange={(open) => {
					setIsDeleteOpen(open);
					if (!open) {
						setDeleteId(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("admin.courses.delete.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("admin.courses.delete.message")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteMutation.isPending}>
							{t("common.actions.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={deleteMutation.isPending}
							onClick={handleDelete}
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

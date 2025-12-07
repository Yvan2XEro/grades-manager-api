// @ts-nocheck
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { ClipboardCopy } from "@/components/ui/clipboard-copy";
import { generateCourseCode } from "@/lib/code-generator";
import ConfirmModal from "../../components/modals/ConfirmModal";
import FormModal from "../../components/modals/FormModal";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
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

type Course = {
	id: string;
	name: string;
	code: string;
	hours: number;
	defaultTeacher: string;
};

type Teacher = RouterOutputs["users"]["list"]["items"][number];

const buildCourseSchema = (
	t: (key: string, opts?: Record<string, any>) => string,
) =>
	z.object({
		name: z.string().min(
			2,
			t("admin.teachingUnits.courses.validation.name", {
				defaultValue: "Name is required",
			}),
		),
		hours: z.number().min(
			1,
			t("admin.teachingUnits.courses.validation.hours", {
				defaultValue: "Hours must be positive",
			}),
		),
		code: z.string().min(
			3,
			t("admin.teachingUnits.courses.validation.code", {
				defaultValue: "Code is required",
			}),
		),
		defaultTeacher: z.string({
			required_error: t("admin.teachingUnits.courses.validation.teacher", {
				defaultValue: "Default teacher is required",
			}),
		}),
	});

type CourseFormData = z.infer<ReturnType<typeof buildCourseSchema>>;

interface TeachingUnitCoursesTableProps {
	teachingUnitId: string;
	programId: string;
	semesterCode?: string;
}

export function TeachingUnitCoursesTable({
	teachingUnitId,
	programId,
	semesterCode,
}: TeachingUnitCoursesTableProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingCourse, setEditingCourse] = useState<Course | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	const courseSchema = useMemo(() => buildCourseSchema(t), [t]);

	const { data: courses, isLoading } = useQuery({
		queryKey: ["teaching-unit-courses", teachingUnitId],
		queryFn: async () => {
			const { items } = await trpcClient.courses.list.query({
				teachingUnitId,
				limit: 200,
			});
			return items.map(
				(course) =>
					({
						id: course.id,
						name: course.name,
						code: course.code,
						hours: course.hours,
						defaultTeacher: course.defaultTeacher ?? "",
					}) as Course,
			);
		},
		enabled: Boolean(teachingUnitId),
	});

	const { data: teachers } = useQuery({
		queryKey: ["teachers"],
		queryFn: async () => {
			const { items } = await trpcClient.users.list.query({
				role: "teacher",
				limit: 200,
			});
			return items;
		},
	});

	const { data: program } = useQuery({
		queryKey: ["program", programId],
		queryFn: () => trpcClient.programs.getById.query({ id: programId }),
		enabled: Boolean(programId),
	});

	const teacherOptions = teachers ?? [];

	const formatTeacherName = (teacher: Teacher) =>
		[teacher.firstName, teacher.lastName].filter(Boolean).join(" ") ||
		teacher.email;

	const teacherMap = useMemo(
		() =>
			new Map(
				teacherOptions.map((teacher) => [
					teacher.id,
					formatTeacherName(teacher),
				]),
			),
		[teacherOptions],
	);

	const form = useForm<CourseFormData>({
		resolver: zodResolver(courseSchema),
	});
	const codeValue = form.watch("code");
	const codeDirty = Boolean(form.formState.dirtyFields.code);
	const courseCodes = useMemo(
		() => (courses ?? []).map((course) => course.code).filter(Boolean),
		[courses],
	);
	useEffect(() => {
		if (editingCourse) return;
		if (codeDirty) return;
		if (!program?.code) return;
		const suggestion = generateCourseCode({
			programCode: program.code,
			semesterCode,
			existingCodes: courseCodes,
		});
		if (suggestion && codeValue !== suggestion) {
			form.setValue("code", suggestion, { shouldDirty: false });
		}
	}, [
		codeDirty,
		codeValue,
		courseCodes,
		editingCourse,
		form,
		program?.code,
		semesterCode,
	]);

	const openCreate = () => {
		setEditingCourse(null);
		form.reset({
			name: "",
			hours: undefined as unknown as number,
			code: "",
			defaultTeacher: "",
		});
		setIsFormOpen(true);
	};

	const openEdit = (course: Course) => {
		setEditingCourse(course);
		form.reset({
			name: course.name,
			hours: course.hours,
			code: course.code,
			defaultTeacher: course.defaultTeacher,
		});
		setIsFormOpen(true);
	};

	const handleCloseForm = () => {
		setEditingCourse(null);
		form.reset({
			name: "",
			hours: undefined as unknown as number,
			code: "",
			defaultTeacher: "",
		});
		setIsFormOpen(false);
	};

	const invalidateCourses = () =>
		queryClient.invalidateQueries({
			queryKey: ["teaching-unit-courses", teachingUnitId],
		});

	const createMutation = useMutation({
		mutationFn: (data: CourseFormData) =>
			trpcClient.courses.create.mutate({
				...data,
				program: programId,
				teachingUnitId,
			}),
		onSuccess: () => {
			toast.success(
				t("admin.teachingUnits.courses.toast.createSuccess", {
					defaultValue: "Element created",
				}),
			);
			invalidateCourses();
			handleCloseForm();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const updateMutation = useMutation({
		mutationFn: (data: CourseFormData & { id: string }) =>
			trpcClient.courses.update.mutate({
				id: data.id,
				name: data.name,
				hours: data.hours,
				code: data.code,
				defaultTeacher: data.defaultTeacher,
				program: programId,
				teachingUnitId,
			}),
		onSuccess: () => {
			toast.success(
				t("admin.teachingUnits.courses.toast.updateSuccess", {
					defaultValue: "Element updated",
				}),
			);
			invalidateCourses();
			handleCloseForm();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => trpcClient.courses.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.teachingUnits.courses.toast.deleteSuccess", {
					defaultValue: "Element deleted",
				}),
			);
			invalidateCourses();
			setIsDeleteOpen(false);
			setDeleteId(null);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const onSubmit = (data: CourseFormData) => {
		if (editingCourse) {
			updateMutation.mutate({ ...data, id: editingCourse.id });
		} else {
			createMutation.mutate(data);
		}
	};

	if (!programId) {
		return null;
	}

	return (
		<Card>
			<CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<CardTitle>
						{t("admin.teachingUnits.courses.title", {
							defaultValue: "Constitutive elements",
						})}
					</CardTitle>
					<CardDescription>
						{t("admin.teachingUnits.courses.subtitle", {
							defaultValue: "Manage ECs tied to this teaching unit.",
						})}
					</CardDescription>
				</div>
				<Button onClick={openCreate}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.teachingUnits.courses.actions.add", {
						defaultValue: "Add element",
					})}
				</Button>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Spinner className="h-6 w-6" />
					</div>
				) : courses?.length ? (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										{t("admin.teachingUnits.courses.table.code", {
											defaultValue: "Code",
										})}
									</TableHead>
									<TableHead>
										{t("admin.teachingUnits.courses.table.name")}
									</TableHead>
									<TableHead>
										{t("admin.teachingUnits.courses.table.hours")}
									</TableHead>
									<TableHead>
										{t("admin.teachingUnits.courses.table.teacher")}
									</TableHead>
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
												label={t("admin.teachingUnits.courses.table.code", {
													defaultValue: "Code",
												})}
											/>
										</TableCell>
										<TableCell className="font-medium">{course.name}</TableCell>
										<TableCell>{course.hours}</TableCell>
										<TableCell>
											{teacherMap.get(course.defaultTeacher) ?? "—"}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => openEdit(course)}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon-sm"
													className="text-destructive hover:text-destructive"
													onClick={() => {
														setDeleteId(course.id);
														setIsDeleteOpen(true);
													}}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				) : (
					<p className="text-muted-foreground text-sm">
						{t("admin.teachingUnits.courses.empty", {
							defaultValue: "No elements yet.",
						})}
					</p>
				)}
			</CardContent>

			<FormModal
				isOpen={isFormOpen}
				onClose={handleCloseForm}
				title={
					editingCourse
						? t("admin.teachingUnits.courses.form.editTitle", {
								defaultValue: "Edit element",
							})
						: t("admin.teachingUnits.courses.form.createTitle", {
								defaultValue: "Add element",
							})
				}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.teachingUnits.courses.form.nameLabel")}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder={t(
												"admin.teachingUnits.courses.form.namePlaceholder",
											)}
										/>
									</FormControl>
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
										{t("admin.teachingUnits.courses.form.codeLabel", {
											defaultValue: "Code",
										})}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder={t(
												"admin.teachingUnits.courses.form.codePlaceholder",
												{ defaultValue: "INF111" },
											)}
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
									<FormLabel>
										{t("admin.teachingUnits.courses.form.hoursLabel")}
									</FormLabel>
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
											placeholder={t(
												"admin.teachingUnits.courses.form.hoursPlaceholder",
											)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="defaultTeacher"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.teachingUnits.courses.form.teacherLabel")}
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value || undefined}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"admin.teachingUnits.courses.form.teacherPlaceholder",
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

						<div className="flex justify-end gap-2">
							<Button type="button" variant="outline" onClick={handleCloseForm}>
								{t("common.actions.cancel")}
							</Button>
							<Button
								type="submit"
								disabled={
									form.formState.isSubmitting ||
									createMutation.isPending ||
									updateMutation.isPending
								}
							>
								{form.formState.isSubmitting
									? t("common.actions.saving", { defaultValue: "Saving..." })
									: editingCourse
										? t("common.actions.saveChanges")
										: t("admin.teachingUnits.courses.form.submit")}
							</Button>
						</div>
					</form>
				</Form>
			</FormModal>

			<ConfirmModal
				isOpen={isDeleteOpen}
				onClose={() => {
					setIsDeleteOpen(false);
					setDeleteId(null);
				}}
				onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
				title={t("admin.teachingUnits.courses.deleteTitle", {
					defaultValue: "Delete element",
				})}
				message={t("admin.teachingUnits.courses.deleteMessage", {
					defaultValue: "This action cannot be undone.",
				})}
				confirmText={t("common.actions.delete")}
				isLoading={deleteMutation.isPending}
			/>
		</Card>
	);
}

// @ts-nocheck
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { confirmAction } from "@/components/callable/confirm";
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
import { generateCourseCode } from "@/lib/code-generator";
import { toast } from "@/lib/toast";
import type { RouterOutputs } from "@/utils/trpc";
import { trpcClient } from "@/utils/trpc";
import { fetchTeachers, TEACHERS_KEY } from "./CourseFormDialog";

type Course = {
	id: string;
	name: string;
	code: string;
	hours: number;
	defaultTeacher: string;
	defaultCoefficient: number;
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
		defaultTeacher: z.string().optional(),
		defaultCoefficient: z.coerce.number().positive().default(1),
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
						defaultCoefficient: Number(course.defaultCoefficient) || 1,
					}) as Course,
			);
		},
		enabled: Boolean(teachingUnitId),
	});

	const { data: teachers } = useQuery({
		queryKey: TEACHERS_KEY,
		queryFn: fetchTeachers,
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
		[teacherOptions, formatTeacherName],
	);

	const courseCodes = (courses ?? [])
		.map((course) => course.code)
		.filter(Boolean);

	const openCreate = () =>
		UeCourseFormDialog.call({
			teachingUnitId,
			programId,
			semesterCode,
			existingCodes: courseCodes,
		});

	const openEdit = (course: Course) =>
		UeCourseFormDialog.call({
			teachingUnitId,
			programId,
			semesterCode,
			existingCodes: courseCodes,
			course,
		});

	const invalidateCourses = () =>
		queryClient.invalidateQueries({
			queryKey: ["teaching-unit-courses", teachingUnitId],
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
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("admin.teachingUnits.courses.deleteTitle", {
				defaultValue: "Delete element",
			}),
			message: t("admin.teachingUnits.courses.deleteMessage", {
				defaultValue: "This action cannot be undone.",
			}),
			confirmText: t("common.actions.delete"),
			onConfirm: () => deleteMutation.mutateAsync(id).catch(() => undefined),
		});

	if (!programId) {
		return null;
	}

	return (
		<Card className="border-0 shadow-sm">
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
						<Spinner className="h-6 w-6 text-primary" />
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
									<TableHead>
										{t("admin.teachingUnits.courses.table.coefficient", {
											defaultValue: "Coef.",
										})}
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
										<TableCell>{course.defaultCoefficient}</TableCell>
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
														confirmDelete(course.id);
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
		</Card>
	);
}

/**
 * Creates or edits a course (EC) of a teaching unit; the code is suggested
 * from the program and semester. Resolves `true` once saved.
 */
export const UeCourseFormDialog = createCallable<
	{
		teachingUnitId: string;
		programId: string;
		semesterCode?: string;
		existingCodes: string[];
		course?: Course;
	},
	boolean
>(
	({
		call,
		teachingUnitId,
		programId,
		semesterCode,
		existingCodes,
		course,
	}) => {
		const { t } = useTranslation();
		const queryClient = useQueryClient();
		const courseSchema = useMemo(() => buildCourseSchema(t), [t]);

		const { data: teachers } = useQuery({
			queryKey: TEACHERS_KEY,
			queryFn: fetchTeachers,
		});
		const teacherOptions = teachers ?? [];
		const formatTeacherName = (teacher: Teacher) =>
			[teacher.firstName, teacher.lastName].filter(Boolean).join(" ") ||
			teacher.email;

		const { data: program } = useQuery({
			queryKey: ["program", programId],
			queryFn: () => trpcClient.programs.getById.query({ id: programId }),
			enabled: Boolean(programId),
		});

		const form = useForm<z.input<typeof courseSchema>, unknown, CourseFormData>(
			{
				resolver: zodResolver(courseSchema),
				defaultValues: course
					? {
							name: course.name,
							hours: course.hours,
							code: course.code,
							defaultTeacher: course.defaultTeacher,
							defaultCoefficient: course.defaultCoefficient,
						}
					: {
							name: "",
							hours: undefined as unknown as number,
							code: "",
							defaultTeacher: "",
							defaultCoefficient: 1,
						},
			},
		);
		const codeValue = form.watch("code");
		const codeDirty = Boolean(form.formState.dirtyFields.code);
		useEffect(() => {
			if (course || codeDirty || !program?.code) return;
			const suggestion = generateCourseCode({
				programCode: program.code,
				semesterCode,
				existingCodes,
			});
			if (suggestion && codeValue !== suggestion) {
				form.setValue("code", suggestion, { shouldDirty: false });
			}
		}, [
			codeDirty,
			codeValue,
			existingCodes,
			course,
			form,
			program?.code,
			semesterCode,
		]);

		const submit = useMutationFlow(call, async (call, data: CourseFormData) => {
			try {
				if (course) {
					await trpcClient.courses.update.mutate({
						id: course.id,
						name: data.name,
						hours: data.hours,
						code: data.code,
						defaultTeacher: data.defaultTeacher,
						defaultCoefficient: data.defaultCoefficient,
						program: programId,
						teachingUnitId,
					});
					toast.success(
						t("admin.teachingUnits.courses.toast.updateSuccess", {
							defaultValue: "Element updated",
						}),
					);
				} else {
					await trpcClient.courses.create.mutate({
						...data,
						program: programId,
						teachingUnitId,
					});
					toast.success(
						t("admin.teachingUnits.courses.toast.createSuccess", {
							defaultValue: "Element created",
						}),
					);
				}
				queryClient.invalidateQueries({
					queryKey: ["teaching-unit-courses", teachingUnitId],
				});
				queryClient.invalidateQueries({ queryKey: ["courses"] });
				queryClient.invalidateQueries({ queryKey: ["course-options"] });
				call.end(true);
			} catch (error) {
				toast.error((error as Error).message);
			}
		});

		return (
			<CallableDialog
				call={call}
				dismissValue={false}
				preventDismiss={submit.pending}
				title={
					course
						? t("admin.teachingUnits.courses.form.editTitle", {
								defaultValue: "Edit element",
							})
						: t("admin.teachingUnits.courses.form.createTitle", {
								defaultValue: "Add element",
							})
				}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(submit)} className="space-y-4">
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

						<FormField
							control={form.control}
							name="defaultCoefficient"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.teachingUnits.courses.form.coefficientLabel", {
											defaultValue: "Coefficient par défaut",
										})}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="number"
											step="0.01"
											min="0.01"
											placeholder={t(
												"admin.teachingUnits.courses.form.coefficientPlaceholder",
												{ defaultValue: "1.00" },
											)}
										/>
									</FormControl>
									<p className="text-muted-foreground text-xs">
										{t("admin.teachingUnits.courses.form.coefficientHelp", {
											defaultValue:
												"Poids par défaut lors de l'assignation à une classe",
										})}
									</p>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								disabled={submit.pending}
								onClick={() => call.end(false)}
							>
								{t("common.actions.cancel")}
							</Button>
							<Button type="submit" disabled={submit.pending}>
								{submit.pending
									? t("common.actions.saving", {
											defaultValue: "Saving...",
										})
									: course
										? t("common.actions.saveChanges")
										: t("admin.teachingUnits.courses.form.submit")}
							</Button>
						</div>
					</form>
				</Form>
			</CallableDialog>
		);
	},
	DIALOG_EXIT_MS,
);

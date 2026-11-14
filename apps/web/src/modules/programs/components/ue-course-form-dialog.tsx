import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
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
import { generateCourseCode } from "@/lib/code-generator";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { formatTeacherName, useTeachers } from "../hooks/use-teachers";
import { teachingUnitCoursesKey } from "../hooks/use-teaching-unit-courses";
import type { UeCourse } from "../types";

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
		course?: UeCourse;
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

		const { data: teacherOptions = [] } = useTeachers();

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
					queryKey: teachingUnitCoursesKey(teachingUnitId),
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

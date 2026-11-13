import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { CodedEntitySelect } from "@/components/forms";
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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { generateClassCourseCode } from "@/lib/code-generator";
import { upsertInList } from "@/lib/query-cache";
import { toast } from "@/lib/toast";
import {
	CourseFormDialog,
	fetchTeachers,
	formatTeacherName,
	TEACHERS_KEY,
	type Teacher,
} from "@/modules/programs/CourseFormDialog";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";
import {
	COURSES_KEY,
	type CourseOption,
	fetchCourseOptions,
	quickCreateClass,
	useClassOptions,
	useProgramNames,
} from "../hooks/use-class-options";

// ── Class-course form ─────────────────────────────────────────────────────

export type ClassCourseFormResult = RouterOutputs["classCourses"]["create"];

interface ClassCourseFormProps {
	classCourse?: {
		id: string;
		code: string;
		class: string;
		course: string;
		teacher: string;
		semesterId: string | null;
		coefficient: number;
	};
	/** Codes already used, so the suggested code doesn't collide. */
	existingCodes: string[];
	/** Year filtered on the page: enables auto-enrollment after creation. */
	academicYearId?: string | null;
}

/**
 * Assigns a course to a class (with teacher, semester, coefficient). Missing
 * classes and courses can be created in place from the "+" buttons.
 */
export const ClassCourseFormDialog = createCallable<
	ClassCourseFormProps,
	ClassCourseFormResult | undefined
>(({ call, classCourse, existingCodes, academicYearId }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [classSearch, setClassSearch] = useState("");
	const [courseSearch, setCourseSearch] = useState("");
	const [autoEnrollOnCreate, setAutoEnrollOnCreate] = useState(false);

	const schema = useMemo(
		() =>
			z.object({
				class: z.string({ error: t("admin.classCourses.validation.class") }),
				course: z.string({ error: t("admin.classCourses.validation.course") }),
				teacher: z.string({
					error: t("admin.classCourses.validation.teacher"),
				}),
				code: z.string().min(
					3,
					t("admin.classCourses.validation.code", {
						defaultValue: "Code is required",
					}),
				),
				semesterId: z.string().optional(),
				coefficient: z.coerce.number().positive().default(1),
			}),
		[t],
	);
	type FormInput = z.input<typeof schema>;
	type FormData = z.output<typeof schema>;

	const form = useForm<FormInput, unknown, FormData>({
		resolver: zodResolver(schema),
		defaultValues: classCourse
			? {
					class: classCourse.class,
					course: classCourse.course,
					teacher: classCourse.teacher,
					code: classCourse.code,
					semesterId: classCourse.semesterId ?? "",
					coefficient: classCourse.coefficient,
				}
			: {
					class: "",
					course: "",
					teacher: "",
					code: "",
					semesterId: "",
					coefficient: 1,
				},
	});
	const { watch } = form;

	const classes = useClassOptions(classSearch);
	const programMap = useProgramNames();

	const { data: defaultCourses = [] } = useQuery({
		queryKey: COURSES_KEY,
		queryFn: fetchCourseOptions,
	});
	const { data: searchCourses = [] } = useQuery({
		queryKey: [...COURSES_KEY, "search", courseSearch],
		queryFn: async () =>
			(await trpcClient.courses.search.query({ query: courseSearch })).map(
				(course): CourseOption => ({
					id: course.id,
					name: course.name,
					code: course.code,
				}),
			),
		enabled: courseSearch.length >= 2,
	});
	const courses = courseSearch.length >= 2 ? searchCourses : defaultCourses;

	const { data: teachers = [] } = useQuery({
		queryKey: TEACHERS_KEY,
		queryFn: fetchTeachers,
	});

	const { data: semestersData } = useQuery({
		queryKey: ["semesters"],
		queryFn: () => trpcClient.semesters.list.query(),
	});
	const semesters = semestersData?.items;

	const selectedClassId = watch("class");
	const selectedCourseId = watch("course");
	const selectedSemesterId = watch("semesterId");
	const codeValue = watch("code");
	const selectedClass = classes.find((c) => c.id === selectedClassId);
	const selectedSemester = semesters?.find(
		(semester: { id: string }) => semester.id === selectedSemesterId,
	);

	// Default the semester to the class's own semester (or the first one)
	const semesterDirty = Boolean(form.formState.dirtyFields.semesterId);
	useEffect(() => {
		if (classCourse || semesterDirty) return;
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
		classCourse,
		form,
		selectedClass?.semesterId,
		selectedSemesterId,
		semesters,
		semesterDirty,
	]);

	// Suggest a unique code from program / level / semester
	const codeDirty = Boolean(form.formState.dirtyFields.code);
	useEffect(() => {
		if (classCourse || codeDirty) return;
		const programCode =
			selectedClass?.programCode ??
			programMap.get(selectedClass?.program ?? "")?.code;
		if (!programCode) return;
		const suggestion = generateClassCourseCode({
			programCode,
			levelCode: selectedClass?.cycleLevelCode,
			semesterCode: selectedSemester?.code ?? selectedClass?.semesterCode,
			existingCodes,
		});
		if (suggestion && codeValue !== suggestion) {
			form.setValue("code", suggestion, { shouldDirty: false });
		}
	}, [
		existingCodes,
		codeDirty,
		codeValue,
		classCourse,
		form,
		programMap,
		selectedClass,
		selectedSemester?.code,
	]);

	// Preselect the course's default teacher
	const teacherDirty = Boolean(form.formState.dirtyFields.teacher);
	useEffect(() => {
		if (classCourse || teacherDirty || !selectedCourseId) return;
		trpcClient.courses.getById
			.query({ id: selectedCourseId })
			.then((details) => {
				if (details.defaultTeacher) {
					form.setValue("teacher", details.defaultTeacher, {
						shouldDirty: false,
					});
				}
			})
			.catch(() => {
				// Ignore: the teacher field simply stays empty
			});
	}, [classCourse, form, selectedCourseId, teacherDirty]);

	const createClass = async () => {
		const option = await quickCreateClass(queryClient, academicYearId);
		if (!option) return;
		setClassSearch("");
		form.setValue("class", option.id, { shouldValidate: true });
		return option;
	};

	const createCourse = async () => {
		const course = await CourseFormDialog.call({
			defaults: { program: selectedClass?.program },
		});
		if (!course) return;
		const option: CourseOption = {
			id: course.id,
			name: course.name,
			code: course.code,
		};
		queryClient.setQueryData<CourseOption[]>(COURSES_KEY, (old) =>
			upsertInList(old ?? [], option),
		);
		setCourseSearch("");
		form.setValue("course", course.id, { shouldValidate: true });
		if (course.defaultTeacher) {
			form.setValue("teacher", course.defaultTeacher, { shouldValidate: true });
		}
		return option;
	};

	const submit = useMutationFlow(call, async (call, data: FormData) => {
		try {
			let saved: ClassCourseFormResult;
			if (classCourse) {
				saved = (await trpcClient.classCourses.update.mutate({
					id: classCourse.id,
					...data,
				})) as ClassCourseFormResult;
				toast.success(t("admin.classCourses.toast.updateSuccess"));
			} else {
				saved = await trpcClient.classCourses.create.mutate(data);
				toast.success(t("admin.classCourses.toast.createSuccess"));
				if (autoEnrollOnCreate && academicYearId) {
					const result =
						await trpcClient.studentCourseEnrollments.autoEnrollClass.mutate({
							classId: data.class,
							academicYearId,
						});
					queryClient.invalidateQueries({
						queryKey: ["studentCourseEnrollments"],
					});
					toast.success(
						t("admin.classCourses.toast.autoEnrollSuccess", {
							defaultValue: "{{count}} inscription(s) créée(s)",
							count: result.createdCount,
						}),
					);
				}
			}
			queryClient.invalidateQueries({
				queryKey: trpc.classCourses.listPaged.queryKey(),
			});
			queryClient.invalidateQueries({ queryKey: ["classCourses"] });
			call.end(saved);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: classCourse
						? t("admin.classCourses.toast.updateError")
						: t("admin.classCourses.toast.createError");
			toast.error(message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			title={
				classCourse
					? t("admin.classCourses.form.editTitle")
					: t("admin.classCourses.form.createTitle")
			}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-4">
					<CodedEntitySelect
						items={classes}
						onSearch={setClassSearch}
						value={classes.find((c) => c.id === selectedClassId)?.code || null}
						onChange={(code) => {
							const cls = classes.find((c) => c.code === code);
							form.setValue("class", cls?.id || "");
						}}
						label={t("admin.classCourses.form.classLabel")}
						placeholder={t("admin.classCourses.form.classPlaceholder")}
						error={form.formState.errors.class?.message}
						searchMode="hybrid"
						getItemSubtitle={(cls) =>
							programMap.get(cls.program)?.name ??
							t("common.labels.notAvailable", { defaultValue: "N/A" })
						}
						required
						onCreate={createClass}
						createLabel={t("admin.classes.actions.add")}
					/>

					<CodedEntitySelect
						items={courses}
						onSearch={setCourseSearch}
						value={courses.find((c) => c.id === selectedCourseId)?.code || null}
						onChange={(code) => {
							const course = courses.find((c) => c.code === code);
							form.setValue("course", course?.id || "");
						}}
						label={t("admin.classCourses.form.courseLabel")}
						placeholder={t("admin.classCourses.form.coursePlaceholder")}
						error={form.formState.errors.course?.message}
						searchMode="hybrid"
						required
						onCreate={createCourse}
						createLabel={t("admin.courses.form.createTitle")}
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
										{teachers.map((teacher: Teacher) => (
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
										{semesters?.map(
											(semester: {
												id: string;
												name: string;
												code: string;
											}) => (
												<SelectItem key={semester.id} value={semester.id}>
													{semester.name} ({semester.code})
												</SelectItem>
											),
										)}
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
										placeholder={t("admin.classCourses.form.codePlaceholder", {
											defaultValue: "INF11-CLS24-01",
										})}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="coefficient"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admin.classCourses.form.coefficientLabel", {
										defaultValue: "Coefficient",
									})}
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value as number}
										type="number"
										step="0.01"
										min="0.01"
										placeholder={t(
											"admin.classCourses.form.coefficientPlaceholder",
											{ defaultValue: "1.00" },
										)}
									/>
								</FormControl>
								<p className="text-muted-foreground text-xs">
									{t("admin.classCourses.form.coefficientHelp", {
										defaultValue:
											"Poids pour le calcul de la moyenne pondérée dans l'UE",
									})}
								</p>
								<FormMessage />
							</FormItem>
						)}
					/>

					{!classCourse && academicYearId && (
						<div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
							<Switch
								id="auto-enroll-toggle"
								checked={autoEnrollOnCreate}
								onCheckedChange={setAutoEnrollOnCreate}
							/>
							<label
								htmlFor="auto-enroll-toggle"
								className="cursor-pointer text-sm"
							>
								{t("admin.classCourses.form.autoEnrollOnCreate", {
									defaultValue:
										"Inscrire automatiquement les étudiants après l'assignation",
								})}
							</label>
						</div>
					)}

					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => call.end(undefined)}
							disabled={submit.pending}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={submit.pending}>
							{submit.pending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : classCourse ? (
								t("common.actions.saveChanges")
							) : (
								t("admin.classCourses.form.createSubmit")
							)}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);

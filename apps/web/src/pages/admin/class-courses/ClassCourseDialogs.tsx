import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, FileDown, Layers, Users } from "lucide-react";
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
import { ClassFormDialog } from "@/components/callable/forms/ClassFormDialog";
import {
	CourseFormDialog,
	fetchTeachers,
	formatTeacherName,
	TEACHERS_KEY,
	type Teacher,
} from "@/components/callable/forms/CourseFormDialog";
import { CodedEntitySelect } from "@/components/forms";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";

// ── Shared class/course options (cache shared with ClassCourseManagement) ──

export type ClassOption = {
	id: string;
	name: string;
	code: string;
	program: string;
	programCode?: string | null;
	academicYearName?: string;
	semesterId?: string | null;
	semesterCode?: string | null;
	cycleLevelCode?: string | null;
};

export type CourseOption = {
	id: string;
	name: string;
	code: string;
};

type RawClass = Awaited<
	ReturnType<typeof trpcClient.classes.search.query>
>[number];

export const toClassOption = (cls: RawClass): ClassOption => ({
	id: cls.id,
	name: cls.name,
	code: cls.code,
	program: cls.program,
	programCode: cls.programInfo?.code ?? null,
	cycleLevelCode: cls.cycleLevel?.code ?? null,
	academicYearName: cls.academicYearInfo?.name ?? "",
	semesterId: cls.semester?.id ?? null,
	semesterCode: cls.semester?.code ?? null,
});

/** Option lists of the class-course forms (own keys: other pages cache raw rows under ["classes"]). */
export const CLASSES_KEY = ["class-options"];
export const COURSES_KEY = ["course-options"];

export const fetchClassOptions = async () => {
	const { items } = await trpcClient.classes.list.query({ limit: 100 });
	return items.map((cls) => toClassOption(cls as RawClass));
};

export const fetchCourseOptions = async () => {
	const { items } = await trpcClient.courses.list.query({ limit: 100 });
	return items.map(
		(course): CourseOption => ({
			id: course.id,
			name: course.name,
			code: course.code,
		}),
	);
};

/** Classes list with server search past 2 characters. */
function useClassOptions(search: string) {
	const { data: defaults = [] } = useQuery({
		queryKey: CLASSES_KEY,
		queryFn: fetchClassOptions,
	});
	const { data: found = [] } = useQuery({
		queryKey: [...CLASSES_KEY, "search", search],
		queryFn: async () =>
			(await trpcClient.classes.search.query({ query: search })).map((cls) =>
				toClassOption(cls as RawClass),
			),
		enabled: search.length >= 2,
	});
	return search.length >= 2 ? found : defaults;
}

function useProgramNames() {
	const { data: programs = [] } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({ limit: 100 });
			return items;
		},
	});
	return useMemo(
		() =>
			new Map(
				programs.map((p: { id: string; name: string; code: string }) => [
					p.id,
					p,
				]),
			),
		[programs],
	);
}

/**
 * Creates a class through the nested class form, inserts it in the shared
 * classes cache and returns it as a select option.
 */
async function quickCreateClass(
	queryClient: ReturnType<typeof useQueryClient>,
	academicYearId?: string | null,
) {
	const created = await ClassFormDialog.call({
		defaults: { academicYearId: academicYearId ?? undefined },
	});
	if (!created) return;
	// The create result lacks the joined labels; refetch the row to get them.
	const [row] = await trpcClient.classes.search.query({ query: created.code });
	const option = row
		? toClassOption(row as RawClass)
		: {
				id: created.id,
				name: created.name,
				code: created.code,
				program: created.program,
			};
	queryClient.setQueryData<ClassOption[]>(CLASSES_KEY, (old) =>
		upsertInList(old ?? [], option),
	);
	return option;
}

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

// ── UE bulk assignment ─────────────────────────────────────────────────────

/**
 * Assigns every course (EC) of a teaching unit to a class with its default
 * teacher and coefficient. A missing class can be created in place.
 */
export const AssignTeachingUnitDialog = createCallable<
	{ existingCodes: string[]; academicYearId?: string | null },
	boolean
>(({ call, existingCodes, academicYearId }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [classSearch, setClassSearch] = useState("");
	const [classId, setClassId] = useState("");
	const [teachingUnitId, setTeachingUnitId] = useState("");
	const [skippedCourses, setSkippedCourses] = useState<string[]>([]);

	const classes = useClassOptions(classSearch);
	const programMap = useProgramNames();
	const selectedClass = classes.find((c) => c.id === classId);

	const { data: teachingUnits = [] } = useQuery({
		queryKey: ["teachingUnits", selectedClass?.program],
		queryFn: async () => {
			if (!selectedClass?.program) return [];
			const { items } = await trpcClient.teachingUnits.list.query({
				programId: selectedClass.program,
			});
			return items;
		},
		enabled: Boolean(selectedClass?.program),
	});

	const createClass = async () => {
		const option = await quickCreateClass(queryClient, academicYearId);
		if (!option) return;
		setClassSearch("");
		setClassId(option.id);
		setTeachingUnitId("");
		return option;
	};

	const assign = useMutationFlow(call, async (call) => {
		if (!selectedClass || !teachingUnitId) return;
		try {
			const { items: courses } = await trpcClient.courses.list.query({
				teachingUnitId,
				limit: 200,
			});
			const skipped: string[] = [];
			const toCreate: Array<{
				code: string;
				class: string;
				course: string;
				teacher: string;
				coefficient: number;
				semesterId?: string;
			}> = [];
			for (const course of courses) {
				if (!course.defaultTeacher) {
					skipped.push(course.name);
					continue;
				}
				const programCode =
					selectedClass.programCode ??
					programMap.get(selectedClass.program)?.code;
				toCreate.push({
					code: generateClassCourseCode({
						programCode: programCode ?? "PRG",
						levelCode: selectedClass.cycleLevelCode,
						semesterCode: selectedClass.semesterCode,
						existingCodes: [...existingCodes, ...toCreate.map((c) => c.code)],
					}),
					class: selectedClass.id,
					course: course.id,
					teacher: course.defaultTeacher,
					coefficient: Number(course.defaultCoefficient) || 1,
					semesterId: selectedClass.semesterId ?? undefined,
				});
			}
			for (const data of toCreate) {
				await trpcClient.classCourses.create.mutate(data);
			}
			queryClient.invalidateQueries({
				queryKey: trpc.classCourses.listPaged.queryKey(),
			});
			if (toCreate.length > 0) {
				toast.success(
					t("admin.classCourses.toast.bulkAssignSuccess", {
						defaultValue: "{{count}} cours assignés avec succès",
						count: toCreate.length,
					}),
				);
			}
			// Keep the dialog open to list the skipped courses
			if (skipped.length > 0) setSkippedCourses(skipped);
			else call.end(true);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classCourses.toast.bulkAssignError", {
							defaultValue: "Erreur lors de l'assignation",
						});
			toast.error(message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={skippedCourses.length > 0}
			preventDismiss={assign.pending}
			title={t("admin.classCourses.ueAssign.title", {
				defaultValue: "Assigner une unité d'enseignement",
			})}
		>
			{skippedCourses.length > 0 ? (
				<div className="space-y-4">
					<div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
						<AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
						<div>
							<p className="font-medium text-yellow-800">
								{t("admin.classCourses.ueAssign.skippedTitle", {
									defaultValue: "Certains cours n'ont pas été assignés",
								})}
							</p>
							<p className="mt-1 text-sm text-yellow-700">
								{t("admin.classCourses.ueAssign.skippedDesc", {
									defaultValue:
										"Les cours suivants n'ont pas d'enseignant par défaut et ont été ignorés :",
								})}
							</p>
							<ul className="mt-2 list-inside list-disc text-sm text-yellow-700">
								{skippedCourses.map((name) => (
									<li key={name}>{name}</li>
								))}
							</ul>
						</div>
					</div>
					<div className="flex justify-end">
						<Button onClick={() => call.end(true)}>
							{t("common.actions.close")}
						</Button>
					</div>
				</div>
			) : (
				<div className="space-y-4">
					<div>
						<label className="mb-2 block font-medium text-sm">
							{t("admin.classCourses.ueAssign.classLabel", {
								defaultValue: "Classe",
							})}
						</label>
						<CodedEntitySelect
							items={classes}
							onSearch={setClassSearch}
							value={classes.find((c) => c.id === classId)?.code || null}
							onChange={(code) => {
								const cls = classes.find((c) => c.code === code);
								setClassId(cls?.id || "");
								setTeachingUnitId("");
							}}
							placeholder={t("admin.classCourses.ueAssign.classPlaceholder", {
								defaultValue: "Sélectionner une classe",
							})}
							searchMode="hybrid"
							getItemSubtitle={(cls) => programMap.get(cls.program)?.name ?? ""}
							onCreate={createClass}
							createLabel={t("admin.classes.actions.add")}
						/>
					</div>

					{classId && (
						<div>
							<label className="mb-2 block font-medium text-sm">
								{t("admin.classCourses.ueAssign.ueLabel", {
									defaultValue: "Unité d'enseignement",
								})}
							</label>
							<Select
								value={teachingUnitId}
								onValueChange={setTeachingUnitId}
								disabled={teachingUnits.length === 0}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t(
											"admin.classCourses.ueAssign.uePlaceholder",
											{
												defaultValue: "Sélectionner une UE",
											},
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{teachingUnits.map(
										(ue: { id: string; code: string; name: string }) => (
											<SelectItem key={ue.id} value={ue.id}>
												{ue.code} - {ue.name}
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
							{teachingUnits.length === 0 && (
								<p className="mt-1 text-muted-foreground text-xs">
									{t("admin.classCourses.ueAssign.noUe", {
										defaultValue: "Aucune UE trouvée pour ce programme",
									})}
								</p>
							)}
						</div>
					)}

					<p className="text-muted-foreground text-xs">
						{t("admin.classCourses.ueAssign.hint", {
							defaultValue:
								"Tous les EC de l'UE seront assignés à la classe avec leur enseignant et coefficient par défaut. Les EC sans enseignant par défaut seront ignorés.",
						})}
					</p>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => call.end(false)}
							disabled={assign.pending}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button
							onClick={() => assign()}
							disabled={!classId || !teachingUnitId || assign.pending}
						>
							{assign.pending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : (
								<Layers className="mr-2 h-4 w-4" />
							)}
							{t("admin.classCourses.ueAssign.submit", {
								defaultValue: "Assigner les cours",
							})}
						</Button>
					</div>
				</div>
			)}
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);

// ── Auto-enrollment ────────────────────────────────────────────────────────

/** Enrolls every student of a class in its assigned courses for a year. */
export const AutoEnrollClassDialog = createCallable<void, boolean>(
	({ call }) => {
		const { t } = useTranslation();
		const queryClient = useQueryClient();
		const [classSearch, setClassSearch] = useState("");
		const [classId, setClassId] = useState("");
		const [academicYearId, setAcademicYearId] = useState<string | null>(null);

		const classes = useClassOptions(classSearch);
		const programMap = useProgramNames();

		const enroll = useMutationFlow(call, async (call) => {
			if (!classId || !academicYearId) return;
			try {
				const result =
					await trpcClient.studentCourseEnrollments.autoEnrollClass.mutate({
						classId,
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
				call.end(true);
			} catch (error) {
				const message =
					error instanceof Error && error.message
						? error.message
						: t("admin.classCourses.toast.autoEnrollError", {
								defaultValue: "Erreur lors de l'inscription automatique",
							});
				toast.error(message);
			}
		});

		return (
			<CallableDialog
				call={call}
				dismissValue={false}
				preventDismiss={enroll.pending}
				title={t("admin.classCourses.autoEnroll.title", {
					defaultValue: "Inscrire automatiquement les étudiants",
				})}
			>
				<div className="space-y-4">
					<p className="text-muted-foreground text-sm">
						{t("admin.classCourses.autoEnroll.description", {
							defaultValue:
								"Inscrit automatiquement tous les étudiants inscrits dans la classe aux cours qui leur sont assignés pour l'année académique choisie.",
						})}
					</p>

					<div>
						<label className="mb-2 block font-medium text-sm">
							{t("admin.classCourses.autoEnroll.classLabel", {
								defaultValue: "Classe",
							})}
						</label>
						<CodedEntitySelect
							items={classes}
							onSearch={setClassSearch}
							value={classes.find((c) => c.id === classId)?.code || null}
							onChange={(code) => {
								const cls = classes.find((c) => c.code === code);
								setClassId(cls?.id || "");
							}}
							placeholder={t("admin.classCourses.autoEnroll.classPlaceholder", {
								defaultValue: "Sélectionner une classe",
							})}
							searchMode="hybrid"
							getItemSubtitle={(cls) => programMap.get(cls.program)?.name ?? ""}
						/>
					</div>

					<div>
						<label className="mb-2 block font-medium text-sm">
							{t("admin.classCourses.autoEnroll.yearLabel", {
								defaultValue: "Année académique",
							})}
						</label>
						<AcademicYearSelect
							value={academicYearId}
							onChange={setAcademicYearId}
						/>
					</div>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => call.end(false)}
							disabled={enroll.pending}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button
							onClick={() => enroll()}
							disabled={!classId || !academicYearId || enroll.pending}
						>
							{enroll.pending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : (
								<Users className="mr-2 h-4 w-4" />
							)}
							{t("admin.classCourses.autoEnroll.submit", {
								defaultValue: "Inscrire les étudiants",
							})}
						</Button>
					</div>
				</div>
			</CallableDialog>
		);
	},
	DIALOG_EXIT_MS,
);

// ── Course catalogue PDF export ────────────────────────────────────────────

/** Exports the UE/EC catalogue as PDF for the filtered year or chosen classes. */
export const CourseCatalogExportDialog = createCallable<
	{ academicYearId?: string | null },
	boolean
>(({ call, academicYearId }) => {
	const { t } = useTranslation();
	const [scope, setScope] = useState<"year" | "selection">("year");
	const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
	const classes = useClassOptions("");

	const exportPdf = useMutationFlow(call, async (call) => {
		try {
			const result = await trpcClient.exports.generateCourseCatalog.mutate({
				classIds: scope === "selection" ? selectedClassIds : [],
				academicYearId:
					scope === "year" && academicYearId ? academicYearId : undefined,
				format: "pdf",
			});
			const bytes = atob(result.data as string);
			const arr = new Uint8Array(bytes.length);
			for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
			const blob = new Blob([arr], { type: "application/pdf" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = result.filename;
			a.click();
			URL.revokeObjectURL(url);
			toast.success(
				t("admin.classCourses.export.success", {
					defaultValue: "Catalogue exporté avec succès",
				}),
			);
			call.end(true);
		} catch {
			toast.error(
				t("admin.classCourses.export.error", {
					defaultValue: "Erreur lors de l'export PDF",
				}),
			);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={false}
			preventDismiss={exportPdf.pending}
			title={t("admin.classCourses.export.title", {
				defaultValue: "Exporter le catalogue UE / EC",
			})}
		>
			<div className="space-y-4">
				<div className="space-y-1.5">
					<Label>
						{t("admin.classCourses.export.scopeLabel", {
							defaultValue: "Périmètre",
						})}
					</Label>
					<Select
						value={scope}
						onValueChange={(v) => setScope(v as "year" | "selection")}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="year">
								{t("admin.classCourses.export.scopeYear", {
									defaultValue: "Toutes les classes de l'année filtrée",
								})}
								{!academicYearId &&
									` (${t("admin.classCourses.export.noYearWarning", { defaultValue: "aucune année sélectionnée" })})`}
							</SelectItem>
							<SelectItem value="selection">
								{t("admin.classCourses.export.scopeSelection", {
									defaultValue: "Classes spécifiques",
								})}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{scope === "selection" && (
					<div className="space-y-1.5">
						<Label>
							{t("admin.classCourses.export.classesLabel", {
								defaultValue: "Classes à inclure",
							})}
						</Label>
						<div className="max-h-48 space-y-0.5 overflow-y-auto rounded border p-2">
							{classes.map((cls) => (
								<label
									key={cls.id}
									className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted"
								>
									<Checkbox
										checked={selectedClassIds.includes(cls.id)}
										onCheckedChange={(checked) =>
											setSelectedClassIds((prev) =>
												checked
													? [...prev, cls.id]
													: prev.filter((id) => id !== cls.id),
											)
										}
									/>
									<span className="flex-1">{cls.name}</span>
									<span className="text-muted-foreground text-xs">
										{cls.code}
									</span>
								</label>
							))}
						</div>
						{selectedClassIds.length > 0 && (
							<p className="text-muted-foreground text-xs">
								{selectedClassIds.length}{" "}
								{t("admin.classCourses.export.selectedCount", {
									defaultValue: "classe(s) sélectionnée(s)",
								})}
							</p>
						)}
					</div>
				)}

				<div className="flex justify-end gap-2">
					<Button
						variant="ghost"
						type="button"
						disabled={exportPdf.pending}
						onClick={() => call.end(false)}
					>
						{t("common.actions.cancel")}
					</Button>
					<Button
						type="button"
						disabled={
							exportPdf.pending ||
							(scope === "year" && !academicYearId) ||
							(scope === "selection" && selectedClassIds.length === 0)
						}
						onClick={() => exportPdf()}
					>
						{exportPdf.pending ? (
							<Spinner className="mr-2 h-4 w-4" />
						) : (
							<FileDown className="mr-2 h-4 w-4" />
						)}
						{t("admin.classCourses.export.generate", {
							defaultValue: "Générer le PDF",
						})}
					</Button>
				</div>
			</div>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);

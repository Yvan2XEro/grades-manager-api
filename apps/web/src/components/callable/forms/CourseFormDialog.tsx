import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { classFormKeys } from "@/components/callable/forms/ClassFormDialog";
import { ProgramFormDialog } from "@/components/callable/forms/ProgramFormDialog";
import { TeachingUnitFormDialog } from "@/components/callable/forms/TeachingUnitFormDialog";
import { QuickCreate } from "@/components/callable/quick-create";
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
import { upsertInList } from "@/lib/query-cache";
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";

type ProgramOption = RouterOutputs["programs"]["list"]["items"][number];
export type Teacher = RouterOutputs["users"]["list"]["items"][number];
type TeachingUnitOption = { id: string; code: string; name: string };

/** Query key of the teachers list shared by the course forms. */
export const TEACHERS_KEY = ["teachers"];

export const fetchTeachers = async () => {
	const { items } = await trpcClient.users.list.query({
		role: "teacher",
		limit: 200,
	});
	return items;
};

export const formatTeacherName = (teacher: Teacher) =>
	[teacher.firstName, teacher.lastName].filter(Boolean).join(" ") ||
	teacher.email;

export type CourseFormResult = RouterOutputs["courses"]["create"];

interface Props {
	course?: {
		id: string;
		code: string;
		name: string;
		hours: number;
		program: string;
		teachingUnitId?: string | null;
		defaultTeacher: string;
	};
	defaults?: { program?: string; teachingUnitId?: string };
}

/**
 * Creates or edits a course; resolves with it, or `undefined` when dismissed.
 * A missing program can be created in place from the "+" next to its select.
 */
export const CourseFormDialog = createCallable<
	Props,
	CourseFormResult | undefined
>(({ call, course, defaults }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [programSearch, setProgramSearch] = useState("");

	const schema = useMemo(
		() =>
			z.object({
				name: z.string().min(2, t("admin.courses.validation.name")),
				hours: z.coerce.number().min(1, t("admin.courses.validation.hours")),
				program: z.string({ error: t("admin.courses.validation.program") }),
				teachingUnitId: z.string().min(
					1,
					t("admin.teachingUnits.validation.required", {
						defaultValue: "Select a teaching unit",
					}),
				),
				defaultTeacher: z.string({
					error: t("admin.courses.validation.teacher"),
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
			}),
		[t],
	);
	type CourseFormInput = z.input<typeof schema>;
	type CourseFormData = z.output<typeof schema>;

	const form = useForm<CourseFormInput, unknown, CourseFormData>({
		resolver: zodResolver(schema),
		defaultValues: course
			? {
					name: course.name,
					hours: course.hours,
					program: course.program,
					teachingUnitId: course.teachingUnitId ?? "",
					defaultTeacher: course.defaultTeacher,
					code: course.code,
				}
			: {
					name: "",
					hours: 0,
					program: defaults?.program ?? "",
					teachingUnitId: defaults?.teachingUnitId ?? "",
					defaultTeacher: "",
					code: "",
				},
	});

	const { data: defaultPrograms = [] } = useQuery({
		queryKey: classFormKeys.programs,
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({ limit: 100 });
			return items as ProgramOption[];
		},
	});
	const { data: searchPrograms = [] } = useQuery({
		queryKey: ["programs", "search", programSearch],
		queryFn: async () =>
			(await trpcClient.programs.search.query({
				query: programSearch,
			})) as ProgramOption[],
		enabled: programSearch.length >= 2,
	});
	const programs = programSearch.length >= 2 ? searchPrograms : defaultPrograms;

	const selectedProgramId = form.watch("program");
	const teachingUnitsKey = ["teachingUnits", selectedProgramId];
	const { data: teachingUnits = [] } = useQuery({
		queryKey: teachingUnitsKey,
		queryFn: async () => {
			const { items } = await trpcClient.teachingUnits.list.query({
				programId: selectedProgramId,
			});
			return items as TeachingUnitOption[];
		},
		enabled: Boolean(selectedProgramId),
	});

	const { data: teachers = [] } = useQuery({
		queryKey: TEACHERS_KEY,
		queryFn: fetchTeachers,
	});

	const createProgram = async () => {
		const program = await ProgramFormDialog.call({});
		if (!program) return;
		const option = { ...program, optionsCount: 0 };
		queryClient.setQueryData<ProgramOption[]>(classFormKeys.programs, (old) =>
			upsertInList(old, option),
		);
		setProgramSearch("");
		form.setValue("program", program.id, { shouldValidate: true });
		return option;
	};

	const createTeachingUnit = async () => {
		if (!selectedProgramId) return;
		const unit = await TeachingUnitFormDialog.call({
			programId: selectedProgramId,
		});
		if (!unit) return;
		queryClient.setQueryData<TeachingUnitOption[]>(teachingUnitsKey, (old) =>
			upsertInList(old ?? [], unit),
		);
		form.setValue("teachingUnitId", unit.id, { shouldValidate: true });
	};

	const submit = useMutationFlow(call, async (call, data: CourseFormData) => {
		try {
			const saved = course
				? await trpcClient.courses.update.mutate({ id: course.id, ...data })
				: await trpcClient.courses.create.mutate(data);
			queryClient.invalidateQueries({
				queryKey: trpc.courses.listPaged.queryKey(),
			});
			queryClient.invalidateQueries({ queryKey: trpc.courses.list.queryKey() });
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			queryClient.invalidateQueries({ queryKey: ["course-options"] });
			toast.success(
				course
					? t("admin.courses.toast.updateSuccess")
					: t("admin.courses.toast.createSuccess"),
			);
			call.end(saved as CourseFormResult);
		} catch (error) {
			toast.error(
				(error as Error).message ||
					(course
						? t("admin.courses.toast.updateError")
						: t("admin.courses.toast.createError")),
			);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			title={
				course
					? t("admin.courses.form.editTitle")
					: t("admin.courses.form.createTitle")
			}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>
										{t("admin.courses.form.nameLabel")}
									</FormLabel>
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
							name="code"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>
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
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="hours"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>
										{t("admin.courses.form.hoursLabel")}
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											{...field}
											value={(field.value as number | undefined) ?? ""}
											onChange={(event) =>
												field.onChange(
													event.target.value === ""
														? undefined
														: Number(event.target.value),
												)
											}
											placeholder={t("admin.courses.form.hoursPlaceholder")}
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
									<FormLabel required>
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
					</div>
					<CodedEntitySelect
						items={programs}
						onSearch={setProgramSearch}
						value={
							programs.find((p) => p.id === form.watch("program"))?.code || null
						}
						onChange={(code) => {
							const program = programs.find((p) => p.code === code);
							form.setValue("program", program?.id || "");
						}}
						label={t("admin.courses.form.programLabel")}
						placeholder={t("admin.courses.form.programPlaceholder")}
						error={form.formState.errors.program?.message}
						searchMode="hybrid"
						required
						onCreate={createProgram}
						createLabel={t("admin.programs.actions.add")}
					/>
					<FormField
						control={form.control}
						name="teachingUnitId"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admin.teachingUnits.list", {
										defaultValue: "Teaching unit",
									})}
								</FormLabel>
								<QuickCreate
									onCreate={createTeachingUnit}
									label={t("admin.teachingUnits.actions.create", {
										defaultValue: "Create UE",
									})}
									disabled={!selectedProgramId}
								>
									<Select
										value={field.value || undefined}
										onValueChange={field.onChange}
										disabled={!selectedProgramId}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"admin.courses.form.teachingUnitPlaceholder",
														{
															defaultValue: "Select a teaching unit",
														},
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{teachingUnits.map((unit) => (
												<SelectItem key={unit.id} value={unit.id}>
													{unit.code} - {unit.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</QuickCreate>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							disabled={submit.pending}
							onClick={() => call.end(undefined)}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={submit.pending}>
							{submit.pending ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : course ? (
								t("common.actions.saveChanges")
							) : (
								t("admin.courses.form.createSubmit")
							)}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);

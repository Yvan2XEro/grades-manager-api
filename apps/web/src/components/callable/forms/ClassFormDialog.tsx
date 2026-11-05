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
import { AcademicYearFormDialog } from "@/components/callable/forms/AcademicYearFormDialog";
import { CycleLevelFormDialog } from "@/components/callable/forms/CycleLevelFormDialog";
import { ProgramFormDialog } from "@/components/callable/forms/ProgramFormDialog";
import { ProgramOptionFormDialog } from "@/components/callable/forms/ProgramOptionFormDialog";
import { QuickCreate } from "@/components/callable/quick-create";
import { CodedEntitySelect } from "@/components/forms";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
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
import { generateClassCode } from "@/lib/code-generator";
import { upsertInList } from "@/lib/query-cache";
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";

type CycleLevelOption = {
	id: string;
	code: string;
	name: string;
	cycle: { id: string; name: string; code: string | null };
};

type ProgramOptionItem = { id: string; code: string; name: string };
type StudyCycleItem = { id: string; code: string | null; name: string };

/** Query keys of the lists feeding the class form selects (shared with ClassManagement). */
export const classFormKeys = {
	programs: ["programs"],
	cycleLevels: (cycleId: string) => ["cycleLevelsByProgram", cycleId],
	programOptions: (programId: string | undefined) => [
		"programOptions",
		programId,
	],
	semesters: ["semesters"],
} as const;

const fetchPrograms = async () => {
	const { items } = await trpcClient.programs.list.query({ limit: 100 });
	return items;
};

export type ClassFormResult = RouterOutputs["classes"]["create"];

interface Props {
	/** Prefills the form, e.g. the year of the list the caller is showing. */
	defaults?: { academicYearId?: string; programId?: string };
	/** Prevents changing the year, e.g. when the caller lists one year's classes. */
	lockAcademicYear?: boolean;
	/** Codes already used, so the suggested code doesn't collide. */
	existingCodes?: string[];
}

/**
 * Creates a class. Every dependency (program, academic year, cycle level,
 * program option) can be created in place from the "+" next to its select;
 * the new entity is written into the React Query cache feeding that select
 * and selected right away.
 */
export const ClassFormDialog = createCallable<
	Props,
	ClassFormResult | undefined
>(({ call, defaults, lockAcademicYear, existingCodes = [] }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [programSearch, setProgramSearch] = useState("");
	const [programOptionSearch, setProgramOptionSearch] = useState("");
	const [cycleLevelSearch, setCycleLevelSearch] = useState("");

	const schema = useMemo(
		() =>
			z.object({
				programId: z.string({
					error: t("admin.classes.validation.program"),
				}),
				academicYearId: z.string({
					error: t("admin.classes.validation.academicYear"),
				}),
				cycleLevelId: z.string({
					error: t("admin.classes.validation.cycleLevel", {
						defaultValue: "Please select a cycle level",
					}),
				}),
				programOptionId: z.string({
					error: t("admin.classes.validation.programOption", {
						defaultValue: "Please select a program option",
					}),
				}),
				semesterId: z.string().optional(),
				code: z.string().min(
					3,
					t("admin.classes.validation.code", {
						defaultValue: "Code is required",
					}),
				),
				name: z.string().min(2, t("admin.classes.validation.name")),
				totalCredits: z.coerce.number().int().min(0).default(0),
			}),
		[t],
	);
	type ClassFormInput = z.input<typeof schema>;
	type ClassFormData = z.output<typeof schema>;

	const form = useForm<ClassFormInput, unknown, ClassFormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			programId: defaults?.programId ?? "",
			academicYearId: defaults?.academicYearId ?? "",
			cycleLevelId: "",
			programOptionId: "",
			semesterId: "",
			code: "",
			name: "",
			totalCredits: 0,
		},
	});
	const { watch, setValue } = form;

	// ── Programs ──────────────────────────────────────────────────────────
	const { data: defaultPrograms = [] } = useQuery({
		queryKey: classFormKeys.programs,
		queryFn: fetchPrograms,
	});
	const { data: searchPrograms = [] } = useQuery({
		queryKey: ["programs", "search", programSearch],
		queryFn: () => trpcClient.programs.search.query({ query: programSearch }),
		enabled: programSearch.length >= 2,
	});
	const programs = programSearch.length >= 2 ? searchPrograms : defaultPrograms;
	const selectedProgramId = watch("programId");
	const selectedProgram = useMemo(
		() => programs.find((p) => p.id === selectedProgramId),
		[programs, selectedProgramId],
	);
	const programCycleId = selectedProgram?.cycleId ?? "";

	// ── Academic years ───────────────────────────────────────────────────
	const { data: yearsData } = useQuery(
		trpc.academicYears.list.queryOptions({}),
	);
	const academicYears = yearsData?.items ?? [];
	const selectedAcademicYearId = watch("academicYearId");

	// ── Cycle levels (of the program's cycle) ────────────────────────────
	const { data: defaultCycleLevels = [] } = useQuery({
		queryKey: classFormKeys.cycleLevels(programCycleId),
		queryFn: async () => {
			if (!programCycleId) return [] as CycleLevelOption[];
			const { items: cycles } = await trpcClient.studyCycles.listCycles.query({
				limit: 100,
			});
			const cycle = (cycles as StudyCycleItem[]).find(
				(c) => c.id === programCycleId,
			);
			if (!cycle) return [];
			const levelList = await trpcClient.studyCycles.listLevels.query({
				cycleId: programCycleId,
			});
			return (levelList as Omit<CycleLevelOption, "cycle">[]).map((level) => ({
				...level,
				cycle: { id: cycle.id, name: cycle.name, code: cycle.code },
			})) as CycleLevelOption[];
		},
		enabled: Boolean(programCycleId),
	});
	const { data: searchCycleLevels = [] } = useQuery({
		queryKey: ["cycleLevels", "search", cycleLevelSearch, programCycleId],
		queryFn: async () => {
			if (!programCycleId) return [] as CycleLevelOption[];
			const { items: cycles } = await trpcClient.studyCycles.listCycles.query({
				limit: 100,
			});
			const cycle = (cycles as StudyCycleItem[]).find(
				(c) => c.id === programCycleId,
			);
			if (!cycle) return [];
			const items = await trpcClient.cycleLevels.search.query({
				query: cycleLevelSearch,
				cycleId: programCycleId,
			});
			return (items as Omit<CycleLevelOption, "cycle">[]).map((level) => ({
				...level,
				cycle: { id: cycle.id, name: cycle.name, code: cycle.code },
			})) as CycleLevelOption[];
		},
		enabled: Boolean(programCycleId) && cycleLevelSearch.length >= 2,
	});
	const cycleLevels =
		cycleLevelSearch.length >= 2 ? searchCycleLevels : defaultCycleLevels;
	const cycleLevelId = watch("cycleLevelId");
	const selectedCycleLevel = useMemo(
		() => cycleLevels.find((level) => level.id === cycleLevelId),
		[cycleLevels, cycleLevelId],
	);

	// ── Semesters ─────────────────────────────────────────────────────────
	const { data: semestersData } = useQuery({
		queryKey: classFormKeys.semesters,
		queryFn: () => trpcClient.semesters.list.query(),
	});
	const semesters = semestersData?.items;
	const semesterId = watch("semesterId");
	const selectedSemester = useMemo(
		() => semesters?.find((semester) => semester.id === semesterId),
		[semesters, semesterId],
	);

	// ── Program options ───────────────────────────────────────────────────
	const { data: defaultProgramOptions = [] } = useQuery({
		queryKey: classFormKeys.programOptions(selectedProgram?.id),
		queryFn: async (): Promise<ProgramOptionItem[]> => {
			if (!selectedProgram) return [];
			const { items } = await trpcClient.programOptions.list.query({
				programId: selectedProgram.id,
				limit: 100,
			});
			return items as ProgramOptionItem[];
		},
		enabled: Boolean(selectedProgram?.id),
	});
	const { data: searchProgramOptions = [] } = useQuery({
		queryKey: [
			"programOptions",
			"search",
			programOptionSearch,
			selectedProgram?.id,
		],
		queryFn: async (): Promise<ProgramOptionItem[]> => {
			if (!selectedProgram) return [];
			return (await trpcClient.programOptions.search.query({
				query: programOptionSearch,
				programId: selectedProgram.id,
			})) as ProgramOptionItem[];
		},
		enabled: Boolean(selectedProgram?.id) && programOptionSearch.length >= 2,
	});
	const programOptions =
		programOptionSearch.length >= 2
			? searchProgramOptions
			: defaultProgramOptions;
	const programOptionId = watch("programOptionId");
	const selectedProgramOption = useMemo(
		() => programOptions.find((option) => option.id === programOptionId),
		[programOptions, programOptionId],
	);

	// ── Dependent field resets & derived values ───────────────────────────
	useEffect(() => {
		if (!selectedProgram) {
			setValue("cycleLevelId", "");
			setValue("programOptionId", "");
		}
	}, [selectedProgram, setValue]);

	useEffect(() => {
		if (!cycleLevels.length) return;
		if (!cycleLevelId || !cycleLevels.some((l) => l.id === cycleLevelId)) {
			setValue("cycleLevelId", cycleLevels[0].id);
		}
	}, [cycleLevels, cycleLevelId, setValue]);

	useEffect(() => {
		if (!programOptions.length) return;
		if (
			!programOptionId ||
			!programOptions.some((option) => option.id === programOptionId)
		) {
			setValue("programOptionId", programOptions[0].id);
		}
	}, [programOptions, programOptionId, setValue]);

	useEffect(() => {
		const year = academicYears.find((y) => y.id === selectedAcademicYearId);
		if (selectedProgramOption && year) {
			const startYear = new Date(year.startDate).getFullYear();
			const endYear = new Date(year.endDate).getFullYear();
			setValue(
				"name",
				`${selectedProgramOption.name} (${startYear}-${endYear})`,
			);
		}
	}, [selectedProgramOption, selectedAcademicYearId, academicYears, setValue]);

	const codeValue = watch("code");
	const codeDirty = Boolean(form.formState.dirtyFields.code);
	useEffect(() => {
		if (codeDirty) return;
		if (!selectedProgram?.code || !selectedSemester?.code) return;
		const suggestion = generateClassCode({
			programCode: selectedProgram.code,
			levelCode: selectedCycleLevel?.code,
			semesterCode: selectedSemester.code,
			existingCodes,
		});
		if (suggestion && codeValue !== suggestion) {
			setValue("code", suggestion, { shouldDirty: false });
		}
	}, [
		existingCodes,
		codeDirty,
		codeValue,
		selectedProgram?.code,
		selectedCycleLevel?.code,
		selectedSemester?.code,
		setValue,
	]);

	// ── Quick create (nested Callables) ───────────────────────────────────
	const createProgram = async () => {
		const program = await ProgramFormDialog.call({});
		if (!program) return;
		queryClient.setQueryData<Awaited<ReturnType<typeof fetchPrograms>>>(
			classFormKeys.programs,
			(old) => upsertInList(old, { ...program, optionsCount: 0 }),
		);
		setProgramSearch("");
		setValue("programId", program.id, { shouldValidate: true });
		return program;
	};

	const createAcademicYear = async () => {
		const year = await AcademicYearFormDialog.call({});
		if (!year) return;
		queryClient.setQueryData(trpc.academicYears.list.queryKey({}), (old) =>
			upsertInList(old, year),
		);
		setValue("academicYearId", year.id, { shouldValidate: true });
	};

	const createCycleLevel = async () => {
		if (!programCycleId) return;
		const level = await CycleLevelFormDialog.call({
			cycleId: programCycleId,
			defaults: {
				code: `${selectedProgram?.code ?? "L"}-L${cycleLevels.length + 1}`,
			},
		});
		if (!level) return;
		const cycle = cycleLevels[0]?.cycle ?? {
			id: programCycleId,
			name: "",
			code: null,
		};
		const option = { ...level, cycle } as CycleLevelOption;
		queryClient.setQueryData<CycleLevelOption[]>(
			classFormKeys.cycleLevels(programCycleId),
			(old) => upsertInList(old ?? [], option),
		);
		setCycleLevelSearch("");
		setValue("cycleLevelId", level.id, { shouldValidate: true });
		return option;
	};

	const createProgramOption = async () => {
		if (!selectedProgram) return;
		const option = await ProgramOptionFormDialog.call({
			programId: selectedProgram.id,
		});
		if (!option) return;
		queryClient.setQueryData<ProgramOptionItem[]>(
			classFormKeys.programOptions(selectedProgram.id),
			(old) => upsertInList(old ?? [], option),
		);
		setProgramOptionSearch("");
		setValue("programOptionId", option.id, { shouldValidate: true });
		return option;
	};

	// ── Submit ────────────────────────────────────────────────────────────
	const submit = useMutationFlow(call, async (call, data: ClassFormData) => {
		try {
			const created = await trpcClient.classes.create.mutate({
				name: data.name,
				program: data.programId,
				academicYear: data.academicYearId,
				cycleLevelId: data.cycleLevelId,
				programOptionId: data.programOptionId,
				semesterId: data.semesterId || undefined,
				code: data.code,
				totalCredits: data.totalCredits,
			});
			queryClient.invalidateQueries({
				queryKey: trpc.classes.listPaged.queryKey(),
			});
			queryClient.invalidateQueries({ queryKey: trpc.classes.list.queryKey() });
			queryClient.invalidateQueries({ queryKey: ["class-select"] });
			queryClient.invalidateQueries({ queryKey: ["classes"] });
			queryClient.invalidateQueries({ queryKey: ["class-options"] });
			toast.success(t("admin.classes.toast.createSuccess"));
			call.end(created);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.classes.toast.createError");
			toast.error(message);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			title={t("admin.classes.form.createTitle")}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-4">
					<CodedEntitySelect
						items={programs}
						onSearch={setProgramSearch}
						value={
							programs.find((p) => p.id === selectedProgramId)?.code || null
						}
						onChange={(code) => {
							const program = programs.find((p) => p.code === code);
							setValue("programId", program?.id || "");
						}}
						label={t("admin.classes.form.programLabel")}
						placeholder={t("admin.classes.form.programPlaceholder")}
						error={form.formState.errors.programId?.message}
						searchMode="hybrid"
						getItemSubtitle={(program) =>
							(program as { institutionInfo?: { name?: string } })
								.institutionInfo?.name || ""
						}
						required
						onCreate={createProgram}
						createLabel={t("admin.programs.actions.add")}
					/>

					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="academicYearId"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>
										{t("admin.classes.form.academicYearLabel")}
									</FormLabel>
									<QuickCreate
										onCreate={createAcademicYear}
										label={t("admin.academicYears.actions.add")}
										disabled={lockAcademicYear}
									>
										<FormControl>
											<AcademicYearSelect
												value={field.value || null}
												onChange={field.onChange}
												disabled={lockAcademicYear}
												placeholder={t(
													"admin.classes.form.academicYearPlaceholder",
												)}
											/>
										</FormControl>
									</QuickCreate>
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
										{t("admin.classes.form.semesterLabel", {
											defaultValue: "Semester",
										})}
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value}
										disabled={!semesters || semesters.length === 0}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"admin.classes.form.semesterPlaceholder",
														{ defaultValue: "Select a semester" },
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
					</div>

					<CodedEntitySelect
						items={cycleLevels}
						onSearch={setCycleLevelSearch}
						value={cycleLevels.find((l) => l.id === cycleLevelId)?.code || null}
						onChange={(code) => {
							const level = cycleLevels.find((l) => l.code === code);
							setValue("cycleLevelId", level?.id || "");
						}}
						label={t("admin.classes.form.cycleLevelLabel", {
							defaultValue: "Cycle level",
						})}
						placeholder={t("admin.classes.form.cycleLevelPlaceholder", {
							defaultValue: "Select cycle level",
						})}
						error={form.formState.errors.cycleLevelId?.message}
						searchMode="hybrid"
						getItemSubtitle={(level) =>
							`${level.cycle.name}${level.cycle.code ? ` (${level.cycle.code})` : ""}`
						}
						disabled={!programCycleId}
						emptyMessage={
							!selectedProgram
								? t("admin.classes.form.selectProgramFirst", {
										defaultValue: "Select a program to load its cycle levels.",
									})
								: t("admin.classes.form.emptyCycleLevels", {
										defaultValue:
											"No cycle levels available for the selected program's institution.",
									})
						}
						required
						onCreate={createCycleLevel}
						createLabel={t("admin.studyCycles.actions.addLevel", {
							defaultValue: "Add level",
						})}
					/>
					<CodedEntitySelect
						items={programOptions}
						onSearch={setProgramOptionSearch}
						value={
							programOptions.find((o) => o.id === programOptionId)?.code || null
						}
						onChange={(code) => {
							const option = programOptions.find((o) => o.code === code);
							setValue("programOptionId", option?.id || "");
						}}
						label={t("admin.classes.form.programOptionLabel", {
							defaultValue: "Program option",
						})}
						placeholder={t("admin.classes.form.programOptionPlaceholder", {
							defaultValue: "Select option",
						})}
						error={form.formState.errors.programOptionId?.message}
						searchMode="hybrid"
						disabled={!selectedProgram}
						emptyMessage={
							!selectedProgram
								? t("admin.classes.form.selectProgramFirst", {
										defaultValue: "Select a program to load its options.",
									})
								: "No options available"
						}
						required
						onCreate={createProgramOption}
						createLabel={t("admin.programs.options.add", {
							defaultValue: "Add Option",
						})}
					/>

					<div className="grid gap-4 sm:grid-cols-3">
						<FormField
							control={form.control}
							name="code"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>
										{t("admin.classes.form.codeLabel", {
											defaultValue: "Code",
										})}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder={t("admin.classes.form.codePlaceholder", {
												defaultValue: "INF11-01",
											})}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("admin.classes.form.labelLabel")}</FormLabel>
									<FormControl>
										<Input {...field} readOnly />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="totalCredits"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("admin.classes.form.totalCreditsLabel", {
											defaultValue: "Total credits",
										})}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											value={field.value as number}
											type="number"
											min={0}
											placeholder={t(
												"admin.classes.form.totalCreditsPlaceholder",
												{ defaultValue: "e.g. 30" },
											)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

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
							) : (
								t("admin.classes.form.createSubmit")
							)}
						</Button>
					</div>
				</form>
			</Form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);

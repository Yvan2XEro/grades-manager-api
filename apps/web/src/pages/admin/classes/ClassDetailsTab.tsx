import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { z } from "zod";
import { CodedEntitySelect } from "@/components/forms";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { useClassContext } from "./ClassContext";

const schema = z.object({
	programId: z.string().min(1, "Program is required"),
	academicYearId: z.string().min(1, "Academic year is required"),
	cycleLevelId: z.string().min(1, "Cycle level is required"),
	programOptionId: z.string().min(1, "Program option is required"),
	semesterId: z.string().optional(),
	code: z.string().min(1, "Code is required"),
	name: z.string().min(1, "Name is required"),
	totalCredits: z.coerce.number().int().min(0).default(0),
});

type FormData = z.infer<typeof schema>;

export default function ClassDetailsTab() {
	const { t } = useTranslation();
	const { classId } = useParams<{ classId: string }>();
	const { cls, refetch } = useClassContext();
	const queryClient = useQueryClient();

	const [programSearch, setProgramSearch] = useState("");
	const [programOptionSearch, setProgramOptionSearch] = useState("");

	const form = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			programId: "",
			academicYearId: "",
			cycleLevelId: "",
			programOptionId: "",
			semesterId: "",
			code: "",
			name: "",
			totalCredits: 0,
		},
	});

	const { watch } = form;
	const selectedProgramId = watch("programId");
	const selectedCycleLevelId = watch("cycleLevelId");
	const selectedProgramOptionId = watch("programOptionId");

	useEffect(() => {
		if (cls) {
			form.reset({
				programId: cls.program ?? "",
				academicYearId: cls.academicYear ?? "",
				cycleLevelId: cls.cycleLevelId ?? "",
				programOptionId: cls.programOptionId ?? "",
				semesterId: cls.semesterId ?? "",
				code: cls.code ?? "",
				name: cls.name ?? "",
				totalCredits: cls.totalCredits ?? 0,
			});
		}
	}, [cls, form]);

	// --- Programs ---
	const { data: defaultPrograms = [] } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({ limit: 100 });
			return items;
		},
	});

	const { data: searchPrograms = [] } = useQuery({
		queryKey: ["programs", "search", programSearch],
		queryFn: () => trpcClient.programs.search.query({ query: programSearch }),
		enabled: programSearch.length >= 2,
	});

	const programs = programSearch.length >= 2 ? searchPrograms : defaultPrograms;

	const selectedProgram = useMemo(
		() => programs.find((p) => p.id === selectedProgramId),
		[programs, selectedProgramId],
	);

	// --- Cycle levels (cascade from program → institution → cycles → levels) ---
	const { data: cycleLevels = [] } = useQuery({
		queryKey: ["cycleLevelsByInstitution", selectedProgram?.institutionId],
		queryFn: async () => {
			if (!selectedProgram?.institutionId) return [];
			const { items: cycles } = await trpcClient.studyCycles.listCycles.query({
				institutionId: selectedProgram.institutionId,
				limit: 100,
			});
			if (!cycles.length) return [];
			const levelLists = await Promise.all(
				cycles.map((cycle) =>
					trpcClient.studyCycles.listLevels.query({ cycleId: cycle.id }),
				),
			);
			return levelLists.flat();
		},
		enabled: Boolean(selectedProgram?.institutionId),
	});

	// --- Program options ---
	const { data: defaultProgramOptions = [] } = useQuery({
		queryKey: ["programOptions", selectedProgram?.id],
		queryFn: async () => {
			if (!selectedProgram) return [];
			const { items } = await trpcClient.programOptions.list.query({
				programId: selectedProgram.id,
				limit: 100,
			});
			return items;
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
		queryFn: async () => {
			if (!selectedProgram) return [];
			return trpcClient.programOptions.search.query({
				query: programOptionSearch,
				programId: selectedProgram.id,
			});
		},
		enabled: Boolean(selectedProgram?.id) && programOptionSearch.length >= 2,
	});

	const programOptions =
		programOptionSearch.length >= 2
			? searchProgramOptions
			: defaultProgramOptions;

	// --- Semesters ---
	const { data: semestersData } = useQuery({
		queryKey: ["semesters"],
		queryFn: () => trpcClient.semesters.list.query(),
	});
	const semesters = semestersData?.items ?? [];

	// --- Update mutation ---
	const updateMutation = useMutation({
		mutationFn: (data: FormData) =>
			trpcClient.classes.update.mutate({
				id: classId!,
				program: data.programId,
				academicYear: data.academicYearId,
				cycleLevelId: data.cycleLevelId,
				programOptionId: data.programOptionId,
				semesterId: data.semesterId || undefined,
				code: data.code,
				name: data.name,
				totalCredits: data.totalCredits,
			}),
		onSuccess: () => {
			toast.success(
				t("admin.classes.toast.updateSuccess", {
					defaultValue: "Class updated",
				}),
			);
			queryClient.invalidateQueries(
				trpc.classes.getById.queryOptions({ id: classId! }),
			);
			refetch();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	// Helper: find program code for CodedEntitySelect value
	const programCode =
		programs.find((p) => p.id === selectedProgramId)?.code ??
		cls.programInfo?.code ??
		null;

	// Helper: find cycle level code for CodedEntitySelect value
	const cycleLevelCode =
		cycleLevels.find((l) => l.id === selectedCycleLevelId)?.code ??
		cls.cycleLevel?.code ??
		null;

	// Helper: find program option code for CodedEntitySelect value
	const programOptionCode =
		programOptions.find((o) => o.id === selectedProgramOptionId)?.code ??
		cls.programOption?.code ??
		null;

	return (
		<Card>
			<CardContent className="pt-6">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
						className="space-y-4"
					>
						{/* Program */}
						<CodedEntitySelect
							items={programs}
							onSearch={setProgramSearch}
							value={programCode}
							onChange={(code) => {
								const prog = programs.find((p) => p.code === code);
								form.setValue("programId", prog?.id ?? "", {
									shouldValidate: true,
								});
							}}
							label={t("admin.classes.form.programLabel", {
								defaultValue: "Program",
							})}
							placeholder={t("admin.classes.form.programPlaceholder", {
								defaultValue: "Select program",
							})}
							error={form.formState.errors.programId?.message}
							searchMode="hybrid"
							required
						/>

						{/* Cycle level */}
						<CodedEntitySelect
							items={cycleLevels}
							value={cycleLevelCode}
							onChange={(code) => {
								const level = cycleLevels.find((l) => l.code === code);
								form.setValue("cycleLevelId", level?.id ?? "", {
									shouldValidate: true,
								});
							}}
							label={t("admin.classes.form.cycleLevelLabel", {
								defaultValue: "Cycle level",
							})}
							placeholder={t("admin.classes.form.cycleLevelPlaceholder", {
								defaultValue: "Select cycle level",
							})}
							error={form.formState.errors.cycleLevelId?.message}
							searchMode="hybrid"
							disabled={!selectedProgram || cycleLevels.length === 0}
							emptyMessage={
								!selectedProgram
									? t("admin.classes.form.selectProgramFirst", {
											defaultValue:
												"Select a program to load its cycle levels.",
										})
									: t("admin.classes.form.emptyCycleLevels", {
											defaultValue:
												"No cycle levels available for the selected program.",
										})
							}
							required
						/>

						{/* Program option */}
						<CodedEntitySelect
							items={programOptions}
							onSearch={setProgramOptionSearch}
							value={programOptionCode}
							onChange={(code) => {
								const opt = programOptions.find((o) => o.code === code);
								form.setValue("programOptionId", opt?.id ?? "", {
									shouldValidate: true,
								});
							}}
							label={t("admin.classes.form.programOptionLabel", {
								defaultValue: "Program option",
							})}
							placeholder={t("admin.classes.form.programOptionPlaceholder", {
								defaultValue: "Select option",
							})}
							error={form.formState.errors.programOptionId?.message}
							searchMode="hybrid"
							disabled={!selectedProgram || programOptions.length === 0}
							emptyMessage={
								!selectedProgram
									? t("admin.classes.form.selectProgramFirst", {
											defaultValue: "Select a program to load its options.",
										})
									: "No options available"
							}
							required
						/>

						<div className="grid gap-4 md:grid-cols-2">
							{/* Academic year */}
							<FormField
								control={form.control}
								name="academicYearId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.classes.form.academicYearLabel", {
												defaultValue: "Academic Year",
											})}
										</FormLabel>
										<FormControl>
											<AcademicYearSelect
												value={field.value || null}
												onChange={(v) => field.onChange(v ?? "")}
												placeholder={t(
													"admin.classes.form.academicYearPlaceholder",
													{ defaultValue: "Select year" },
												)}
												autoSelectActive={false}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Semester */}
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
											onValueChange={(v) =>
												field.onChange(v === "none" ? "" : v)
											}
											value={field.value || "none"}
											disabled={semesters.length === 0}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"admin.classes.form.semesterPlaceholder",
															{ defaultValue: "Select semester" },
														)}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													{t("common.none", { defaultValue: "None" })}
												</SelectItem>
												{semesters.map((sem) => (
													<SelectItem key={sem.id} value={sem.id}>
														{sem.name} ({sem.code})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							{/* Code */}
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.classes.form.codeLabel", {
												defaultValue: "Code",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Name */}
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.classes.form.labelLabel", {
												defaultValue: "Name",
											})}
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Total credits */}
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
												type="number"
												min={0}
												value={field.value ?? ""}
												onChange={(e) =>
													field.onChange(
														e.target.value === "" ? 0 : Number(e.target.value),
													)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="flex justify-end pt-2">
							<Button type="submit" disabled={updateMutation.isPending}>
								{updateMutation.isPending
									? t("common.actions.saving", { defaultValue: "Saving..." })
									: t("common.actions.saveChanges")}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}

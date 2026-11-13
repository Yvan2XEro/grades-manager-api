import { useTranslation } from "react-i18next";
import { QuickCreate } from "@/components/callable/quick-create";
import { CodedEntitySelect } from "@/components/forms";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import {
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
import type { ClassFormController } from "../hooks/use-class-form";

interface ClassFormFieldsProps {
	controller: ClassFormController;
	lockAcademicYear?: boolean;
	/** Codes shown while the stored program/level/option is outside the loaded lists. */
	fallbackCodes?: {
		program?: string | null;
		cycleLevel?: string | null;
		programOption?: string | null;
	};
}

/** Fields of the class form, shared by the create dialog and the class details tab. */
export function ClassFormFields({
	controller,
	lockAcademicYear,
	fallbackCodes,
}: ClassFormFieldsProps) {
	const { t } = useTranslation();
	// Selected entities come from the hook: `form.watch` in this child would be
	// memoized by the React Compiler and go stale
	const {
		form,
		mode,
		programs,
		program,
		cycleLevels,
		cycleLevel,
		programOptions,
		programOption,
		semesters,
	} = controller;
	const { errors } = form.formState;
	const pick = (
		field: "programId" | "cycleLevelId" | "programOptionId",
		id = "",
	) => form.setValue(field, id, { shouldValidate: true, shouldDirty: true });

	return (
		<>
			<CodedEntitySelect
				items={programs}
				onSearch={controller.search.program}
				value={program?.code ?? fallbackCodes?.program ?? null}
				onChange={(code) =>
					pick("programId", programs.find((p) => p.code === code)?.id)
				}
				label={t("admin.classes.form.programLabel")}
				placeholder={t("admin.classes.form.programPlaceholder")}
				error={errors.programId?.message}
				searchMode="hybrid"
				getItemSubtitle={(item) =>
					(item as { institutionInfo?: { name?: string } }).institutionInfo
						?.name || ""
				}
				required
				onCreate={controller.create.program}
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
								onCreate={controller.create.academicYear}
								label={t("admin.academicYears.actions.add")}
								disabled={lockAcademicYear}
							>
								<FormControl>
									<AcademicYearSelect
										value={field.value || null}
										onChange={(value) => field.onChange(value ?? "")}
										disabled={lockAcademicYear}
										autoSelectActive={mode === "create"}
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
								onValueChange={(value) =>
									field.onChange(value === "none" ? "" : value)
								}
								value={field.value || "none"}
								disabled={semesters.length === 0}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue
											placeholder={t("admin.classes.form.semesterPlaceholder", {
												defaultValue: "Select a semester",
											})}
										/>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="none">
										{t("common.none", { defaultValue: "None" })}
									</SelectItem>
									{semesters.map((semester) => (
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
				onSearch={controller.search.cycleLevel}
				value={cycleLevel?.code ?? fallbackCodes?.cycleLevel ?? null}
				onChange={(code) =>
					pick("cycleLevelId", cycleLevels.find((l) => l.code === code)?.id)
				}
				label={t("admin.classes.form.cycleLevelLabel", {
					defaultValue: "Cycle level",
				})}
				placeholder={t("admin.classes.form.cycleLevelPlaceholder", {
					defaultValue: "Select cycle level",
				})}
				error={errors.cycleLevelId?.message}
				searchMode="hybrid"
				getItemSubtitle={(level) =>
					`${level.cycle.name}${level.cycle.code ? ` (${level.cycle.code})` : ""}`
				}
				disabled={!program?.cycleId}
				emptyMessage={
					!program
						? t("admin.classes.form.selectProgramFirst", {
								defaultValue: "Select a program to load its cycle levels.",
							})
						: t("admin.classes.form.emptyCycleLevels", {
								defaultValue:
									"No cycle levels available for the selected program's institution.",
							})
				}
				required
				onCreate={controller.create.cycleLevel}
				createLabel={t("admin.studyCycles.actions.addLevel", {
					defaultValue: "Add level",
				})}
			/>

			<CodedEntitySelect
				items={programOptions}
				onSearch={controller.search.programOption}
				value={programOption?.code ?? fallbackCodes?.programOption ?? null}
				onChange={(code) =>
					pick(
						"programOptionId",
						programOptions.find((o) => o.code === code)?.id,
					)
				}
				label={t("admin.classes.form.programOptionLabel", {
					defaultValue: "Program option",
				})}
				placeholder={t("admin.classes.form.programOptionPlaceholder", {
					defaultValue: "Select option",
				})}
				error={errors.programOptionId?.message}
				searchMode="hybrid"
				disabled={!program}
				emptyMessage={
					!program
						? t("admin.classes.form.selectProgramFirst", {
								defaultValue: "Select a program to load its options.",
							})
						: t("admin.classes.form.emptyProgramOptions", {
								defaultValue: "No options available",
							})
				}
				required
				onCreate={controller.create.programOption}
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
								{t("admin.classes.form.codeLabel", { defaultValue: "Code" })}
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
								{/* Derived from option + year when creating */}
								<Input {...field} readOnly={mode === "create"} />
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
									placeholder={t("admin.classes.form.totalCreditsPlaceholder", {
										defaultValue: "e.g. 30",
									})}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</>
	);
}

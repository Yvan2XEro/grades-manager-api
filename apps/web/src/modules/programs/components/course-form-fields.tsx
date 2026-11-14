import { useTranslation } from "react-i18next";
import { QuickCreate } from "@/components/callable/quick-create";
import { CodedEntitySelect } from "@/components/forms";
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
import type { CourseFormController } from "../hooks/use-course-form";
import { formatTeacherName, type Teacher } from "../hooks/use-teachers";

/** Fields of the course form; watched values come from `useCourseForm`. */
export function CourseFormFields({
	controller,
}: {
	controller: CourseFormController;
}) {
	const { t } = useTranslation();
	const {
		form,
		programs,
		setProgramSearch,
		selectedProgramId,
		selectedProgramCode,
		teachingUnits,
		teachers,
		createProgram,
		createTeachingUnit,
	} = controller;

	return (
		<>
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
											placeholder={t("admin.courses.form.teacherPlaceholder")}
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
				value={selectedProgramCode}
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
		</>
	);
}

import { useTranslation } from "react-i18next";
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
import { formatTeacherName, type Teacher } from "../hooks/use-teachers";
import type { UeCourseFormController } from "../hooks/use-ue-course-form";

/** Fields of the teaching unit course (EC) form. */
export function UeCourseFormFields({
	controller: { form, teacherOptions },
}: {
	controller: UeCourseFormController;
}) {
	const { t } = useTranslation();
	return (
		<>
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
								{teacherOptions.map((teacher: Teacher) => (
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
								value={field.value as number}
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
		</>
	);
}

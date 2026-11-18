import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QuickCreate } from "@/components/callable/quick-create";
import { DatePicker } from "@/components/ui/date-picker";
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
import type { ExamFormData } from "../hooks/use-exam-form";

interface ExamFormFieldsProps {
	form: UseFormReturn<ExamFormData>;
	classCourseOptions: { id: string; label: string }[];
	onCreateClassCourse: () => Promise<void>;
}

/** Fields of the exam form: class-course, name, type, date, weight. */
export function ExamFormFields({
	form,
	classCourseOptions,
	onCreateClassCourse,
}: ExamFormFieldsProps) {
	const { t } = useTranslation();
	return (
		<>
			<FormField
				control={form.control}
				name="classCourseId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t("admin.exams.form.courseLabel")}</FormLabel>
						<QuickCreate
							onCreate={onCreateClassCourse}
							label={t("admin.classCourses.form.createTitle")}
						>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger
										id="classCourseId"
										data-testid="class-course-select"
									>
										<SelectValue
											placeholder={t("admin.exams.form.coursePlaceholder")}
										/>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{classCourseOptions.map((option) => (
										<SelectItem key={option.id} value={option.id}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</QuickCreate>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t("admin.exams.form.nameLabel")}</FormLabel>
						<FormControl>
							<Input
								{...field}
								placeholder={t("admin.exams.form.namePlaceholder")}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="type"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t("admin.exams.form.typeLabel")}</FormLabel>
						<FormControl>
							<Input
								{...field}
								id="examType"
								data-testid="exam-type-select"
								placeholder={t("admin.exams.form.typePlaceholder")}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="date"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t("admin.exams.form.dateLabel")}</FormLabel>
						<FormControl>
							<DatePicker value={field.value ?? ""} onChange={field.onChange} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="percentage"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t("admin.exams.form.percentageLabel")}</FormLabel>
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
								placeholder={t("admin.exams.form.percentagePlaceholder")}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
}

import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { CodedEntitySelect } from "@/components/forms";
import { DatePicker } from "@/components/ui/date-picker";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatPercent } from "@/lib/number-format";
import { cn } from "@/lib/utils";
import type {
	ClassCoursePicker,
	ClassCoursePickerOption,
	ExamFormData,
} from "../hooks/use-exam-form";

interface ExamFormFieldsProps {
	form: UseFormReturn<ExamFormData>;
	classCoursePicker: ClassCoursePicker;
	onCreateClassCourse: () => Promise<ClassCoursePickerOption | null>;
	/** Course total with this exam's weight, or null before a course is chosen. */
	weightTotal: number | null;
}

/** Fields of the exam form: class-course, name, type, date, weight. */
export function ExamFormFields({
	form,
	classCoursePicker,
	onCreateClassCourse,
	weightTotal,
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
						<CodedEntitySelect
							id="classCourseId"
							items={classCoursePicker.options}
							isLoading={classCoursePicker.isLoading}
							onSearch={classCoursePicker.onSearch}
							searchMode="server"
							minSearchLength={0}
							value={
								classCoursePicker.options.find((o) => o.id === field.value)
									?.code ?? null
							}
							onChange={(code) =>
								classCoursePicker.select(
									classCoursePicker.options.find((o) => o.code === code) ??
										null,
								)
							}
							placeholder={t("admin.exams.form.coursePlaceholder")}
							searchPlaceholder={t("admin.exams.form.courseSearchPlaceholder")}
							emptyMessage={t("admin.exams.form.courseEmpty")}
							onCreate={onCreateClassCourse}
							createLabel={t("admin.classCourses.form.createTitle")}
						/>
						{classCoursePicker.truncated && (
							<p className="text-muted-foreground text-xs">
								{t("admin.exams.form.courseTruncated")}
							</p>
						)}
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
						{weightTotal !== null && (
							<p
								className={cn(
									"text-xs",
									Math.abs(weightTotal - 100) > 0.01
										? "text-amber-600 dark:text-amber-400"
										: "text-muted-foreground",
								)}
							>
								{Math.abs(weightTotal - 100) > 0.01
									? t("admin.exams.weights.formOff", {
											total: formatPercent(weightTotal / 100, 0),
										})
									: t("admin.exams.weights.formOk")}
							</p>
						)}
					</FormItem>
				)}
			/>
		</>
	);
}

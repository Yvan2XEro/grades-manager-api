import { format } from "date-fns";
import { Download, FileSpreadsheet } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTeacherGradeExport } from "../hooks/use-teacher-grade-export";
import { exportTeacherTranscript } from "../services/teacher-transcript-excel";

export default function TeacherGradeExport() {
	const [selectedYear, setSelectedYear] = useState("");
	const [selectedClass, setSelectedClass] = useState("");
	const [selectedExams, setSelectedExams] = useState<string[]>([]);
	const classId = useId();
	const { t } = useTranslation();
	const { classes, exams } = useTeacherGradeExport(selectedYear, selectedClass);

	const handleExport = async () => {
		if (!selectedClass || selectedExams.length === 0) return;
		try {
			await exportTeacherTranscript({
				classId: selectedClass,
				className:
					classes?.find((c) => c.id === selectedClass)?.name ??
					t("teacher.gradeExport.unknownClass"),
				exams: exams ?? [],
				selectedExams,
				t,
			});
		} catch (error) {
			console.error("Export error:", error);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-foreground">{t("teacher.gradeExport.title")}</h2>
				<p className="text-muted-foreground">
					{t("teacher.gradeExport.subtitle")}
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<div className="space-y-2">
					<Label className="font-medium text-sm">
						{t("teacher.gradeExport.filters.academicYear")}
					</Label>
					<AcademicYearSelect
						value={selectedYear || null}
						onChange={(value) => {
							setSelectedYear(value);
							setSelectedClass("");
							setSelectedExams([]);
						}}
						placeholder={t(
							"teacher.gradeExport.filters.academicYearPlaceholder",
						)}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor={classId} className="font-medium text-sm">
						{t("teacher.gradeExport.filters.class")}
					</Label>
					<Select
						value={selectedClass}
						onValueChange={(value) => {
							setSelectedClass(value);
							setSelectedExams([]);
						}}
						disabled={!selectedYear}
					>
						<SelectTrigger
							id={classId}
							aria-label={t("teacher.gradeExport.filters.class")}
							className={!selectedYear ? "opacity-70" : undefined}
						>
							<SelectValue
								placeholder={t("teacher.gradeExport.filters.classPlaceholder")}
							/>
						</SelectTrigger>
						<SelectContent>
							{classes?.map((cls) => (
								<SelectItem key={cls.id} value={cls.id}>
									{cls.name} - {cls.program.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label className="font-medium text-sm">
						{t("teacher.gradeExport.actions.label")}
					</Label>
					<Button
						type="button"
						onClick={handleExport}
						disabled={!selectedClass || selectedExams.length === 0}
					>
						<Download className="mr-2 h-5 w-5" />
						{t("teacher.gradeExport.actions.export")}
					</Button>
				</div>
			</div>

			{exams && exams.length > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle className="font-semibold text-lg">
							{t("teacher.gradeExport.exams.title")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{exams.map((exam) => {
								const checkboxId = `${exam.id}-checkbox`;
								const isChecked = selectedExams.includes(exam.id);
								return (
									<div
										key={exam.id}
										className="flex items-start gap-3 rounded-md border p-3"
									>
										<Checkbox
											id={checkboxId}
											checked={isChecked}
											onCheckedChange={(checked) => {
												if (checked) {
													setSelectedExams([...selectedExams, exam.id]);
												} else {
													setSelectedExams(
														selectedExams.filter((id) => id !== exam.id),
													);
												}
											}}
										/>
										<label htmlFor={checkboxId} className="flex-1 space-y-1">
											<div className="font-medium">
												{exam.courseName} - {exam.name}
											</div>
											<div className="text-muted-foreground text-xs">
												{format(new Date(exam.date), "MMM d, yyyy")} (
												{exam.percentage}%)
											</div>
										</label>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			) : selectedClass ? (
				<Card className="text-center">
					<CardHeader>
						<FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
						<CardTitle className="font-semibold text-sm">
							{t("teacher.gradeExport.exams.emptyTitle")}
						</CardTitle>
						<CardDescription>
							{t("teacher.gradeExport.exams.emptyDescription")}
						</CardDescription>
					</CardHeader>
				</Card>
			) : null}
		</div>
	);
}

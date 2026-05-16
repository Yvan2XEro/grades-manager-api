import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, FileSpreadsheet } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { AcademicYearSelect } from "../../components/inputs/AcademicYearSelect";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { trpcClient } from "../../utils/trpc";

interface Class {
	id: string;
	name: string;
	program: { name: string };
}

interface ExamItem {
	id: string;
	name: string;
	date: string;
	percentage: number;
	courseName: string;
}

interface StudentExport {
	id: string;
	first_name: string;
	last_name: string;
	registration_number: string;
	birth_date: string | null;
	birth_place: string | null;
	gender: string | null;
	grades: {
		score: number;
		exam: {
			id: string;
			percentage: number;
			class_course: { course: { name: string } };
		};
	}[];
}

interface StudentItem {
	id: string;
	registrationNumber: string;
	profile: {
		firstName: string;
		lastName: string;
		dateOfBirth: string | null;
		placeOfBirth: string | null;
		gender: string | null;
	};
}

export default function GradeExport() {
	const [selectedYear, setSelectedYear] = useState("");
	const [selectedClass, setSelectedClass] = useState("");
	const [selectedExams, setSelectedExams] = useState<string[]>([]);
	const classId = useId();
	const { t } = useTranslation();

	const { data: classCourses } = useQuery({
		queryKey: ["teacher-export-class-courses", selectedYear],
		queryFn: async () => {
			if (!selectedYear) return [];
			const result = await trpcClient.classCourses.list.query({
				academicYearId: selectedYear,
				limit: 500,
			});
			return result.items;
		},
		enabled: !!selectedYear,
	});

	const classes = (classCourses ?? []).reduce<Class[]>((acc, classCourse) => {
		if (acc.some((item) => item.id === classCourse.class)) {
			return acc;
		}
		acc.push({
			id: classCourse.class,
			name: classCourse.className ?? classCourse.class,
			program: {
				name: classCourse.programName ?? "",
			},
		});
		return acc;
	}, []);

	const { data: exams } = useQuery({
		queryKey: ["teacher-export-exams", selectedClass],
		queryFn: async () => {
			if (!selectedClass) return [];
			const { items } = await trpcClient.exams.list.query({
				classId: selectedClass,
				limit: 500,
			});
			return items
				.map((exam) => ({
					id: exam.id,
					name: exam.name,
					date: exam.date,
					percentage: Number(exam.percentage),
					courseName: exam.courseName,
				}))
				.sort((a, b) => a.courseName.localeCompare(b.courseName));
		},
		enabled: !!selectedClass,
	});

	const handleExport = async () => {
		if (!selectedClass || selectedExams.length === 0) return;
		try {
			const [studentsResult, gradesResult] = await Promise.all([
				trpcClient.students.list.query({
					classId: selectedClass,
					limit: 5000,
				}),
				trpcClient.grades.listByClass.query({
					classId: selectedClass,
					limit: 10000,
				}),
			]);

			const examMetaById = new Map(
				(exams ?? []).map((exam) => [
					exam.id,
					{
						id: exam.id,
						percentage: exam.percentage,
						class_course: {
							course: { name: exam.courseName },
						},
					},
				]),
			);

			const gradesByStudent = new Map<string, StudentExport["grades"]>();
			for (const grade of gradesResult.items) {
				if (!selectedExams.includes(grade.exam)) continue;
				const examMeta = examMetaById.get(grade.exam);
				if (!examMeta) continue;
				const bucket = gradesByStudent.get(grade.student) ?? [];
				bucket.push({
					score: Number(grade.score),
					exam: examMeta,
				});
				gradesByStudent.set(grade.student, bucket);
			}

			const students: StudentExport[] = studentsResult.items.map(
				(s: StudentItem) =>
					({
						id: s.id,
						first_name: s.profile.firstName,
						last_name: s.profile.lastName,
						registration_number: s.registrationNumber,
						birth_date: s.profile.dateOfBirth ?? null,
						birth_place: s.profile.placeOfBirth ?? null,
						gender: s.profile.gender ?? null,
						grades: gradesByStudent.get(s.id) ?? [],
					}) as StudentExport,
			);

			// Sort students alphabetically
			const sortedStudents = students.sort(
				(a, b) =>
					a.last_name.localeCompare(b.last_name) ||
					a.first_name.localeCompare(b.first_name),
			);

			const exportData = sortedStudents.map((student) => {
				const courseGrades = new Map<string, number[]>();
				student.grades.forEach((grade) => {
					const courseName = grade.exam.class_course.course.name;
					if (!courseGrades.has(courseName)) {
						courseGrades.set(courseName, []);
					}
					if (selectedExams.includes(grade.exam.id)) {
						courseGrades.get(courseName)?.push(grade.score);
					}
				});
				const courseAverages = new Map<string, number>();
				courseGrades.forEach((grades, course) => {
					if (grades.length > 0) {
						const average = grades.reduce((a, b) => a + b, 0) / grades.length;
						courseAverages.set(course, Number(average.toFixed(2)));
					}
				});
				return {
					[t("teacher.gradeExport.columns.lastName")]: student.last_name,
					[t("teacher.gradeExport.columns.firstName")]: student.first_name,
					[t("teacher.gradeExport.columns.registration")]:
						student.registration_number,
					[t("teacher.gradeExport.columns.birthDate")]: student.birth_date
						? format(new Date(student.birth_date), "dd/MM/yyyy")
						: "",
					[t("teacher.gradeExport.columns.birthPlace")]:
						student.birth_place || "",
					[t("teacher.gradeExport.columns.gender")]: student.gender || "",
					...Object.fromEntries(courseAverages),
				};
			});

			const ws = XLSX.utils.json_to_sheet(exportData);
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, t("teacher.gradeExport.sheetName"));
			const className =
				classes?.find((c) => c.id === selectedClass)?.name ??
				t("teacher.gradeExport.unknownClass");
			const filename = `${t("teacher.gradeExport.filePrefix")}_${className}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
			XLSX.writeFile(wb, filename);
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

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, FileSpreadsheet } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpcClient } from "../../utils/trpc";

interface AcademicYear {
	id: string;
	name: string;
	startDate: string;
}

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
	firstName: string;
	lastName: string;
	registrationNumber: string;
	birthDate: string | null;
	birthPlace: string | null;
	gender: string | null;
}

interface GradeItem {
	exam: string;
	score: string | number;
}

export default function GradeExport() {
	const [selectedYear, setSelectedYear] = useState("");
	const [selectedClass, setSelectedClass] = useState("");
	const [selectedExams, setSelectedExams] = useState<string[]>([]);
	const yearId = useId();
	const classId = useId();
	const { t } = useTranslation();

	const { data: academicYears } = useQuery({
		queryKey: ["academicYears"],
		queryFn: async () => {
			const { items } = await trpcClient.academicYears.list.query({});
			return (items as AcademicYear[]).sort(
				(a, b) =>
					new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
			);
		},
	});

	const { data: classes } = useQuery({
		queryKey: ["classes", selectedYear],
		queryFn: async () => {
			if (!selectedYear) return [];
			const [classRes, programRes] = await Promise.all([
				trpcClient.classes.list.query({ academicYearId: selectedYear }),
				trpcClient.programs.list.query({}),
			]);
			const programMap = new Map(
				programRes.items.map((p: { id: string; name: string }) => [
					p.id,
					p.name,
				]),
			);
			return classRes.items.map(
				(cls: { id: string; name: string; program: string }) => ({
					id: cls.id,
					name: cls.name,
					program: { name: programMap.get(cls.program) ?? "" },
				}),
			) as Class[];
		},
		enabled: !!selectedYear,
	});

	const { data: exams } = useQuery({
		queryKey: ["exams", selectedClass],
		queryFn: async () => {
			if (!selectedClass) return [];
			const { items: classCourses } = await trpcClient.classCourses.list.query({
				classId: selectedClass,
			});
			const result: ExamItem[] = [];
			for (const cc of classCourses) {
				const course = await trpcClient.courses.getById.query({
					id: cc.course,
				});
				const { items: examItems } = await trpcClient.exams.list.query({
					classCourseId: cc.id,
				});
				examItems.forEach(
					(exam: {
						id: string;
						name: string;
						date: string;
						percentage: string;
					}) => {
						result.push({
							id: exam.id,
							name: exam.name,
							date: exam.date,
							percentage: Number(exam.percentage),
							courseName: course.name,
						});
					},
				);
			}
			return result.sort((a, b) => a.courseName.localeCompare(b.courseName));
		},
		enabled: !!selectedClass,
	});

	const handleExport = async () => {
		if (!selectedClass || selectedExams.length === 0) return;
		try {
			const { items: studentItems } = await trpcClient.students.list.query({
				classId: selectedClass,
			});
			const students: StudentExport[] = await Promise.all(
				studentItems.map(async (s: StudentItem) => {
					const { items: gradeItems } =
						await trpcClient.grades.listByStudent.query({
							studentId: s.id,
						});
					const grades = await Promise.all(
						gradeItems.map(async (g: GradeItem) => {
							const exam = await trpcClient.exams.getById.query({ id: g.exam });
							const classCourse = await trpcClient.classCourses.getById.query({
								id: exam.classCourse,
							});
							const course = await trpcClient.courses.getById.query({
								id: classCourse.course,
							});
							return {
								score: Number(g.score),
								exam: {
									id: exam.id,
									percentage: Number(exam.percentage),
									class_course: { course: { name: course.name } },
								},
							};
						}),
					);
					return {
						id: s.id,
						first_name: s.firstName,
						last_name: s.lastName,
						registration_number: s.registrationNumber,
						birth_date: s.birthDate ?? null,
						birth_place: s.birthPlace ?? null,
						gender: s.gender ?? null,
						grades,
					} as StudentExport;
				}),
			);

			const exportData = students.map((student) => {
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
					[t("admin.gradeExport.columns.lastName")]: student.last_name,
					[t("admin.gradeExport.columns.firstName")]: student.first_name,
					[t("admin.gradeExport.columns.registration")]:
						student.registration_number,
					[t("admin.gradeExport.columns.birthDate")]: student.birth_date
						? format(new Date(student.birth_date), "dd/MM/yyyy")
						: "",
					[t("admin.gradeExport.columns.birthPlace")]:
						student.birth_place || "",
					[t("admin.gradeExport.columns.gender")]: student.gender || "",
					...Object.fromEntries(courseAverages),
				};
			});

			const ws = XLSX.utils.json_to_sheet(exportData);
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, t("admin.gradeExport.sheetName"));
			const className =
				classes?.find((c) => c.id === selectedClass)?.name ??
				t("admin.gradeExport.unknownClass");
			const filename = `${t("admin.gradeExport.filePrefix")}_${className}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
			XLSX.writeFile(wb, filename);
		} catch (error) {
			console.error("Export error:", error);
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div className="space-y-2">
				<h2 className="font-bold text-2xl">{t("admin.gradeExport.title")}</h2>
				<p className="text-muted-foreground">
					{t("admin.gradeExport.subtitle")}
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("admin.gradeExport.actions.label")}</CardTitle>
					<CardDescription>
						{t("admin.gradeExport.subtitle")}
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					<div className="space-y-2">
						<Label htmlFor={yearId}>
							{t("admin.gradeExport.filters.academicYear")}
						</Label>
						<Select
							value={selectedYear || undefined}
							onValueChange={(value) => {
								setSelectedYear(value);
								setSelectedClass("");
								setSelectedExams([]);
							}}
						>
							<SelectTrigger id={yearId}>
								<SelectValue
									placeholder={t(
										"admin.gradeExport.filters.academicYearPlaceholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								{academicYears?.map((year) => (
									<SelectItem key={year.id} value={year.id}>
										{year.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor={classId}>
							{t("admin.gradeExport.filters.class")}
						</Label>
						<Select
							disabled={!selectedYear}
							value={selectedClass || undefined}
							onValueChange={(value) => {
								setSelectedClass(value);
								setSelectedExams([]);
							}}
						>
							<SelectTrigger id={classId}>
								<SelectValue
									placeholder={t(
										"admin.gradeExport.filters.classPlaceholder",
									)}
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
						<Label>{t("admin.gradeExport.actions.label")}</Label>
						<Button
							type="button"
							onClick={handleExport}
							disabled={!selectedClass || selectedExams.length === 0}
							className="w-full"
						>
							<Download className="mr-2 h-4 w-4" />
							{t("admin.gradeExport.actions.export")}
						</Button>
					</div>
				</CardContent>
			</Card>

			{exams && exams.length > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>{t("admin.gradeExport.exams.title")}</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{exams.map((exam) => (
							<div
								key={exam.id}
								className="flex items-start gap-3 rounded-lg border px-3 py-2"
							>
								<Checkbox
									id={`exam-${exam.id}`}
									checked={selectedExams.includes(exam.id)}
									onCheckedChange={(checked) => {
										if (checked) {
											setSelectedExams((prev) => [...prev, exam.id]);
										} else {
											setSelectedExams((prev) =>
												prev.filter((id) => id !== exam.id),
											);
										}
									}}
								/>
								<label
									htmlFor={`exam-${exam.id}`}
									className="flex flex-col text-sm font-medium leading-5"
								>
									<span className="text-foreground">
										{exam.courseName} • {exam.name}
									</span>
									<span className="text-muted-foreground text-xs">
										{format(new Date(exam.date), "MMM d, yyyy")} (
										{exam.percentage}%)
									</span>
								</label>
							</div>
						))}
					</CardContent>
				</Card>
			) : selectedClass ? (
				<Card className="items-center text-center">
					<CardContent className="flex flex-col items-center gap-2 py-10">
						<FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
						<h3 className="font-medium text-sm">
							{t("admin.gradeExport.exams.emptyTitle")}
						</h3>
						<p className="text-muted-foreground text-sm">
							{t("admin.gradeExport.exams.emptyDescription")}
						</p>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}

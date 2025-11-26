import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, FileSpreadsheet } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { RouterOutputs } from "../../utils/trpc";
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
	type: string;
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
			name: string;
			type: string;
			percentage: number;
			class_course: { course: { id: string; name: string } };
		};
	}[];
}

type StudentListItem = RouterOutputs["students"]["list"]["items"][number];
type ExamDetails = RouterOutputs["exams"]["getById"];
type ClassCourseDetails = RouterOutputs["classCourses"]["getById"];
type CourseDetails = RouterOutputs["courses"]["getById"];

const slugify = (value: string) =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-zA-Z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase();

interface GradeItem {
	exam: string;
	score: string | number;
}

export default function GradeExport() {
	const [selectedYear, setSelectedYear] = useState("");
	const [selectedClass, setSelectedClass] = useState("");
	const [selectedExams, setSelectedExams] = useState<string[]>([]);
	const [exporting, setExporting] = useState<string | null>(null);
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
						type: string;
						date: string;
						percentage: string;
					}) => {
						result.push({
							id: exam.id,
							name: exam.name,
							type: exam.type,
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

	const selectedExamDetails = useMemo(
		() => exams?.filter((exam) => selectedExams.includes(exam.id)) ?? [],
		[exams, selectedExams],
	);
	const hasExamSelection = selectedExamDetails.length > 0;
	const isBusy = exporting !== null;
	const disablePrimaryExports = !selectedClass || !hasExamSelection || isBusy;
	const disableExamExports = !selectedClass || isBusy;

	const fetchStudentsWithGrades = useCallback(async (): Promise<
		StudentExport[]
	> => {
		if (!selectedClass) return [];
		const { items: studentItems } = await trpcClient.students.list.query({
			classId: selectedClass,
			limit: 1000,
		});
		const typedStudents = studentItems as StudentListItem[];
		const examCache = new Map<string, ExamDetails>();
		const classCourseCache = new Map<string, ClassCourseDetails>();
		const courseCache = new Map<string, CourseDetails>();

		return Promise.all(
			typedStudents.map(async (student) => {
				const profile = student.profile;
				const { items: gradeItems } =
					await trpcClient.grades.listByStudent.query({
						studentId: student.id,
					});
				const grades = await Promise.all(
					gradeItems.map(async (grade: GradeItem) => {
						let exam = examCache.get(grade.exam);
						if (!exam) {
							exam = await trpcClient.exams.getById.query({ id: grade.exam });
							examCache.set(grade.exam, exam);
						}
						let classCourse = classCourseCache.get(exam.classCourse);
						if (!classCourse) {
							classCourse = await trpcClient.classCourses.getById.query({
								id: exam.classCourse,
							});
							classCourseCache.set(exam.classCourse, classCourse);
						}
						let course = courseCache.get(classCourse.course);
						if (!course) {
							course = await trpcClient.courses.getById.query({
								id: classCourse.course,
							});
							courseCache.set(classCourse.course, course);
						}
						return {
							score: Number(grade.score),
							exam: {
								id: exam.id,
								name: exam.name,
								type: exam.type,
								percentage: Number(exam.percentage),
								class_course: {
									course: { id: classCourse.course, name: course.name },
								},
							},
						};
					}),
				);
				return {
					id: student.id,
					first_name: profile.firstName,
					last_name: profile.lastName,
					registration_number: student.registrationNumber,
					birth_date: profile.dateOfBirth ?? null,
					birth_place: profile.placeOfBirth ?? null,
					gender: profile.gender ?? null,
					grades,
				} as StudentExport;
			}),
		);
	}, [selectedClass]);

	const buildFilename = useCallback(
		(prefix: string, suffix?: string) => {
			const className =
				classes?.find((cls) => cls.id === selectedClass)?.name ??
				t("admin.gradeExport.unknownClass");
			const normalizedSuffix = suffix ? `_${suffix}` : "";
			return `${prefix}_${className}${normalizedSuffix}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
		},
		[classes, selectedClass, t],
	);

	const handleCombinedExport = useCallback(async () => {
		if (!selectedClass || !hasExamSelection) return;
		setExporting("combined");
		try {
			const students = await fetchStudentsWithGrades();
			if (students.length === 0) return;

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
			const filename = buildFilename(t("admin.gradeExport.filePrefix"));
			XLSX.writeFile(wb, filename);
		} catch (error) {
			console.error("Export error:", error);
		} finally {
			setExporting(null);
		}
	}, [
		buildFilename,
		fetchStudentsWithGrades,
		hasExamSelection,
		selectedClass,
		selectedExams,
		t,
	]);

	const handleVerbalReportExport = useCallback(async () => {
		if (!selectedClass || !hasExamSelection) return;
		setExporting("pv");
		try {
			const students = await fetchStudentsWithGrades();
			if (students.length === 0) return;

			const courseGroups = new Map<string, ExamItem[]>();
			selectedExamDetails.forEach((exam) => {
				const list = courseGroups.get(exam.courseName) ?? [];
				list.push(exam);
				courseGroups.set(exam.courseName, list);
			});
			const groupedCourses = Array.from(courseGroups.entries()).map(
				([courseName, groupedExams]) => ({
					courseName,
					exams: groupedExams,
				}),
			);
			const orderedExams = groupedCourses.flatMap(({ exams }) => exams);
			const firstHeaderRow = [
				t("admin.gradeExport.pv.table.rank"),
				t("admin.gradeExport.columns.registration"),
				t("admin.gradeExport.pv.table.fullName"),
				...groupedCourses.flatMap(({ courseName, exams }) => [
					courseName,
					...Array.from({ length: Math.max(exams.length - 1, 0) }, () => ""),
				]),
				t("admin.gradeExport.pv.table.average"),
			];
			const secondHeaderRow = [
				"",
				"",
				"",
				...orderedExams.map((exam) => exam.type),
				"",
			];

			const tableRows: (string | number)[][] = [];
			const averages: number[] = [];

			students.forEach((student, index) => {
				const gradeValues = orderedExams.map((exam) => {
					const grade = student.grades.find((g) => g.exam.id === exam.id);
					return typeof grade?.score === "number" ? grade.score : "";
				});
				const numericScores = gradeValues.filter(
					(value): value is number => typeof value === "number",
				);
				const averageValue =
					numericScores.length > 0
						? Number(
								(
									numericScores.reduce((sum, value) => sum + value, 0) /
									numericScores.length
								).toFixed(2),
							)
						: "";
				if (typeof averageValue === "number") {
					averages.push(averageValue);
				}
				tableRows.push([
					index + 1,
					student.registration_number,
					`${student.last_name} ${student.first_name}`,
					...gradeValues,
					averageValue,
				]);
			});

			const totalStudents = students.length;
			const validated = averages.filter((avg) => avg >= 10).length;
			const nonValidated = totalStudents - validated;
			const successRate =
				totalStudents > 0 ? (validated / totalStudents) * 100 : 0;
			const promotionAverage =
				averages.length > 0
					? averages.reduce((sum, avg) => sum + avg, 0) / averages.length
					: null;

			const statsRows: (string | number)[][] = [
				[t("admin.gradeExport.pv.stats.title")],
				[t("admin.gradeExport.pv.stats.students"), totalStudents],
				[t("admin.gradeExport.pv.stats.validated"), validated],
				[t("admin.gradeExport.pv.stats.notValidated"), nonValidated],
				[
					t("admin.gradeExport.pv.stats.successRate"),
					`${successRate.toFixed(1)}%`,
				],
				[
					t("admin.gradeExport.pv.stats.average"),
					promotionAverage !== null ? promotionAverage.toFixed(2) : "-",
				],
			];

			const legendHeaders = [
				t("admin.gradeExport.pv.legend.headers.course"),
				t("admin.gradeExport.pv.legend.headers.exam"),
				t("admin.gradeExport.pv.legend.headers.weight"),
			];
			const legendRows = orderedExams.map((exam) => [
				exam.courseName,
				exam.type,
				`${exam.percentage}%`,
			]);

			const aoa: (string | number)[][] = [
				...statsRows,
				[""],
				[t("admin.gradeExport.pv.table.title")],
				firstHeaderRow,
				secondHeaderRow,
				...tableRows,
				[""],
				[t("admin.gradeExport.pv.legend.title")],
				legendHeaders,
				...legendRows,
			];

			const ws = XLSX.utils.aoa_to_sheet(aoa);
			const headerRow1Index = statsRows.length + 2;
			const headerRow2Index = headerRow1Index + 1;
			const merges: XLSX.Range[] = [];
			const verticalColumns = [0, 1, 2, 3 + orderedExams.length];
			verticalColumns.forEach((columnIndex) => {
				merges.push({
					s: { r: headerRow1Index, c: columnIndex },
					e: { r: headerRow2Index, c: columnIndex },
				});
			});
			let courseColumnStart = 3;
			groupedCourses.forEach(({ exams }) => {
				const courseColumnEnd = courseColumnStart + exams.length - 1;
				merges.push({
					s: { r: headerRow1Index, c: courseColumnStart },
					e: { r: headerRow1Index, c: courseColumnEnd },
				});
				courseColumnStart = courseColumnEnd + 1;
			});
			ws["!merges"] = merges;
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, t("admin.gradeExport.pv.sheetName"));
			const filename = buildFilename(t("admin.gradeExport.pv.filePrefix"));
			XLSX.writeFile(wb, filename);
		} catch (error) {
			console.error("Verbal report export error:", error);
		} finally {
			setExporting(null);
		}
	}, [
		buildFilename,
		fetchStudentsWithGrades,
		hasExamSelection,
		selectedClass,
		selectedExamDetails,
		t,
	]);

	const handleExamExport = useCallback(
		async (exam: ExamItem) => {
			if (!selectedClass) return;
			setExporting(exam.id);
			try {
				const students = await fetchStudentsWithGrades();
				if (students.length === 0) return;

				const exportData = students.map((student) => {
					const grade = student.grades.find((g) => g.exam.id === exam.id);
					return {
						[t("admin.gradeExport.columns.lastName")]: student.last_name,
						[t("admin.gradeExport.columns.firstName")]: student.first_name,
						[t("admin.gradeExport.columns.registration")]:
							student.registration_number,
						[t("admin.gradeExport.actions.examGroup.scoreColumn")]:
							typeof grade?.score === "number" ? grade.score : "",
					};
				});

				const ws = XLSX.utils.json_to_sheet(exportData);
				const wb = XLSX.utils.book_new();
				XLSX.utils.book_append_sheet(
					wb,
					ws,
					t("admin.gradeExport.actions.examGroup.sheetName"),
				);
				const examSuffix = `${slugify(exam.courseName)}-${slugify(exam.type)}`;
				const filename = buildFilename(
					t("admin.gradeExport.actions.examGroup.filePrefix"),
					examSuffix,
				);
				XLSX.writeFile(wb, filename);
			} catch (error) {
				console.error("Exam export error:", error);
			} finally {
				setExporting(null);
			}
		},
		[buildFilename, fetchStudentsWithGrades, selectedClass, t],
	);

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
					<CardTitle>{t("admin.gradeExport.filtersCard.title")}</CardTitle>
					<CardDescription>
						{t("admin.gradeExport.filtersCard.description")}
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
									placeholder={t("admin.gradeExport.filters.classPlaceholder")}
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
									className="flex flex-col font-medium text-sm leading-5"
								>
									<span className="text-foreground">
										{exam.courseName} • {exam.type}
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

			<Card>
				<CardHeader>
					<CardTitle>{t("admin.gradeExport.actions.label")}</CardTitle>
					<CardDescription>{t("admin.gradeExport.subtitle")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						<div className="space-y-2">
							<Label>{t("admin.gradeExport.actions.combinedLabel")}</Label>
							<Button
								type="button"
								onClick={handleCombinedExport}
								disabled={disablePrimaryExports}
								className="w-full"
							>
								<Download className="mr-2 h-4 w-4" />
								{t("admin.gradeExport.actions.combinedExport")}
							</Button>
						</div>
						<div className="space-y-2">
							<Label>{t("admin.gradeExport.actions.pvLabel")}</Label>
							<Button
								type="button"
								onClick={handleVerbalReportExport}
								disabled={disablePrimaryExports}
								className="w-full"
							>
								<FileSpreadsheet className="mr-2 h-4 w-4" />
								{t("admin.gradeExport.actions.pvExport")}
							</Button>
						</div>
					</div>

					{hasExamSelection ? (
						<div className="space-y-2">
							<Label>
								{t("admin.gradeExport.actions.examGroup.label", {
									count: selectedExamDetails.length,
								})}
							</Label>
							<div className="flex flex-wrap gap-2">
								{selectedExamDetails.map((exam) => (
									<Button
										key={exam.id}
										type="button"
										variant="outline"
										disabled={disableExamExports}
										onClick={() => handleExamExport(exam)}
									>
										{exam.courseName} • {exam.type}
									</Button>
								))}
							</div>
						</div>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}

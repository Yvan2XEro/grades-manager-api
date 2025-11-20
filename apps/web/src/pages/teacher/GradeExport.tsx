import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, FileSpreadsheet } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
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
		<div className="space-y-6 p-6">
			<div>
				<h2 className="font-bold text-2xl">{t("teacher.gradeExport.title")}</h2>
				<p className="text-gray-600">{t("teacher.gradeExport.subtitle")}</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<div className="form-control">
					<label className="label" htmlFor={yearId}>
						<span className="label-text">
							{t("teacher.gradeExport.filters.academicYear")}
						</span>
					</label>
					<select
						id={yearId}
						className="select select-bordered"
						value={selectedYear}
						onChange={(e) => {
							setSelectedYear(e.target.value);
							setSelectedClass("");
							setSelectedExams([]);
						}}
					>
						<option value="">
							{t("teacher.gradeExport.filters.academicYearPlaceholder")}
						</option>
						{academicYears?.map((year) => (
							<option key={year.id} value={year.id}>
								{year.name}
							</option>
						))}
					</select>
				</div>

				<div className="form-control">
					<label className="label" htmlFor={classId}>
						<span className="label-text">
							{t("teacher.gradeExport.filters.class")}
						</span>
					</label>
					<select
						id={classId}
						className="select select-bordered"
						value={selectedClass}
						onChange={(e) => {
							setSelectedClass(e.target.value);
							setSelectedExams([]);
						}}
						disabled={!selectedYear}
					>
						<option value="">
							{t("teacher.gradeExport.filters.classPlaceholder")}
						</option>
						{classes?.map((cls) => (
							<option key={cls.id} value={cls.id}>
								{cls.name} - {cls.program.name}
							</option>
						))}
					</select>
				</div>

				<div className="form-control">
					<span className="label-text mb-2">
						{t("teacher.gradeExport.actions.label")}
					</span>
					<button
						type="button"
						onClick={handleExport}
						disabled={!selectedClass || selectedExams.length === 0}
						className="btn btn-primary"
					>
						<Download className="mr-2 h-5 w-5" />
						{t("teacher.gradeExport.actions.export")}
					</button>
				</div>
			</div>

			{exams && exams.length > 0 ? (
				<div className="rounded-lg bg-white p-6 shadow">
					<h3 className="mb-4 font-medium text-lg">
						{t("teacher.gradeExport.exams.title")}
					</h3>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{exams.map((exam) => (
							<label key={exam.id} className="flex items-center space-x-3">
								<input
									type="checkbox"
									className="checkbox"
									checked={selectedExams.includes(exam.id)}
									onChange={(e) => {
										if (e.target.checked) {
											setSelectedExams([...selectedExams, exam.id]);
										} else {
											setSelectedExams(
												selectedExams.filter((id) => id !== exam.id),
											);
										}
									}}
								/>
								<span>
									{exam.courseName} - {exam.name}
									<div className="text-gray-500 text-sm">
										{format(new Date(exam.date), "MMM d, yyyy")} (
										{exam.percentage}%)
									</div>
								</span>
							</label>
						))}
					</div>
				</div>
			) : selectedClass ? (
				<div className="rounded-lg bg-white p-8 text-center">
					<FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
					<h3 className="mt-2 font-medium text-gray-900 text-sm">
						{t("teacher.gradeExport.exams.emptyTitle")}
					</h3>
					<p className="mt-1 text-gray-500 text-sm">
						{t("teacher.gradeExport.exams.emptyDescription")}
					</p>
				</div>
			) : null}
		</div>
	);
}

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	ChevronDown,
	Download,
	Eye,
	FileSpreadsheet,
	FileText,
	Loader2,
	Search,
} from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
	courseCode?: string | null;
	classCourseCode?: string | null;
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
			class_course: {
				id: string;
				code: string | null;
				course: { id: string; name: string; code: string | null };
			};
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
	const [selectedSemester, setSelectedSemester] = useState("");
	const [selectedExams, setSelectedExams] = useState<string[]>([]);
	const [selectedUEs, setSelectedUEs] = useState<string[]>([]);
	const [exporting, setExporting] = useState<string | null>(null);
	const [showPreview, setShowPreview] = useState(false);
	const [previewHtml, setPreviewHtml] = useState("");
	const [previewTitle, setPreviewTitle] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<"course" | "date" | "type">("course");
	const yearId = useId();
	const classId = useId();
	const semesterId = useId();
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
				(cls: { id: string; name: string; program: string }) => {
					const program = programMap.get(cls.program);
					return {
						id: cls.id,
						name: cls.name,
						program: { id: cls.program, name: program?.name ?? "" },
					};
				},
			) as Class[];
		},
		enabled: !!selectedYear,
	});

	const { data: semesters = [] } = useQuery({
		queryKey: ["semesters"],
		queryFn: async () => {
			try {
				const result = await trpcClient.semesters.list.query({});
				return (result?.items || []) as { id: string; name: string }[];
			} catch (error) {
				console.error("Error fetching semesters:", error);
				return [];
			}
		},
	});

	const { data: teachingUnits } = useQuery({
		queryKey: ["teachingUnits", selectedClass],
		queryFn: async () => {
			if (!selectedClass) return [];
			const classData = classes?.find((c) => c.id === selectedClass);
			if (!classData) return [];

			const programId = classData.program.id;
			if (!programId) return [];

			const { items: ues } = await trpcClient.teachingUnits.list.query({
				programId,
			});
			return ues as Array<{
				id: string;
				code: string;
				name: string;
				credits: number;
			}>;
		},
		enabled: !!selectedClass && !!classes,
	});

	const { data: exportConfig } = useQuery({
		queryKey: ["exportConfig"],
		queryFn: () => trpcClient.exports.getConfig.query(),
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
							courseCode: course.code ?? null,
							classCourseCode: cc.code ?? null,
						});
					},
				);
			}
			return result.sort((a, b) => a.courseName.localeCompare(b.courseName));
		},
		enabled: !!selectedClass,
	});

	// Group exams by course
	const examsByCourse = useMemo(() => {
		if (!exams) return new Map<string, ExamItem[]>();

		const grouped = new Map<string, ExamItem[]>();
		for (const exam of exams) {
			const courseKey = exam.courseCode || exam.courseName;
			if (!grouped.has(courseKey)) {
				grouped.set(courseKey, []);
			}
			grouped.get(courseKey)!.push(exam);
		}

		// Sort exams within each course by date
		for (const [, courseExams] of grouped) {
			courseExams.sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			);
		}

		return grouped;
	}, [exams]);

	// Filter and sort exams
	const filteredAndSortedCourses = useMemo(() => {
		if (!exams) return [];

		// Filter by search query
		let filtered = Array.from(examsByCourse.entries());
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(([courseKey, courseExams]) => {
				const courseMatch = courseKey.toLowerCase().includes(query);
				const examMatch = courseExams.some(
					(exam) =>
						exam.name.toLowerCase().includes(query) ||
						exam.type.toLowerCase().includes(query),
				);
				return courseMatch || examMatch;
			});
		}

		// Sort courses
		filtered.sort(([keyA, examsA], [keyB, examsB]) => {
			if (sortBy === "course") {
				return keyA.localeCompare(keyB);
			}
			if (sortBy === "date") {
				const dateA = examsA[0] ? new Date(examsA[0].date).getTime() : 0;
				const dateB = examsB[0] ? new Date(examsB[0].date).getTime() : 0;
				return dateA - dateB;
			}
			// sort by type
			return keyA.localeCompare(keyB);
		});

		return filtered;
	}, [examsByCourse, searchQuery, sortBy, exams]);

	const selectedExamDetails = useMemo(
		() => exams?.filter((exam) => selectedExams.includes(exam.id)) ?? [],
		[exams, selectedExams],
	);
	const hasExamSelection = selectedExamDetails.length > 0;
	const isBusy = exporting !== null;
	const disablePrimaryExports = !selectedClass || !hasExamSelection || isBusy;
	const disableExamExports = !selectedClass || isBusy;

	// Select all handlers
	const handleSelectAll = useCallback(() => {
		if (!exams) return;
		setSelectedExams(exams.map((e) => e.id));
	}, [exams]);

	const handleDeselectAll = useCallback(() => {
		setSelectedExams([]);
	}, []);

	const handleToggleCourse = useCallback(
		(courseExams: ExamItem[]) => {
			const courseExamIds = courseExams.map((e) => e.id);
			const allSelected = courseExamIds.every((id) =>
				selectedExams.includes(id),
			);

			if (allSelected) {
				setSelectedExams((prev) =>
					prev.filter((id) => !courseExamIds.includes(id)),
				);
			} else {
				setSelectedExams((prev) => [...new Set([...prev, ...courseExamIds])]);
			}
		},
		[selectedExams],
	);

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
									id: classCourse.id,
									code: classCourse.code ?? null,
									course: {
										id: classCourse.course,
										name: course.name,
										code: course.code ?? null,
									},
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
		if (!selectedClass || !hasExamSelection || !exportConfig) return;
		setExporting("combined");
		try {
			const students = await fetchStudentsWithGrades();
			if (students.length === 0) return;

			const classData = classes?.find((c) => c.id === selectedClass);
			const semesterData = semesters?.find((s) => s.id === selectedSemester);
			const yearData = academicYears?.find((y) => y.id === selectedYear);

			// Build header rows
			const headerRows: any[][] = [];

			// Institution header
			if (exportConfig.institution) {
				headerRows.push([exportConfig.institution.name_fr || ""]);
				if (exportConfig.institution.faculty_name_fr) {
					headerRows.push([exportConfig.institution.faculty_name_fr]);
				}
			}

			// Document title and info
			headerRows.push([""]);
			headerRows.push(["RELEVÉ DE NOTES"]);
			headerRows.push([""]);

			if (classData || semesterData || yearData) {
				if (classData) headerRows.push([`Classe: ${classData.name}`]);
				if (classData?.program)
					headerRows.push([`Programme: ${classData.program.name}`]);
				if (semesterData) headerRows.push([`Semestre: ${semesterData.name}`]);
				if (yearData) headerRows.push([`Année Académique: ${yearData.name}`]);
				headerRows.push([""]);
			}

			const exportData = students.map((student) => {
				const courseGrades = new Map<string, number[]>();
				student.grades.forEach((grade) => {
					const columnKey =
						grade.exam.class_course.code ??
						grade.exam.class_course.course.code ??
						grade.exam.class_course.course.name;
					if (!columnKey) return;
					if (!courseGrades.has(columnKey)) {
						courseGrades.set(columnKey, []);
					}
					if (selectedExams.includes(grade.exam.id)) {
						courseGrades.get(columnKey)?.push(grade.score);
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

			// Create worksheet with header rows
			const ws = XLSX.utils.aoa_to_sheet(headerRows);
			XLSX.utils.sheet_add_json(ws, exportData, { origin: -1 });

			// Apply styling
			const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

			// Style institution name (row 0) - Bold, larger font, centered
			if (ws["A1"]) {
				ws["A1"].s = {
					font: { bold: true, sz: 16 },
					alignment: { horizontal: "center", vertical: "center" },
				};
			}

			// Style faculty name (row 1) - Bold, centered
			if (ws["A2"]) {
				ws["A2"].s = {
					font: { bold: true, sz: 14 },
					alignment: { horizontal: "center", vertical: "center" },
				};
			}

			// Style document title (find "RELEVÉ DE NOTES")
			for (let i = 0; i < headerRows.length; i++) {
				const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
				if (ws[cellRef] && ws[cellRef].v === "RELEVÉ DE NOTES") {
					ws[cellRef].s = {
						font: { bold: true, sz: 18 },
						alignment: { horizontal: "center", vertical: "center" },
					};
				}
			}

			// Style info rows (Classe, Programme, etc.) - Bold labels
			for (let i = 0; i < headerRows.length; i++) {
				const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
				if (ws[cellRef] && typeof ws[cellRef].v === "string") {
					const value = ws[cellRef].v;
					if (
						value.startsWith("Classe:") ||
						value.startsWith("Programme:") ||
						value.startsWith("Semestre:") ||
						value.startsWith("Année Académique:")
					) {
						ws[cellRef].s = {
							font: { bold: true },
							alignment: { horizontal: "left" },
						};
					}
				}
			}

			// Style column headers (first data row after header) - Bold, background color
			const headerRowIndex = headerRows.length;
			for (let c = range.s.c; c <= range.e.c; c++) {
				const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c });
				if (ws[cellRef]) {
					ws[cellRef].s = {
						font: { bold: true, color: { rgb: "FFFFFF" } },
						fill: { fgColor: { rgb: "4472C4" } },
						alignment: { horizontal: "center", vertical: "center" },
						border: {
							top: { style: "thin", color: { rgb: "000000" } },
							bottom: { style: "thin", color: { rgb: "000000" } },
							left: { style: "thin", color: { rgb: "000000" } },
							right: { style: "thin", color: { rgb: "000000" } },
						},
					};
				}
			}

			// Set column widths
			ws["!cols"] = [
				{ wch: 20 }, // Nom
				{ wch: 20 }, // Prénom
				{ wch: 15 }, // Matricule
				{ wch: 12 }, // Date naissance
				{ wch: 20 }, // Lieu naissance
				{ wch: 10 }, // Sexe
				...Array(range.e.c - 5).fill({ wch: 12 }), // Cours
			];

			// Merge cells for institution name and title
			ws["!merges"] = [
				{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.min(5, range.e.c) } }, // Institution
				{ s: { r: 1, c: 0 }, e: { r: 1, c: Math.min(5, range.e.c) } }, // Faculty
			];

			// Find and merge title row
			for (let i = 0; i < headerRows.length; i++) {
				const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
				if (ws[cellRef] && ws[cellRef].v === "RELEVÉ DE NOTES") {
					ws["!merges"].push({
						s: { r: i, c: 0 },
						e: { r: i, c: Math.min(5, range.e.c) },
					});
					break;
				}
			}

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
		exportConfig,
		classes,
		semesters,
		selectedSemester,
		academicYears,
		selectedYear,
	]);

	const handleVerbalReportExport = useCallback(async () => {
		if (!selectedClass || !hasExamSelection || !exportConfig) return;
		setExporting("pv");
		try {
			const students = await fetchStudentsWithGrades();
			if (students.length === 0) return;

			const classData = classes?.find((c) => c.id === selectedClass);
			const semesterData = semesters?.find((s) => s.id === selectedSemester);
			const yearData = academicYears?.find((y) => y.id === selectedYear);

			const courseGroups = new Map<
				string,
				{ label: string; exams: ExamItem[] }
			>();
			selectedExamDetails.forEach((exam) => {
				const key = exam.classCourseCode ?? exam.courseCode ?? exam.courseName;
				const label = exam.courseCode
					? `${exam.courseName} (${exam.courseCode})`
					: exam.courseName;
				const existing = courseGroups.get(key);
				if (existing) {
					existing.exams.push(exam);
				} else {
					courseGroups.set(key, { label, exams: [exam] });
				}
			});
			const groupedCourses = Array.from(courseGroups.values());
			const orderedExams = groupedCourses.flatMap(({ exams }) => exams);
			const firstHeaderRow = [
				t("admin.gradeExport.pv.table.rank"),
				t("admin.gradeExport.columns.registration"),
				t("admin.gradeExport.pv.table.fullName"),
				...groupedCourses.flatMap(({ label, exams }) => [
					label,
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
				exam.courseCode
					? `${exam.courseName} (${exam.courseCode})`
					: exam.courseName,
				exam.type,
				`${exam.percentage}%`,
			]);

			// Build institution header
			const institutionHeader: (string | number)[][] = [];
			if (exportConfig.institution) {
				institutionHeader.push([exportConfig.institution.name_fr || ""]);
				if (exportConfig.institution.faculty_name_fr) {
					institutionHeader.push([exportConfig.institution.faculty_name_fr]);
				}
			}
			institutionHeader.push([""]);
			institutionHeader.push(["PROCÈS-VERBAL DES RÉSULTATS"]);
			institutionHeader.push([""]);

			if (classData || semesterData || yearData) {
				if (classData) institutionHeader.push([`Classe: ${classData.name}`]);
				if (classData?.program)
					institutionHeader.push([`Programme: ${classData.program.name}`]);
				if (semesterData)
					institutionHeader.push([`Semestre: ${semesterData.name}`]);
				if (yearData)
					institutionHeader.push([`Année Académique: ${yearData.name}`]);
				institutionHeader.push([""]);
			}

			const aoa: (string | number)[][] = [
				...institutionHeader,
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
			const headerRow1Index = institutionHeader.length + statsRows.length + 1;
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
			// Add institution header merges and styling
			const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

			// Style institution name (row 0) - Bold, larger font, centered
			if (ws["A1"]) {
				ws["A1"].s = {
					font: { bold: true, sz: 16 },
					alignment: { horizontal: "center", vertical: "center" },
				};
				merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } });
			}

			// Style faculty name (row 1) - Bold, centered
			if (ws["A2"]) {
				ws["A2"].s = {
					font: { bold: true, sz: 14 },
					alignment: { horizontal: "center", vertical: "center" },
				};
				merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: range.e.c } });
			}

			// Style document title
			for (let i = 0; i < institutionHeader.length; i++) {
				const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
				if (ws[cellRef] && ws[cellRef].v === "PROCÈS-VERBAL DES RÉSULTATS") {
					ws[cellRef].s = {
						font: { bold: true, sz: 18 },
						alignment: { horizontal: "center", vertical: "center" },
					};
					merges.push({ s: { r: i, c: 0 }, e: { r: i, c: range.e.c } });
				}
			}

			// Style info rows
			for (let i = 0; i < institutionHeader.length; i++) {
				const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
				if (ws[cellRef] && typeof ws[cellRef].v === "string") {
					const value = ws[cellRef].v;
					if (
						value.startsWith("Classe:") ||
						value.startsWith("Programme:") ||
						value.startsWith("Semestre:") ||
						value.startsWith("Année Académique:")
					) {
						ws[cellRef].s = {
							font: { bold: true },
							alignment: { horizontal: "left" },
						};
					}
				}
			}

			// Style stats section title
			const statsStartRow = institutionHeader.length;
			const statsTitleRef = XLSX.utils.encode_cell({ r: statsStartRow, c: 0 });
			if (ws[statsTitleRef]) {
				ws[statsTitleRef].s = {
					font: { bold: true, sz: 14 },
					fill: { fgColor: { rgb: "E7E6E6" } },
					alignment: { horizontal: "center", vertical: "center" },
				};
			}

			// Style stats rows
			for (let i = 1; i < statsRows.length; i++) {
				const cellRef = XLSX.utils.encode_cell({ r: statsStartRow + i, c: 0 });
				if (ws[cellRef]) {
					ws[cellRef].s = { font: { bold: true } };
				}
			}

			// Style table title
			const tableTitleRow = institutionHeader.length + statsRows.length + 1;
			const tableTitleRef = XLSX.utils.encode_cell({ r: tableTitleRow, c: 0 });
			if (ws[tableTitleRef]) {
				ws[tableTitleRef].s = {
					font: { bold: true, sz: 14 },
					fill: { fgColor: { rgb: "E7E6E6" } },
					alignment: { horizontal: "center", vertical: "center" },
				};
			}

			// Style table headers - Bold, background color, borders
			for (let c = 0; c <= range.e.c; c++) {
				// First header row
				const cellRef1 = XLSX.utils.encode_cell({ r: headerRow1Index, c });
				if (ws[cellRef1]) {
					ws[cellRef1].s = {
						font: { bold: true, color: { rgb: "FFFFFF" } },
						fill: { fgColor: { rgb: "4472C4" } },
						alignment: {
							horizontal: "center",
							vertical: "center",
							wrapText: true,
						},
						border: {
							top: { style: "thin", color: { rgb: "000000" } },
							bottom: { style: "thin", color: { rgb: "000000" } },
							left: { style: "thin", color: { rgb: "000000" } },
							right: { style: "thin", color: { rgb: "000000" } },
						},
					};
				}

				// Second header row
				const cellRef2 = XLSX.utils.encode_cell({ r: headerRow2Index, c });
				if (ws[cellRef2]) {
					ws[cellRef2].s = {
						font: { bold: true, color: { rgb: "FFFFFF" } },
						fill: { fgColor: { rgb: "5B9BD5" } },
						alignment: { horizontal: "center", vertical: "center" },
						border: {
							top: { style: "thin", color: { rgb: "000000" } },
							bottom: { style: "thin", color: { rgb: "000000" } },
							left: { style: "thin", color: { rgb: "000000" } },
							right: { style: "thin", color: { rgb: "000000" } },
						},
					};
				}
			}

			// Style data rows - add borders and alternate row colors
			const dataStartRow = headerRow2Index + 1;
			const dataEndRow = dataStartRow + tableRows.length - 1;
			for (let r = dataStartRow; r <= dataEndRow; r++) {
				for (let c = 0; c <= range.e.c; c++) {
					const cellRef = XLSX.utils.encode_cell({ r, c });
					if (ws[cellRef]) {
						ws[cellRef].s = {
							alignment: { horizontal: "center", vertical: "center" },
							border: {
								top: { style: "thin", color: { rgb: "D0D0D0" } },
								bottom: { style: "thin", color: { rgb: "D0D0D0" } },
								left: { style: "thin", color: { rgb: "D0D0D0" } },
								right: { style: "thin", color: { rgb: "D0D0D0" } },
							},
						};

						// Alternate row colors
						if ((r - dataStartRow) % 2 === 1) {
							ws[cellRef].s.fill = { fgColor: { rgb: "F2F2F2" } };
						}
					}
				}
			}

			// Style legend title
			const legendTitleRow = dataEndRow + 2;
			const legendTitleRef = XLSX.utils.encode_cell({
				r: legendTitleRow,
				c: 0,
			});
			if (ws[legendTitleRef]) {
				ws[legendTitleRef].s = {
					font: { bold: true, sz: 14 },
					fill: { fgColor: { rgb: "E7E6E6" } },
					alignment: { horizontal: "center", vertical: "center" },
				};
			}

			// Style legend headers
			const legendHeaderRow = legendTitleRow + 1;
			for (let c = 0; c < 3; c++) {
				const cellRef = XLSX.utils.encode_cell({ r: legendHeaderRow, c });
				if (ws[cellRef]) {
					ws[cellRef].s = {
						font: { bold: true },
						fill: { fgColor: { rgb: "D9E2F3" } },
						alignment: { horizontal: "center", vertical: "center" },
						border: {
							top: { style: "thin" },
							bottom: { style: "thin" },
							left: { style: "thin" },
							right: { style: "thin" },
						},
					};
				}
			}

			// Set column widths
			ws["!cols"] = [
				{ wch: 8 }, // Rang
				{ wch: 15 }, // Matricule
				{ wch: 25 }, // Nom complet
				...Array(orderedExams.length).fill({ wch: 10 }), // Notes
				{ wch: 12 }, // Moyenne
			];

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
		exportConfig,
		classes,
		semesters,
		selectedSemester,
		academicYears,
		selectedYear,
	]);

	const handleExamExport = useCallback(
		async (exam: ExamItem) => {
			if (!selectedClass || !exportConfig) return;
			setExporting(exam.id);
			try {
				const students = await fetchStudentsWithGrades();
				if (students.length === 0) return;

				const classData = classes?.find((c) => c.id === selectedClass);
				const semesterData = semesters?.find((s) => s.id === selectedSemester);
				const yearData = academicYears?.find((y) => y.id === selectedYear);

				// Build header rows
				const headerRows: any[][] = [];

				// Institution header
				if (exportConfig.institution) {
					headerRows.push([exportConfig.institution.name_fr || ""]);
					if (exportConfig.institution.faculty_name_fr) {
						headerRows.push([exportConfig.institution.faculty_name_fr]);
					}
				}

				// Document title and info
				headerRows.push([""]);
				headerRows.push([
					`PUBLICATION DES NOTES - ${exam.courseName} (${exam.type})`,
				]);
				headerRows.push([""]);

				if (classData || semesterData || yearData) {
					if (classData) headerRows.push([`Classe: ${classData.name}`]);
					if (classData?.program)
						headerRows.push([`Programme: ${classData.program.name}`]);
					if (semesterData) headerRows.push([`Semestre: ${semesterData.name}`]);
					if (yearData) headerRows.push([`Année Académique: ${yearData.name}`]);
					if (exam.date)
						headerRows.push([
							`Date: ${format(new Date(exam.date), "dd/MM/yyyy")}`,
						]);
					headerRows.push([""]);
				}

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

				// Create worksheet with header rows
				const ws = XLSX.utils.aoa_to_sheet(headerRows);
				XLSX.utils.sheet_add_json(ws, exportData, { origin: -1 });

				const wb = XLSX.utils.book_new();
				XLSX.utils.book_append_sheet(
					wb,
					ws,
					t("admin.gradeExport.actions.examGroup.sheetName"),
				);
				// Apply styling
				const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
				const merges: XLSX.Range[] = [];
				if (ws["A1"]) {
					ws["A1"].s = {
						font: { bold: true, sz: 16 },
						alignment: { horizontal: "center" },
					};
					merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } });
				}
				if (ws["A2"]) {
					ws["A2"].s = {
						font: { bold: true, sz: 14 },
						alignment: { horizontal: "center" },
					};
					merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } });
				}
				for (let i = 0; i < headerRows.length; i++) {
					const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
					if (ws[cellRef] && typeof ws[cellRef].v === "string") {
						const value = ws[cellRef].v;
						if (value.startsWith("PUBLICATION")) {
							ws[cellRef].s = {
								font: { bold: true, sz: 18 },
								alignment: { horizontal: "center" },
							};
							merges.push({ s: { r: i, c: 0 }, e: { r: i, c: 3 } });
						} else if (value.includes(":")) {
							ws[cellRef].s = { font: { bold: true } };
						}
					}
				}
				const headerRowIndex = headerRows.length;
				for (let c = 0; c <= 3; c++) {
					const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c });
					if (ws[cellRef])
						ws[cellRef].s = {
							font: { bold: true, color: { rgb: "FFFFFF" } },
							fill: { fgColor: { rgb: "4472C4" } },
							alignment: { horizontal: "center" },
							border: {
								top: { style: "thin" },
								bottom: { style: "thin" },
								left: { style: "thin" },
								right: { style: "thin" },
							},
						};
				}
				for (let r = headerRowIndex + 1; r <= range.e.r; r++) {
					for (let c = 0; c <= 3; c++) {
						const cellRef = XLSX.utils.encode_cell({ r, c });
						if (ws[cellRef]) {
							ws[cellRef].s = {
								alignment: { horizontal: "center" },
								border: {
									top: { style: "thin" },
									bottom: { style: "thin" },
									left: { style: "thin" },
									right: { style: "thin" },
								},
							};
							if ((r - headerRowIndex - 1) % 2 === 1)
								ws[cellRef].s.fill = { fgColor: { rgb: "F2F2F2" } };
						}
					}
				}
				ws["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 12 }];
				ws["!merges"] = merges;

				const courseSegment = slugify(exam.courseCode ?? exam.courseName);
				const examSuffix = `${courseSegment}-${slugify(exam.type)}`;
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
		[
			buildFilename,
			fetchStudentsWithGrades,
			selectedClass,
			t,
			exportConfig,
			classes,
			semesters,
			selectedSemester,
			academicYears,
			selectedYear,
		],
	);

	const handlePreviewPV = useCallback(async () => {
		if (!selectedClass || !selectedSemester || !selectedYear) return;
		setExporting("preview-pv");
		try {
			const html = await trpcClient.exports.previewPV.query({
				classId: selectedClass,
				semesterId: selectedSemester,
				academicYearId: selectedYear,
			});
			setPreviewHtml(html);
			setPreviewTitle("Prévisualisation - Procès-Verbal");
			setShowPreview(true);
		} catch (error) {
			console.error("PV preview error:", error);
		} finally {
			setExporting(null);
		}
	}, [selectedClass, selectedSemester, selectedYear]);

	const handleGeneratePV = useCallback(async () => {
		if (!selectedClass || !selectedSemester || !selectedYear) return;
		setExporting("generate-pv");
		try {
			const result = await trpcClient.exports.generatePV.mutate({
				classId: selectedClass,
				semesterId: selectedSemester,
				academicYearId: selectedYear,
				format: "pdf",
			});

			// Convert base64 to blob and download
			const byteCharacters = atob(result.data);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: "application/pdf" });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = result.filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("PV generation error:", error);
		} finally {
			setExporting(null);
		}
	}, [selectedClass, selectedSemester, selectedYear]);

	const handlePreviewEvaluation = useCallback(async (examId: string) => {
		setExporting(`preview-eval-${examId}`);
		try {
			const html = await trpcClient.exports.previewEvaluation.query({
				examId,
			});
			setPreviewHtml(html);
			setPreviewTitle("Prévisualisation - Publication Évaluation");
			setShowPreview(true);
		} catch (error) {
			console.error("Evaluation preview error:", error);
		} finally {
			setExporting(null);
		}
	}, []);

	const handleGenerateEvaluation = useCallback(async (examId: string) => {
		setExporting(`generate-eval-${examId}`);
		try {
			const result = await trpcClient.exports.generateEvaluation.mutate({
				examId,
				format: "pdf",
			});

			// Debug: log what we received
			console.log("Result from backend:", result);
			console.log("Result data type:", typeof result.data);
			console.log("Result data length:", result.data.length);
			console.log("First 100 chars:", result.data.substring(0, 100));

			// Convert base64 to blob and download
			const byteCharacters = atob(result.data);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: "application/pdf" });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = result.filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Evaluation generation error:", error);
		} finally {
			setExporting(null);
		}
	}, []);

	const handlePreviewUE = useCallback(
		async (ueId: string) => {
			if (!selectedClass || !selectedSemester || !selectedYear) return;
			setExporting(`preview-ue-${ueId}`);
			try {
				const html = await trpcClient.exports.previewUE.query({
					teachingUnitId: ueId,
					classId: selectedClass,
					semesterId: selectedSemester,
					academicYearId: selectedYear,
				});
				setPreviewHtml(html);
				setPreviewTitle("Prévisualisation - Publication UE");
				setShowPreview(true);
			} catch (error) {
				console.error("UE preview error:", error);
			} finally {
				setExporting(null);
			}
		},
		[selectedClass, selectedSemester, selectedYear],
	);

	const handleGenerateUE = useCallback(
		async (ueId: string) => {
			if (!selectedClass || !selectedSemester || !selectedYear) return;
			setExporting(`generate-ue-${ueId}`);
			try {
				const result = await trpcClient.exports.generateUE.mutate({
					teachingUnitId: ueId,
					classId: selectedClass,
					semesterId: selectedSemester,
					academicYearId: selectedYear,
					format: "pdf",
				});

				// Convert base64 to blob and download
				const byteCharacters = atob(result.data);
				const byteNumbers = new Array(byteCharacters.length);
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], { type: "application/pdf" });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = result.filename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
			} catch (error) {
				console.error("UE generation error:", error);
			} finally {
				setExporting(null);
			}
		},
		[selectedClass, selectedSemester, selectedYear],
	);

	const handleBulkGenerateEvaluations = useCallback(async () => {
		if (!selectedExamDetails || selectedExamDetails.length === 0) return;
		setExporting("bulk-evaluations");
		try {
			for (const exam of selectedExamDetails) {
				const result = await trpcClient.exports.generateEvaluation.mutate({
					examId: exam.id,
					format: "pdf",
				});

				const byteCharacters = atob(result.data);
				const byteNumbers = new Array(byteCharacters.length);
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], { type: "application/pdf" });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = result.filename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);

				// Small delay between downloads
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		} catch (error) {
			console.error("Bulk evaluations generation error:", error);
		} finally {
			setExporting(null);
		}
	}, [selectedExamDetails]);

	const handleBulkGenerateUEs = useCallback(async () => {
		if (
			!teachingUnits ||
			teachingUnits.length === 0 ||
			!selectedClass ||
			!selectedSemester ||
			!selectedYear
		)
			return;
		setExporting("bulk-ues");
		try {
			for (const ue of teachingUnits) {
				const result = await trpcClient.exports.generateUE.mutate({
					teachingUnitId: ue.id,
					classId: selectedClass,
					semesterId: selectedSemester,
					academicYearId: selectedYear,
					format: "pdf",
				});

				const byteCharacters = atob(result.data);
				const byteNumbers = new Array(byteCharacters.length);
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], { type: "application/pdf" });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = result.filename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);

				// Small delay between downloads
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		} catch (error) {
			console.error("Bulk UEs generation error:", error);
		} finally {
			setExporting(null);
		}
	}, [teachingUnits, selectedClass, selectedSemester, selectedYear]);

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

					<div className="space-y-2">
						<Label htmlFor={semesterId}>Semestre (pour PV PDF)</Label>
						<Select
							value={selectedSemester || undefined}
							onValueChange={setSelectedSemester}
						>
							<SelectTrigger id={semesterId}>
								<SelectValue placeholder="Sélectionner un semestre" />
							</SelectTrigger>
							<SelectContent>
								{semesters?.map((semester) => (
									<SelectItem key={semester.id} value={semester.id}>
										{semester.name}
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
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<CardTitle>{t("admin.gradeExport.exams.title")}</CardTitle>
								<CardDescription>
									{selectedExams.length} / {exams.length} évaluations
									sélectionnées
								</CardDescription>
							</div>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleSelectAll}
									disabled={selectedExams.length === exams.length}
								>
									Tout sélectionner
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleDeselectAll}
									disabled={selectedExams.length === 0}
								>
									Tout désélectionner
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Search and sort controls */}
						<div className="flex gap-4">
							<div className="relative flex-1">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Rechercher une matière ou une évaluation..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9"
								/>
							</div>
							<Select
								value={sortBy}
								onValueChange={(value: any) => setSortBy(value)}
							>
								<SelectTrigger className="w-48">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="course">Trier par matière</SelectItem>
									<SelectItem value="date">Trier par date</SelectItem>
									<SelectItem value="type">Trier par type</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Grouped exams by course */}
						{filteredAndSortedCourses.length > 0 ? (
							<Accordion type="multiple" className="w-full">
								{filteredAndSortedCourses.map(([courseKey, courseExams]) => {
									const courseSelectedCount = courseExams.filter((e) =>
										selectedExams.includes(e.id),
									).length;
									const allCourseSelected =
										courseSelectedCount === courseExams.length;

									return (
										<AccordionItem key={courseKey} value={courseKey}>
											<div className="flex items-center gap-2">
												<Checkbox
													checked={allCourseSelected}
													onCheckedChange={() =>
														handleToggleCourse(courseExams)
													}
													className="ml-4"
												/>
												<AccordionTrigger className="flex-1 hover:no-underline">
													<div className="flex flex-1 items-center gap-3">
														<div className="flex-1 text-left">
															<div className="font-medium">
																{courseExams[0].courseName}
																{courseExams[0].courseCode && (
																	<span className="ml-2 font-normal text-muted-foreground">
																		({courseExams[0].courseCode})
																	</span>
																)}
															</div>
															<div className="text-muted-foreground text-xs">
																{courseSelectedCount} / {courseExams.length}{" "}
																évaluations
															</div>
														</div>
														<Badge
															variant={
																allCourseSelected ? "default" : "secondary"
															}
														>
															{courseExams.length}
														</Badge>
													</div>
												</AccordionTrigger>
											</div>
											<AccordionContent>
												<div className="space-y-2 pt-2 pl-9">
													{courseExams.map((exam) => (
														<div
															key={exam.id}
															className="flex items-start gap-3 rounded-lg border px-3 py-2 hover:bg-accent"
														>
															<Checkbox
																id={`exam-${exam.id}`}
																checked={selectedExams.includes(exam.id)}
																onCheckedChange={(checked) => {
																	if (checked) {
																		setSelectedExams((prev) => [
																			...prev,
																			exam.id,
																		]);
																	} else {
																		setSelectedExams((prev) =>
																			prev.filter((id) => id !== exam.id),
																		);
																	}
																}}
															/>
															<label
																htmlFor={`exam-${exam.id}`}
																className="flex-1 cursor-pointer"
															>
																<div className="flex items-center justify-between">
																	<div>
																		<div className="font-medium text-sm">
																			{exam.name} • {exam.type}
																		</div>
																		<div className="text-muted-foreground text-xs">
																			{format(
																				new Date(exam.date),
																				"dd MMM yyyy",
																			)}{" "}
																			• {exam.percentage}%
																		</div>
																	</div>
																</div>
															</label>
														</div>
													))}
												</div>
											</AccordionContent>
										</AccordionItem>
									);
								})}
							</Accordion>
						) : (
							<div className="py-8 text-center text-muted-foreground">
								<Search className="mx-auto mb-4 h-12 w-12 opacity-50" />
								<p>Aucune évaluation trouvée pour "{searchQuery}"</p>
							</div>
						)}
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

			<Tabs defaultValue="excel" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="excel">
						<FileSpreadsheet className="mr-2 h-4 w-4" />
						Exports Excel
					</TabsTrigger>
					<TabsTrigger value="pdf">
						<FileText className="mr-2 h-4 w-4" />
						Exports PDF
					</TabsTrigger>
				</TabsList>

				<TabsContent value="excel" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{t("admin.gradeExport.actions.label")}</CardTitle>
							<CardDescription>
								{t("admin.gradeExport.subtitle")}
							</CardDescription>
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
										{exporting === "combined" ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<Download className="mr-2 h-4 w-4" />
										)}
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
										{exporting === "pv" ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<FileSpreadsheet className="mr-2 h-4 w-4" />
										)}
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
												{exporting === exam.id && (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												)}
												{exam.courseName} • {exam.type}
											</Button>
										))}
									</div>
								</div>
							) : null}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="pdf" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Export PDF (Procès-Verbaux et Publications)</CardTitle>
							<CardDescription>
								Générez des documents PDF professionnels pour les PV,
								évaluations et UEs
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-4">
								<div>
									<h4 className="mb-3 font-semibold text-sm">
										Procès-Verbal (PV) PDF
									</h4>
									<p className="mb-4 text-muted-foreground text-sm">
										Exportez le PV complet avec toutes les UEs et notes pour la
										classe et le semestre sélectionnés
									</p>
									<div className="flex gap-2">
										<Button
											type="button"
											variant="outline"
											onClick={handlePreviewPV}
											disabled={
												!selectedClass ||
												!selectedSemester ||
												!selectedYear ||
												isBusy
											}
										>
											{exporting === "preview-pv" ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<Eye className="mr-2 h-4 w-4" />
											)}
											Prévisualiser PV
										</Button>
										<Button
											type="button"
											onClick={handleGeneratePV}
											disabled={
												!selectedClass ||
												!selectedSemester ||
												!selectedYear ||
												isBusy
											}
										>
											{exporting === "generate-pv" ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<FileText className="mr-2 h-4 w-4" />
											)}
											Générer PV PDF
										</Button>
									</div>
								</div>

								<Separator />

								{hasExamSelection && (
									<div>
										<h4 className="mb-3 font-semibold text-sm">
											Publications des Évaluations PDF
										</h4>
										<p className="mb-4 text-muted-foreground text-sm">
											Exportez les publications PDF pour chaque évaluation
											sélectionnée
										</p>
										<div className="mb-4">
											<Button
												type="button"
												onClick={handleBulkGenerateEvaluations}
												disabled={disableExamExports}
											>
												{exporting === "bulk-evaluations" ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<Download className="mr-2 h-4 w-4" />
												)}
												Télécharger toutes les évaluations (
												{selectedExamDetails.length})
											</Button>
										</div>
										<div className="flex flex-wrap gap-2">
											{selectedExamDetails.map((exam) => (
												<div key={exam.id} className="flex gap-1">
													<Button
														type="button"
														variant="outline"
														size="sm"
														disabled={disableExamExports}
														onClick={() => handlePreviewEvaluation(exam.id)}
													>
														{exporting === `preview-eval-${exam.id}` ? (
															<Loader2 className="mr-1 h-3 w-3 animate-spin" />
														) : (
															<Eye className="mr-1 h-3 w-3" />
														)}
														{exam.courseName} • {exam.type}
													</Button>
													<Button
														type="button"
														size="sm"
														disabled={disableExamExports}
														onClick={() => handleGenerateEvaluation(exam.id)}
													>
														{exporting === `generate-eval-${exam.id}` ? (
															<Loader2 className="mr-1 h-3 w-3 animate-spin" />
														) : (
															<Download className="mr-1 h-3 w-3" />
														)}
														PDF
													</Button>
												</div>
											))}
										</div>
									</div>
								)}

								<Separator />

								{teachingUnits && teachingUnits.length > 0 && (
									<div>
										<h4 className="mb-3 font-semibold text-sm">
											Publications des Unités d'Enseignement (UE) PDF
										</h4>
										<p className="mb-4 text-muted-foreground text-sm">
											Exportez les publications PDF pour chaque UE sélectionnée
										</p>
										<div className="mb-4">
											<Button
												type="button"
												onClick={handleBulkGenerateUEs}
												disabled={
													!selectedClass ||
													!selectedSemester ||
													!selectedYear ||
													isBusy
												}
											>
												{exporting === "bulk-ues" ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<Download className="mr-2 h-4 w-4" />
												)}
												Télécharger toutes les UEs ({teachingUnits.length})
											</Button>
										</div>
										<div className="flex flex-wrap gap-2">
											{teachingUnits.map((ue) => (
												<div key={ue.id} className="flex gap-1">
													<Button
														type="button"
														variant="outline"
														size="sm"
														disabled={
															!selectedClass ||
															!selectedSemester ||
															!selectedYear ||
															isBusy
														}
														onClick={() => handlePreviewUE(ue.id)}
													>
														{exporting === `preview-ue-${ue.id}` ? (
															<Loader2 className="mr-1 h-3 w-3 animate-spin" />
														) : (
															<Eye className="mr-1 h-3 w-3" />
														)}
														{ue.code} - {ue.name}
													</Button>
													<Button
														type="button"
														size="sm"
														disabled={
															!selectedClass ||
															!selectedSemester ||
															!selectedYear ||
															isBusy
														}
														onClick={() => handleGenerateUE(ue.id)}
													>
														{exporting === `generate-ue-${ue.id}` ? (
															<Loader2 className="mr-1 h-3 w-3 animate-spin" />
														) : (
															<Download className="mr-1 h-3 w-3" />
														)}
														PDF
													</Button>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<Dialog open={showPreview} onOpenChange={setShowPreview}>
				<DialogContent className="max-h-[90vh] min-w-[80vw] overflow-auto">
					<DialogHeader>
						<DialogTitle>{previewTitle}</DialogTitle>
						<DialogDescription>
							Prévisualisation HTML avant génération PDF
						</DialogDescription>
					</DialogHeader>
					<div className="h-[80vh] w-full overflow-hidden rounded-md border bg-gray-100">
						<iframe
							title="preview"
							className="h-full w-full bg-white"
							sandbox="allow-same-origin"
							srcDoc={previewHtml}
						/>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

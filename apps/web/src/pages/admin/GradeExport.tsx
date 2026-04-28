import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	AlertCircle,
	CheckCircle2,
	Download,
	Eye,
	FileSpreadsheet,
	Files,
	FileText,
	Loader2,
	Package,
	Search,
} from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { SemesterSelect } from "@/components/inputs/SemesterSelect";
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
import { toast } from "@/lib/toast";
import type { RouterOutputs } from "../../utils/trpc";
import { trpcClient } from "../../utils/trpc";

type ExcelCell = string | number | boolean | null | undefined;
type ExcelRow = ExcelCell[];

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
	sessionType?: "normal" | "retake";
	parentExamId?: string | null;
	scoringPolicy?: "replace" | "best_of";
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
			sessionType: "normal" | "retake";
			parentExamId: string | null;
			scoringPolicy: "replace" | "best_of";
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

/**
 * Resolve grades considering retake exams and scoring policy.
 * Groups exams by type (CC, EXAMEN) and applies scoring policy for retakes.
 *
 * @param studentGrades - All grades for a student
 * @param allExams - All exams (including retakes)
 * @returns Map of exam ID to effective score (with retake logic applied)
 */
function resolveRetakeGrades(
	studentGrades: Array<{ examId: string; score: number }>,
	allExams: ExamItem[],
): Map<string, { score: number; isRetake: boolean }> {
	const gradeMap = new Map(studentGrades.map((g) => [g.examId, g.score]));

	const normalExams = allExams.filter((e) => e.sessionType === "normal");
	const retakeExams = allExams.filter((e) => e.sessionType === "retake");

	// Map retakes to their parent exams
	const retakesByParent = new Map<string, ExamItem>();
	for (const retake of retakeExams) {
		if (retake.parentExamId) {
			retakesByParent.set(retake.parentExamId, retake);
		}
	}

	const resolvedGrades = new Map<
		string,
		{ score: number; isRetake: boolean }
	>();

	for (const exam of normalExams) {
		const normalScore = gradeMap.get(exam.id);
		const retakeExam = retakesByParent.get(exam.id);

		if (retakeExam) {
			const retakeScore = gradeMap.get(retakeExam.id);

			if (retakeScore !== undefined) {
				const policy = retakeExam.scoringPolicy || "replace";

				if (policy === "replace") {
					// Replace: always use retake score if available
					resolvedGrades.set(exam.id, { score: retakeScore, isRetake: true });
				} else {
					// best_of: use the higher score
					if (normalScore !== undefined) {
						const bestScore = Math.max(normalScore, retakeScore);
						resolvedGrades.set(exam.id, {
							score: bestScore,
							isRetake:
								bestScore === retakeScore && retakeScore !== normalScore,
						});
					} else {
						resolvedGrades.set(exam.id, { score: retakeScore, isRetake: true });
					}
				}
			} else if (normalScore !== undefined) {
				// No retake grade, use normal score
				resolvedGrades.set(exam.id, { score: normalScore, isRetake: false });
			}
		} else if (normalScore !== undefined) {
			// No retake, use normal grade
			resolvedGrades.set(exam.id, { score: normalScore, isRetake: false });
		}
	}

	return resolvedGrades;
}

interface GradeItem {
	exam: string;
	score: string | number;
}

const PREFS_KEY = "gradeExport.prefs";

function loadPrefs() {
	try {
		return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
	} catch {
		return {};
	}
}

function savePrefs(patch: Record<string, unknown>) {
	try {
		const current = loadPrefs();
		localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...patch }));
	} catch {}
}

export default function GradeExport() {
	const prefs = loadPrefs();
	const [selectedYear, setSelectedYear] = useState<string>(prefs.year ?? "");
	const [selectedClass, setSelectedClass] = useState<string>(prefs.class ?? "");
	const [selectedSemester, setSelectedSemester] = useState<string>(
		prefs.semester ?? "",
	);
	const [selectedExams, setSelectedExams] = useState<string[]>([]);
	const [_selectedUEs, _setSelectedUEs] = useState<string[]>([]);
	const [exporting, setExporting] = useState<string | null>(null);
	const [showPreview, setShowPreview] = useState(false);
	const [previewHtml, setPreviewHtml] = useState("");
	const [previewTitle, setPreviewTitle] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<"course" | "date" | "type">(
		prefs.sortBy ?? "course",
	);
	const [includeRetakes, setIncludeRetakes] = useState<boolean>(
		prefs.includeRetakes ?? true,
	);
	const classId = useId();
	const semesterId = useId();
	const { t } = useTranslation();

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
				toast.error(
					t("admin.gradeExport.toast.semestersFetchError", {
						defaultValue: "Could not load semesters",
					}),
				);
				return [];
			}
		},
	});

	const { data: academicYears } = useQuery({
		queryKey: ["academicYears"],
		queryFn: async () => {
			const { items } = await trpcClient.academicYears.list.query({});
			return items as Array<{ id: string; name: string }>;
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

	// EC list for the "Par EC" section — one entry per class_course attached
	// to the selected class. Used to render preview + generate buttons per EC.
	// Filtered by semester when one is selected so the user only sees the ECs
	// taught during that period.
	const { data: classCoursesList } = useQuery({
		queryKey: ["classCourses-export", selectedClass, selectedSemester],
		queryFn: async () => {
			if (!selectedClass) return [];
			const { items } = await trpcClient.classCourses.list.query({
				classId: selectedClass,
				...(selectedSemester ? { semesterId: selectedSemester } : {}),
				limit: 500,
			});
			// Reshape to a UI-friendly tuple. The repo flattens its joins —
			// the `list` output exposes `courseCode`/`courseName` (NOT a
			// nested `courseRef`), so reading from `courseRef.code` was
			// silently returning undefined and rendering "—" everywhere.
			return (items as Array<unknown>).map((raw) => {
				const cc = raw as {
					id: string;
					coefficient: string | number | null;
					courseCode?: string;
					courseName?: string;
				};
				return {
					id: cc.id,
					coefficient: Number(cc.coefficient ?? 1),
					code: cc.courseCode ?? "—",
					name: cc.courseName ?? "—",
				};
			});
		},
		enabled: !!selectedClass,
	});

	const { data: exportConfig } = useQuery({
		queryKey: ["exportConfig"],
		queryFn: () => trpcClient.exports.getConfig.query(),
	});

	const {
		data: exams,
		isLoading: examsLoading,
		isFetching: examsFetching,
	} = useQuery({
		queryKey: ["exams", selectedClass],
		queryFn: async (): Promise<ExamItem[]> => {
			if (!selectedClass) return [];
			// Single batched call — exams.list returns courseName/courseCode joined.
			const { items } = await trpcClient.exams.list.query({
				classId: selectedClass,
				limit: 500,
			});
			const result: ExamItem[] = items.map((exam: any) => ({
				id: exam.id,
				name: exam.name,
				type: exam.type,
				date: exam.date,
				percentage: Number(exam.percentage),
				courseName: exam.courseName ?? "",
				courseCode: exam.courseCode ?? null,
				classCourseCode: exam.classCourseCode ?? null,
				sessionType: exam.sessionType || "normal",
				parentExamId: exam.parentExamId || null,
				scoringPolicy: exam.scoringPolicy || "replace",
			}));
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
			grouped.get(courseKey)?.push(exam);
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
							exam = await trpcClient.exams.getById.query({
								id: grade.exam,
							});
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
								sessionType: (exam.sessionType || "normal") as
									| "normal"
									| "retake",
								parentExamId: exam.parentExamId || null,
								scoringPolicy: (exam.scoringPolicy || "replace") as
									| "replace"
									| "best_of",
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
			const headerRows: ExcelRow[] = [];

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

			// Sort students alphabetically
			const sortedStudents = [...students].sort(
				(a, b) =>
					a.last_name.localeCompare(b.last_name) ||
					a.first_name.localeCompare(b.first_name),
			);

			const exportData = sortedStudents.map((student) => {
				// Build exam list from student's grades for retake resolution
				const studentExamItems: ExamItem[] = student.grades.map((g) => ({
					id: g.exam.id,
					name: g.exam.name,
					type: g.exam.type,
					date: "",
					percentage: g.exam.percentage,
					courseName: g.exam.class_course.course.name,
					courseCode: g.exam.class_course.course.code,
					classCourseCode: g.exam.class_course.code,
					sessionType: g.exam.sessionType,
					parentExamId: g.exam.parentExamId,
					scoringPolicy: g.exam.scoringPolicy,
				}));

				// Resolve retake grades
				const studentGradesForResolution = student.grades.map((g) => ({
					examId: g.exam.id,
					score: g.score,
				}));
				const resolvedGrades = resolveRetakeGrades(
					studentGradesForResolution,
					studentExamItems,
				);

				// Group resolved grades by course
				const courseGrades = new Map<string, number[]>();
				for (const grade of student.grades) {
					// Skip retake exams - their scores are merged into parent exams
					if (grade.exam.sessionType === "retake") continue;

					const columnKey =
						grade.exam.class_course.code ??
						grade.exam.class_course.course.code ??
						grade.exam.class_course.course.name;
					if (!columnKey) continue;
					if (!courseGrades.has(columnKey)) {
						courseGrades.set(columnKey, []);
					}
					if (selectedExams.includes(grade.exam.id)) {
						// Use resolved grade (with retake logic applied)
						const resolved = resolvedGrades.get(grade.exam.id);
						if (resolved) {
							courseGrades.get(columnKey)?.push(resolved.score);
						}
					}
				}

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
			if (ws.A1) {
				ws.A1.s = {
					font: { bold: true, sz: 16 },
					alignment: { horizontal: "center", vertical: "center" },
				};
			}

			// Style faculty name (row 1) - Bold, centered
			if (ws.A2) {
				ws.A2.s = {
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
				const cellRef = XLSX.utils.encode_cell({
					r: headerRowIndex,
					c,
				});
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
			toast.error(
				error instanceof Error
					? error.message
					: t("admin.gradeExport.toast.exportError", {
							defaultValue: "Export failed",
						}),
			);
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
		if (!selectedClass || !selectedSemester || !selectedYear) return;
		setExporting("pv");
		try {
			// Fetch structured PV data from backend (correct LMD computation)
			const pvData = await trpcClient.exports.getPVData.query({
				classId: selectedClass,
				semesterId: selectedSemester,
				academicYearId: selectedYear,
				includeRetakes,
			});

			if (!pvData.students || pvData.students.length === 0) return;

			const classData = classes?.find((c) => c.id === selectedClass);
			const semesterData = semesters?.find((s) => s.id === selectedSemester);
			const yearData = academicYears?.find((y) => y.id === selectedYear);
			const ues: Array<{
				code: string;
				name: string;
				credits: number;
				courses: Array<{
					name: string;
					code: string;
					coefficient: number;
				}>;
			}> = pvData.ues ?? [];

			// Build column layout: Rang | Matricule | Nom | [per UE: per EC(CC,EX,Moy) | Moy UE | Crédits | Décision] | Moy Gén | Total Crédits | Décision
			// First header row: UE names spanning their courses
			// Second header row: EC names/details

			// Count total columns per UE: each course has 3 cols (CC, EX, Moy) + 3 for UE summary (Avg, Credits, Decision)
			const fixedCols = 3; // Rang, Matricule, Nom
			const trailingCols = 3; // Moy Générale, Total Crédits, Décision

			const firstHeaderRow: ExcelCell[] = [
				t("admin.gradeExport.pv.table.rank"),
				t("admin.gradeExport.columns.registration"),
				t("admin.gradeExport.pv.table.fullName"),
			];
			const secondHeaderRow: ExcelCell[] = ["", "", ""];

			for (const ue of ues) {
				const courseCols = ue.courses.length * 3; // CC, EX, Moy per course
				const ueTotalCols = courseCols + 3; // + Moy UE, Crédits, Décision
				firstHeaderRow.push(
					`${ue.name} (${ue.code}) [${ue.credits} cr.]`,
					...Array(ueTotalCols - 1).fill(""),
				);
				for (const course of ue.courses) {
					secondHeaderRow.push(
						`${course.name} CC`,
						`${course.name} EX`,
						`Moy (×${course.coefficient})`,
					);
				}
				secondHeaderRow.push("Moy UE", "Crédits", "Décision");
			}

			firstHeaderRow.push(
				t("admin.gradeExport.pv.table.average"),
				"Total Crédits",
				"Décision",
			);
			secondHeaderRow.push("", "", "");

			// Data rows
			const tableRows: ExcelRow[] = [];
			const averages: number[] = [];

			for (const [index, student] of pvData.students.entries()) {
				const row: ExcelRow = [
					student.number ?? index + 1,
					student.registrationNumber,
					`${student.lastName} ${student.firstName}`,
				];

				for (const ueGrade of student.ueGrades) {
					for (const cg of ueGrade.courseGrades) {
						row.push(
							cg.cc !== null && cg.cc !== undefined
								? Number(Number(cg.cc).toFixed(2))
								: "",
							cg.ex !== null && cg.ex !== undefined
								? Number(Number(cg.ex).toFixed(2))
								: "",
							cg.average !== null && cg.average !== undefined
								? Number(Number(cg.average).toFixed(2))
								: "",
						);
					}
					row.push(
						ueGrade.average !== null && ueGrade.average !== undefined
							? Number(Number(ueGrade.average).toFixed(2))
							: "",
						ueGrade.credits ?? 0,
						ueGrade.decision ?? "",
					);
				}

				row.push(
					student.generalAverage !== null &&
						student.generalAverage !== undefined
						? Number(Number(student.generalAverage).toFixed(2))
						: "",
					student.totalCredits ?? 0,
					student.overallDecision ?? "",
				);

				tableRows.push(row);
				if (typeof student.generalAverage === "number") {
					averages.push(student.generalAverage);
				}
			}

			// Stats
			const totalStudents = pvData.students.length;
			const validated = pvData.students.filter(
				(s: any) => s.overallDecision === "ACQUIS",
			).length;
			const nonValidated = totalStudents - validated;
			const successRate = pvData.globalSuccessRate ?? 0;
			const promotionAverage =
				averages.length > 0
					? averages.reduce((sum, avg) => sum + avg, 0) / averages.length
					: null;

			const statsRows: ExcelRow[] = [
				[t("admin.gradeExport.pv.stats.title")],
				[t("admin.gradeExport.pv.stats.students"), totalStudents],
				[t("admin.gradeExport.pv.stats.validated"), validated],
				[t("admin.gradeExport.pv.stats.notValidated"), nonValidated],
				[t("admin.gradeExport.pv.stats.successRate"), `${successRate}%`],
				[
					t("admin.gradeExport.pv.stats.average"),
					promotionAverage !== null ? promotionAverage.toFixed(2) : "-",
				],
			];

			// Institution header
			const institutionHeader: ExcelRow[] = [];
			if (pvData.name_fr) {
				institutionHeader.push([pvData.name_fr]);
			}
			if (pvData.faculty_name_fr) {
				institutionHeader.push([pvData.faculty_name_fr]);
			}
			institutionHeader.push([""]);
			institutionHeader.push(["PROCÈS-VERBAL DES RÉSULTATS"]);
			institutionHeader.push([""]);

			if (classData || semesterData || yearData) {
				if (classData) institutionHeader.push([`Classe: ${classData.name}`]);
				if (classData?.program)
					institutionHeader.push([`Programme: ${classData.program.name}`]);
				if (pvData.semester)
					institutionHeader.push([`Semestre: ${pvData.semester}`]);
				if (pvData.academicYear)
					institutionHeader.push([`Année Académique: ${pvData.academicYear}`]);
				institutionHeader.push([""]);
			}

			const aoa: ExcelRow[] = [
				...institutionHeader,
				...statsRows,
				[""],
				[t("admin.gradeExport.pv.table.title")],
				firstHeaderRow,
				secondHeaderRow,
				...tableRows,
			];

			const ws = XLSX.utils.aoa_to_sheet(aoa);
			const headerRow1Index = institutionHeader.length + statsRows.length + 1;
			const headerRow2Index = headerRow1Index + 1;
			const merges: XLSX.Range[] = [];
			const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
			const totalDataCols = (secondHeaderRow as ExcelCell[]).length;

			// Merge fixed columns across both header rows
			for (const colIdx of [0, 1, 2]) {
				merges.push({
					s: { r: headerRow1Index, c: colIdx },
					e: { r: headerRow2Index, c: colIdx },
				});
			}

			// Merge UE header spans and trailing columns
			let colOffset = fixedCols;
			for (const ue of ues) {
				const ueCols = ue.courses.length * 3 + 3;
				merges.push({
					s: { r: headerRow1Index, c: colOffset },
					e: { r: headerRow1Index, c: colOffset + ueCols - 1 },
				});
				colOffset += ueCols;
			}
			// Merge trailing columns (Moy Gén, Total Crédits, Décision)
			for (let i = 0; i < trailingCols; i++) {
				merges.push({
					s: { r: headerRow1Index, c: colOffset + i },
					e: { r: headerRow2Index, c: colOffset + i },
				});
			}

			// Institution header merges and styling
			if (ws.A1) {
				ws.A1.s = {
					font: { bold: true, sz: 16 },
					alignment: { horizontal: "center", vertical: "center" },
				};
				merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } });
			}
			if (ws.A2) {
				ws.A2.s = {
					font: { bold: true, sz: 14 },
					alignment: { horizontal: "center", vertical: "center" },
				};
				merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: range.e.c } });
			}

			// Style document title and info rows
			for (let i = 0; i < institutionHeader.length; i++) {
				const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
				if (ws[cellRef] && ws[cellRef].v === "PROCÈS-VERBAL DES RÉSULTATS") {
					ws[cellRef].s = {
						font: { bold: true, sz: 18 },
						alignment: { horizontal: "center", vertical: "center" },
					};
					merges.push({ s: { r: i, c: 0 }, e: { r: i, c: range.e.c } });
				}
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

			// Stats styling
			const statsStartRow = institutionHeader.length;
			const statsTitleRef = XLSX.utils.encode_cell({ r: statsStartRow, c: 0 });
			if (ws[statsTitleRef]) {
				ws[statsTitleRef].s = {
					font: { bold: true, sz: 14 },
					fill: { fgColor: { rgb: "E7E6E6" } },
					alignment: { horizontal: "center", vertical: "center" },
				};
			}
			for (let i = 1; i < statsRows.length; i++) {
				const cellRef = XLSX.utils.encode_cell({ r: statsStartRow + i, c: 0 });
				if (ws[cellRef]) {
					ws[cellRef].s = { font: { bold: true } };
				}
			}

			// Table title
			const tableTitleRow = institutionHeader.length + statsRows.length + 1;
			const tableTitleRef = XLSX.utils.encode_cell({ r: tableTitleRow, c: 0 });
			if (ws[tableTitleRef]) {
				ws[tableTitleRef].s = {
					font: { bold: true, sz: 14 },
					fill: { fgColor: { rgb: "E7E6E6" } },
					alignment: { horizontal: "center", vertical: "center" },
				};
			}

			// Header row styling
			for (let c = 0; c <= range.e.c; c++) {
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

			// Data row styling
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
						if ((r - dataStartRow) % 2 === 1) {
							ws[cellRef].s.fill = { fgColor: { rgb: "F2F2F2" } };
						}
					}
				}
			}

			// Column widths
			ws["!cols"] = [
				{ wch: 6 }, // Rang
				{ wch: 14 }, // Matricule
				{ wch: 22 }, // Nom
				...Array(totalDataCols - fixedCols - trailingCols).fill({ wch: 8 }),
				{ wch: 10 }, // Moy Gén
				{ wch: 10 }, // Total Crédits
				{ wch: 12 }, // Décision
			];

			ws["!merges"] = merges;
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, t("admin.gradeExport.pv.sheetName"));
			const filename = buildFilename(t("admin.gradeExport.pv.filePrefix"));
			XLSX.writeFile(wb, filename);
		} catch (error) {
			console.error("Verbal report export error:", error);
			toast.error(
				error instanceof Error
					? error.message
					: t("admin.gradeExport.toast.verbalReportError", {
							defaultValue: "Verbal report export failed",
						}),
			);
		} finally {
			setExporting(null);
		}
	}, [
		buildFilename,
		includeRetakes,
		selectedClass,
		selectedSemester,
		selectedYear,
		t,
		classes,
		semesters,
		academicYears,
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
				const headerRows: ExcelRow[] = [];

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

				// Sort students alphabetically
				const sortedStudents = [...students].sort(
					(a, b) =>
						a.last_name.localeCompare(b.last_name) ||
						a.first_name.localeCompare(b.first_name),
				);

				const exportData = sortedStudents.map((student) => {
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
				if (ws.A1) {
					ws.A1.s = {
						font: { bold: true, sz: 16 },
						alignment: { horizontal: "center" },
					};
					merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } });
				}
				if (ws.A2) {
					ws.A2.s = {
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
							merges.push({
								s: { r: i, c: 0 },
								e: { r: i, c: 3 },
							});
						} else if (value.includes(":")) {
							ws[cellRef].s = { font: { bold: true } };
						}
					}
				}
				const headerRowIndex = headerRows.length;
				for (let c = 0; c <= 3; c++) {
					const cellRef = XLSX.utils.encode_cell({
						r: headerRowIndex,
						c,
					});
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
								ws[cellRef].s.fill = {
									fgColor: { rgb: "F2F2F2" },
								};
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
				toast.error(
					error instanceof Error
						? error.message
						: t("admin.gradeExport.toast.examExportError", {
								defaultValue: "Exam export failed",
							}),
				);
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
				includeRetakes,
			});
			setPreviewHtml(html);
			setPreviewTitle(
				includeRetakes
					? "Prévisualisation - Procès-Verbal (avec rattrapages)"
					: "Prévisualisation - Procès-Verbal (sans rattrapages)",
			);
			setShowPreview(true);
		} catch (error) {
			console.error("PV preview error:", error);
			toast.error(
				error instanceof Error
					? error.message
					: t("admin.gradeExport.toast.pvPreviewError", {
							defaultValue: "Could not generate PV preview",
						}),
			);
		} finally {
			setExporting(null);
		}
	}, [selectedClass, selectedSemester, selectedYear, includeRetakes, t]);

	const handleGeneratePV = useCallback(async () => {
		if (!selectedClass || !selectedSemester || !selectedYear) return;
		setExporting("generate-pv");
		try {
			const result = await trpcClient.exports.generatePV.mutate({
				classId: selectedClass,
				semesterId: selectedSemester,
				academicYearId: selectedYear,
				format: "pdf",
				includeRetakes,
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
			toast.error(
				error instanceof Error
					? error.message
					: t("admin.gradeExport.toast.pvGenerateError", {
							defaultValue: "PV generation failed",
						}),
			);
		} finally {
			setExporting(null);
		}
	}, [selectedClass, selectedSemester, selectedYear, includeRetakes, t]);

	const handlePreviewEvaluation = useCallback(
		async (examId: string) => {
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
				toast.error(
					error instanceof Error
						? error.message
						: t("admin.gradeExport.toast.evaluationPreviewError", {
								defaultValue: "Could not generate evaluation preview",
							}),
				);
			} finally {
				setExporting(null);
			}
		},
		[t],
	);

	const handleGenerateEvaluation = useCallback(
		async (examId: string) => {
			setExporting(`generate-eval-${examId}`);
			try {
				const result = await trpcClient.exports.generateEvaluation.mutate({
					examId,
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
				console.error("Evaluation generation error:", error);
				toast.error(
					error instanceof Error
						? error.message
						: t("admin.gradeExport.toast.evaluationGenerateError", {
								defaultValue: "Evaluation generation failed",
							}),
				);
			} finally {
				setExporting(null);
			}
		},
		[t],
	);

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
				toast.error(
					error instanceof Error
						? error.message
						: t("admin.gradeExport.toast.uePreviewError", {
								defaultValue: "Could not generate UE preview",
							}),
				);
			} finally {
				setExporting(null);
			}
		},
		[selectedClass, selectedSemester, selectedYear, t],
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
				toast.error(
					error instanceof Error
						? error.message
						: t("admin.gradeExport.toast.ueGenerateError", {
								defaultValue: "UE generation failed",
							}),
				);
			} finally {
				setExporting(null);
			}
		},
		[selectedClass, selectedSemester, selectedYear, t],
	);

	// EC preview — calls exports.previewEc with the class_course context.
	// Eligibility (sum of percentages = 100%) is enforced server-side; if
	// the EC isn't fully evaluated, the toast surfaces the precise message.
	const handlePreviewEc = useCallback(
		async (classCourseId: string) => {
			if (!selectedClass) return;
			setExporting(`preview-ec-${classCourseId}`);
			try {
				const html = await trpcClient.exports.previewEc.query({
					classCourseId,
					classId: selectedClass,
					...(selectedSemester ? { semesterId: selectedSemester } : {}),
					...(selectedYear ? { academicYearId: selectedYear } : {}),
				});
				setPreviewHtml(html);
				setPreviewTitle("Prévisualisation - Publication EC");
				setShowPreview(true);
			} catch (error) {
				console.error("EC preview error:", error);
				toast.error(
					error instanceof Error
						? error.message
						: t("admin.gradeExport.toast.ecPreviewError", {
								defaultValue: "Could not generate EC preview",
							}),
				);
			} finally {
				setExporting(null);
			}
		},
		[selectedClass, selectedSemester, selectedYear, t],
	);

	// EC PDF generation — same eligibility rule as the preview. On success
	// the PDF blob is materialized and downloaded with the server-suggested
	// filename (EC_<date>.pdf).
	const handleGenerateEc = useCallback(
		async (classCourseId: string) => {
			if (!selectedClass) return;
			setExporting(`generate-ec-${classCourseId}`);
			try {
				const result = await trpcClient.exports.generateEc.mutate({
					classCourseId,
					classId: selectedClass,
					...(selectedSemester ? { semesterId: selectedSemester } : {}),
					...(selectedYear ? { academicYearId: selectedYear } : {}),
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
			} catch (error) {
				console.error("EC generation error:", error);
				toast.error(
					error instanceof Error
						? error.message
						: t("admin.gradeExport.toast.ecGenerateError", {
								defaultValue: "EC generation failed",
							}),
				);
			} finally {
				setExporting(null);
			}
		},
		[selectedClass, selectedSemester, selectedYear, t],
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
			toast.error(
				error instanceof Error
					? error.message
					: t("admin.gradeExport.toast.bulkEvaluationsError", {
							defaultValue: "Bulk evaluations generation failed",
						}),
			);
		} finally {
			setExporting(null);
		}
	}, [selectedExamDetails, t]);

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
			toast.error(
				error instanceof Error
					? error.message
					: t("admin.gradeExport.toast.bulkUesError", {
							defaultValue: "Bulk UE generation failed",
						}),
			);
		} finally {
			setExporting(null);
		}
	}, [teachingUnits, selectedClass, selectedSemester, selectedYear, t]);

	// ─── Bulk / massive exports ─────────────────────────────────────────
	// Generate ZIPs server-side via the dedicated bulk endpoints. The scope
	// of "all classes" is implicit when no classId is set in the filters.
	// We pass the currently selected academic year / semester / class so the
	// user can scope the bulk to "this year only" or "this class only" by
	// selecting them, or leave them empty for institution-wide exports.
	const [bulkElapsed, setBulkElapsed] = useState<number>(0); // seconds
	const [bulkReport, setBulkReport] = useState<{
		kind: "Évaluations" | "EC" | "UE";
		total: number;
		succeeded: number;
		skipped: Array<{ id: string; reason: string }>;
		filename: string;
	} | null>(null);

	const buildBulkFilters = useCallback(
		(scope: "all" | "selected") => ({
			...(selectedYear ? { academicYearId: selectedYear } : {}),
			...(selectedSemester ? { semesterId: selectedSemester } : {}),
			...(scope === "selected" && selectedClass
				? { classId: selectedClass }
				: {}),
			skipIneligible: true,
		}),
		[selectedYear, selectedSemester, selectedClass],
	);

	const downloadBlob = useCallback(
		(data: string, filename: string, mime: string) => {
			const byteCharacters = atob(data);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: mime });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		},
		[],
	);

	// Start an elapsed-time counter while the bulk export is running. Returns
	// the cleanup function to stop the interval. tRPC mutations don't expose
	// progress, so the elapsed-time counter is the user-facing signal that
	// "things are happening" during long exports.
	const startBulkTimer = useCallback(() => {
		setBulkElapsed(0);
		const start = Date.now();
		const id = setInterval(() => {
			setBulkElapsed(Math.floor((Date.now() - start) / 1000));
		}, 1000);
		return () => clearInterval(id);
	}, []);

	const handleBulkExportEvaluations = useCallback(
		async (scope: "all" | "selected") => {
			setExporting(`bulk-eval-${scope}`);
			const stopTimer = startBulkTimer();
			try {
				const result = await trpcClient.exports.bulkExportEvaluations.mutate(
					buildBulkFilters(scope),
				);
				downloadBlob(result.data, result.filename, result.mimeType);
				setBulkReport({
					kind: "Évaluations",
					total: result.total,
					succeeded: result.succeeded,
					skipped: result.skipped,
					filename: result.filename,
				});
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Bulk export failed",
				);
			} finally {
				stopTimer();
				setExporting(null);
			}
		},
		[buildBulkFilters, downloadBlob, startBulkTimer],
	);

	const handleBulkExportEcs = useCallback(
		async (scope: "all" | "selected") => {
			setExporting(`bulk-ec-${scope}`);
			const stopTimer = startBulkTimer();
			try {
				const result = await trpcClient.exports.bulkExportEcs.mutate(
					buildBulkFilters(scope),
				);
				downloadBlob(result.data, result.filename, result.mimeType);
				setBulkReport({
					kind: "EC",
					total: result.total,
					succeeded: result.succeeded,
					skipped: result.skipped,
					filename: result.filename,
				});
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Bulk export failed",
				);
			} finally {
				stopTimer();
				setExporting(null);
			}
		},
		[buildBulkFilters, downloadBlob, startBulkTimer],
	);

	const handleBulkExportUes = useCallback(
		async (scope: "all" | "selected") => {
			setExporting(`bulk-ue-${scope}`);
			const stopTimer = startBulkTimer();
			try {
				const result = await trpcClient.exports.bulkExportUes.mutate(
					buildBulkFilters(scope),
				);
				downloadBlob(result.data, result.filename, result.mimeType);
				setBulkReport({
					kind: "UE",
					total: result.total,
					succeeded: result.succeeded,
					skipped: result.skipped,
					filename: result.filename,
				});
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Bulk export failed",
				);
			} finally {
				stopTimer();
				setExporting(null);
			}
		},
		[buildBulkFilters, downloadBlob, startBulkTimer],
	);

	const pvReady = !!selectedClass && !!selectedSemester && !!selectedYear;

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h2 className="font-semibold text-foreground text-xl">
					{t("admin.gradeExport.title")}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t("admin.gradeExport.subtitle")}
				</p>
			</div>

			{/* ─── Étape 1 — Contexte ───────────────────────────────────────── */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-3 text-base">
						<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
							1
						</span>
						Contexte
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>{t("admin.gradeExport.filters.academicYear")}</Label>
						<AcademicYearSelect
							value={selectedYear || null}
							onChange={(value) => {
								setSelectedYear(value);
								setSelectedClass("");
								setSelectedExams([]);
								savePrefs({ year: value, class: "" });
							}}
							placeholder={t(
								"admin.gradeExport.filters.academicYearPlaceholder",
							)}
						/>
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
								savePrefs({ class: value });
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

			{/* ─── Étape 2 — Sélection des évaluations ─────────────────────── */}
			{selectedClass &&
				(examsLoading || examsFetching ? (
					<Card>
						<CardContent className="flex flex-col items-center gap-3 py-10 text-center">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							<p className="font-medium text-sm">
								{t("admin.gradeExport.exams.loadingTitle", {
									defaultValue: "Chargement des évaluations…",
								})}
							</p>
							<p className="text-muted-foreground text-xs">
								{t("admin.gradeExport.exams.loadingDescription", {
									defaultValue:
										"On récupère tous les examens et leurs cours pour cette classe.",
								})}
							</p>
						</CardContent>
					</Card>
				) : exams && exams.length > 0 ? (
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<CardTitle className="flex items-center gap-3 text-base">
										<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
											2
										</span>
										{t("admin.gradeExport.exams.title")}
									</CardTitle>
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
							<div className="flex gap-3">
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
									onValueChange={(value: any) => {
										setSortBy(value);
										savePrefs({ sortBy: value });
									}}
								>
									<SelectTrigger className="w-44">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="course">Par matière</SelectItem>
										<SelectItem value="date">Par date</SelectItem>
										<SelectItem value="type">Par type</SelectItem>
									</SelectContent>
								</Select>
							</div>

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
																	<div className="font-medium text-sm">
																		{exam.name} • {exam.type}
																	</div>
																	<div className="text-muted-foreground text-xs">
																		{format(new Date(exam.date), "dd MMM yyyy")}{" "}
																		• {exam.percentage}%
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
								<p className="py-6 text-center text-muted-foreground text-sm">
									Aucune évaluation trouvée pour &ldquo;{searchQuery}&rdquo;
								</p>
							)}
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardContent className="flex flex-col items-center gap-2 py-10 text-center">
							<FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
							<p className="font-medium text-sm">
								{t("admin.gradeExport.exams.emptyTitle")}
							</p>
							<p className="text-muted-foreground text-xs">
								{t("admin.gradeExport.exams.emptyDescription")}
							</p>
						</CardContent>
					</Card>
				))}

			{/* ─── Étape 3 — Exports ────────────────────────────────────────── */}
			{selectedClass && (
				<div className="space-y-4">
					{/* Relevé de notes Excel */}
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between gap-4">
								<div>
									<CardTitle className="flex items-center gap-3 text-base">
										<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
											3
										</span>
										<FileSpreadsheet className="h-4 w-4" />
										{t("admin.gradeExport.actions.combinedLabel")}
									</CardTitle>
									<CardDescription className="mt-1">
										Export Excel combiné avec la moyenne par cours pour les
										évaluations sélectionnées
									</CardDescription>
								</div>
								{!hasExamSelection && (
									<span className="shrink-0 rounded-md bg-muted px-2 py-1 text-muted-foreground text-xs">
										Sélectionnez des évaluations
									</span>
								)}
							</div>
						</CardHeader>
						<CardContent>
							<Button
								type="button"
								onClick={handleCombinedExport}
								disabled={disablePrimaryExports}
							>
								{exporting === "combined" ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Download className="mr-2 h-4 w-4" />
								)}
								{t("admin.gradeExport.actions.combinedExport")}
							</Button>
						</CardContent>
					</Card>

					{/* Procès-Verbal (Excel + PDF) */}
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between gap-4">
								<div>
									<CardTitle className="flex items-center gap-3 text-base">
										<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary text-xs">
											3
										</span>
										<FileText className="h-4 w-4" />
										Procès-Verbal
									</CardTitle>
									<CardDescription className="mt-1">
										PV complet avec toutes les UEs, moyennes et décisions
									</CardDescription>
								</div>
								{!pvReady && (
									<span className="shrink-0 rounded-md bg-muted px-2 py-1 text-muted-foreground text-xs">
										Sélectionnez un semestre
									</span>
								)}
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor={semesterId}>Semestre</Label>
								<SemesterSelect
									value={selectedSemester || null}
									onChange={(v) => {
										setSelectedSemester(v ?? "");
										savePrefs({ semester: v ?? "" });
									}}
									placeholder="Sélectionner un semestre"
								/>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox
									id="include-retakes"
									checked={includeRetakes}
									onCheckedChange={(checked) => {
										setIncludeRetakes(checked === true);
										savePrefs({ includeRetakes: checked === true });
									}}
								/>
								<Label
									htmlFor="include-retakes"
									className="cursor-pointer font-normal text-sm"
								>
									Inclure les notes de rattrapage
								</Label>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={handleVerbalReportExport}
									disabled={!pvReady || isBusy}
								>
									{exporting === "pv" ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<FileSpreadsheet className="mr-2 h-4 w-4" />
									)}
									{t("admin.gradeExport.actions.pvExport")}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={handlePreviewPV}
									disabled={!pvReady || isBusy}
								>
									{exporting === "preview-pv" ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Eye className="mr-2 h-4 w-4" />
									)}
									Prévisualiser PDF
								</Button>
								<Button
									type="button"
									onClick={handleGeneratePV}
									disabled={!pvReady || isBusy}
								>
									{exporting === "generate-pv" ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<FileText className="mr-2 h-4 w-4" />
									)}
									Générer PDF
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Par évaluation */}
					{hasExamSelection && (
						<Card>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="text-base">
											Par évaluation{" "}
											<Badge variant="secondary" className="ml-1">
												{selectedExamDetails.length}
											</Badge>
										</CardTitle>
										<CardDescription className="mt-1">
											Export individuel par évaluation sélectionnée
										</CardDescription>
									</div>
									<Button
										type="button"
										size="sm"
										onClick={handleBulkGenerateEvaluations}
										disabled={disableExamExports}
									>
										{exporting === "bulk-evaluations" ? (
											<Loader2 className="mr-1 h-3 w-3 animate-spin" />
										) : (
											<Download className="mr-1 h-3 w-3" />
										)}
										Tout télécharger PDF
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<div className="overflow-hidden rounded-md border">
									<table className="w-full text-sm">
										<thead className="bg-muted/50">
											<tr>
												<th className="px-4 py-2 text-left font-medium">
													Cours
												</th>
												<th className="px-4 py-2 text-left font-medium">
													Type
												</th>
												<th className="px-4 py-2 text-left font-medium">
													Date
												</th>
												<th className="px-4 py-2 text-right font-medium">
													Excel
												</th>
												<th className="px-4 py-2 text-right font-medium">
													PDF
												</th>
											</tr>
										</thead>
										<tbody className="divide-y">
											{selectedExamDetails.map((exam) => (
												<tr key={exam.id} className="hover:bg-muted/30">
													<td className="px-4 py-2">
														<span className="font-medium">
															{exam.courseName}
														</span>
														{exam.courseCode && (
															<span className="ml-1 text-muted-foreground text-xs">
																({exam.courseCode})
															</span>
														)}
													</td>
													<td className="px-4 py-2 text-muted-foreground">
														{exam.type}
													</td>
													<td className="px-4 py-2 text-muted-foreground">
														{format(new Date(exam.date), "dd MMM yyyy")}
													</td>
													<td className="px-4 py-2 text-right">
														<Button
															type="button"
															variant="outline"
															size="sm"
															disabled={disableExamExports}
															onClick={() => handleExamExport(exam)}
														>
															{exporting === exam.id ? (
																<Loader2 className="h-3 w-3 animate-spin" />
															) : (
																<Download className="h-3 w-3" />
															)}
														</Button>
													</td>
													<td className="px-4 py-2 text-right">
														<div className="flex justify-end gap-1">
															<Button
																type="button"
																variant="outline"
																size="sm"
																disabled={disableExamExports}
																onClick={() => handlePreviewEvaluation(exam.id)}
															>
																{exporting === `preview-eval-${exam.id}` ? (
																	<Loader2 className="h-3 w-3 animate-spin" />
																) : (
																	<Eye className="h-3 w-3" />
																)}
															</Button>
															<Button
																type="button"
																size="sm"
																disabled={disableExamExports}
																onClick={() =>
																	handleGenerateEvaluation(exam.id)
																}
															>
																{exporting === `generate-eval-${exam.id}` ? (
																	<Loader2 className="h-3 w-3 animate-spin" />
																) : (
																	<Download className="h-3 w-3" />
																)}
															</Button>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Par EC — one row per class_course of the selected class.
					    Eligibility (sum of percentages = 100%) is enforced server-side.
					    If you see "EC weights total X%, expected 100%", finish wiring
					    the EC's exams in /admin/exam-scheduler. */}
					{classCoursesList && classCoursesList.length > 0 && (
						<Card>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="text-base">
											Par EC{" "}
											<Badge variant="secondary" className="ml-1">
												{classCoursesList.length}
											</Badge>
										</CardTitle>
										<CardDescription className="mt-1">
											Publication PDF par Élément Constitutif — agrège toutes
											les évaluations (CC + TP + Examen) avec moyenne EC.
											Nécessite que la somme des pondérations des examens de
											l&apos;EC soit à 100%.
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead className="bg-muted/40">
											<tr>
												<th className="px-4 py-2 text-left font-medium">
													Code
												</th>
												<th className="px-4 py-2 text-left font-medium">
													Intitulé
												</th>
												<th className="px-4 py-2 text-right font-medium">
													Coef.
												</th>
												<th className="px-4 py-2 text-right font-medium">
													Actions
												</th>
											</tr>
										</thead>
										<tbody className="divide-y">
											{classCoursesList.map((cc) => (
												<tr key={cc.id} className="hover:bg-muted/30">
													<td className="px-4 py-2 font-mono text-muted-foreground text-xs">
														{cc.code}
													</td>
													<td className="px-4 py-2">
														<span className="font-medium">{cc.name}</span>
													</td>
													<td className="px-4 py-2 text-right text-muted-foreground">
														{cc.coefficient}
													</td>
													<td className="px-4 py-2 text-right">
														<div className="flex justify-end gap-1">
															<Button
																type="button"
																variant="outline"
																size="sm"
																disabled={!selectedClass || isBusy}
																onClick={() => handlePreviewEc(cc.id)}
															>
																{exporting === `preview-ec-${cc.id}` ? (
																	<Loader2 className="h-3 w-3 animate-spin" />
																) : (
																	<Eye className="h-3 w-3" />
																)}
															</Button>
															<Button
																type="button"
																size="sm"
																disabled={!selectedClass || isBusy}
																onClick={() => handleGenerateEc(cc.id)}
															>
																{exporting === `generate-ec-${cc.id}` ? (
																	<Loader2 className="h-3 w-3 animate-spin" />
																) : (
																	<Download className="h-3 w-3" />
																)}
															</Button>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Par UE */}
					{teachingUnits && teachingUnits.length > 0 && (
						<Card>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="text-base">
											Par Unité d&apos;Enseignement{" "}
											<Badge variant="secondary" className="ml-1">
												{teachingUnits.length}
											</Badge>
										</CardTitle>
										<CardDescription className="mt-1">
											Publication PDF par UE — nécessite un semestre sélectionné
										</CardDescription>
									</div>
									<Button
										type="button"
										size="sm"
										onClick={handleBulkGenerateUEs}
										disabled={!pvReady || isBusy}
									>
										{exporting === "bulk-ues" ? (
											<Loader2 className="mr-1 h-3 w-3 animate-spin" />
										) : (
											<Download className="mr-1 h-3 w-3" />
										)}
										Tout télécharger
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<div className="overflow-hidden rounded-md border">
									<table className="w-full text-sm">
										<thead className="bg-muted/50">
											<tr>
												<th className="px-4 py-2 text-left font-medium">
													Code
												</th>
												<th className="px-4 py-2 text-left font-medium">
													Nom de l&apos;UE
												</th>
												<th className="px-4 py-2 text-left font-medium">
													Crédits
												</th>
												<th className="px-4 py-2 text-right font-medium">
													Actions
												</th>
											</tr>
										</thead>
										<tbody className="divide-y">
											{teachingUnits.map((ue) => (
												<tr key={ue.id} className="hover:bg-muted/30">
													<td className="px-4 py-2 font-mono text-xs">
														{ue.code}
													</td>
													<td className="px-4 py-2 font-medium">{ue.name}</td>
													<td className="px-4 py-2 text-muted-foreground">
														{ue.credits} cr.
													</td>
													<td className="px-4 py-2 text-right">
														<div className="flex justify-end gap-1">
															<Button
																type="button"
																variant="outline"
																size="sm"
																disabled={!pvReady || isBusy}
																onClick={() => handlePreviewUE(ue.id)}
															>
																{exporting === `preview-ue-${ue.id}` ? (
																	<Loader2 className="h-3 w-3 animate-spin" />
																) : (
																	<Eye className="h-3 w-3" />
																)}
															</Button>
															<Button
																type="button"
																size="sm"
																disabled={!pvReady || isBusy}
																onClick={() => handleGenerateUE(ue.id)}
															>
																{exporting === `generate-ue-${ue.id}` ? (
																	<Loader2 className="h-3 w-3 animate-spin" />
																) : (
																	<Download className="h-3 w-3" />
																)}
															</Button>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{/* ─── Export massif ──────────────────────────────────────────────
			    Génère un ZIP côté serveur contenant tous les PDFs (Évaluations,
			    EC ou UE) classés par programme/classe. La portée est :
			      • « Toutes classes » → l'institution entière, filtrée par les
			        sélecteurs académie/semestre du haut de la page si renseignés.
			      • « Classe sélectionnée » → uniquement la classe choisie.
			    Les ECs/UEs non éligibles (pondérations ≠ 100%) sont skippés
			    avec un compte-rendu en toast. */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between gap-3">
						<div>
							<CardTitle className="flex items-center gap-2 text-base">
								<Package className="h-4 w-4" />
								Export massif (ZIP)
							</CardTitle>
							<CardDescription className="mt-1">
								Génère un fichier ZIP contenant tous les PDFs classés par
								programme et classe. Filtré par l&apos;année et le semestre
								sélectionnés en haut de page si renseignés.
							</CardDescription>
						</div>
						{exporting?.startsWith("bulk-") && (
							<div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-amber-900 text-xs dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
								<span className="font-medium">
									Génération en cours · {bulkElapsed}s
								</span>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-3 sm:grid-cols-3">
						<div className="rounded-md border p-3">
							<div className="font-medium text-sm">Évaluations</div>
							<p className="mt-1 text-muted-foreground text-xs">
								Une PDF par examen. Aucun check d&apos;éligibilité.
							</p>
							<div className="mt-3 flex flex-col gap-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={isBusy}
									onClick={() => handleBulkExportEvaluations("all")}
								>
									{exporting === "bulk-eval-all" ? (
										<Loader2 className="mr-1 h-3 w-3 animate-spin" />
									) : (
										<Download className="mr-1 h-3 w-3" />
									)}
									Toutes classes
								</Button>
								<Button
									type="button"
									size="sm"
									disabled={!selectedClass || isBusy}
									onClick={() => handleBulkExportEvaluations("selected")}
								>
									{exporting === "bulk-eval-selected" ? (
										<Loader2 className="mr-1 h-3 w-3 animate-spin" />
									) : (
										<Download className="mr-1 h-3 w-3" />
									)}
									Classe sélectionnée
								</Button>
							</div>
						</div>
						<div className="rounded-md border p-3">
							<div className="font-medium text-sm">
								EC (Éléments Constitutifs)
							</div>
							<p className="mt-1 text-muted-foreground text-xs">
								Une PDF par EC. Skip auto si pondérations ≠ 100%.
							</p>
							<div className="mt-3 flex flex-col gap-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={isBusy}
									onClick={() => handleBulkExportEcs("all")}
								>
									{exporting === "bulk-ec-all" ? (
										<Loader2 className="mr-1 h-3 w-3 animate-spin" />
									) : (
										<Download className="mr-1 h-3 w-3" />
									)}
									Toutes classes
								</Button>
								<Button
									type="button"
									size="sm"
									disabled={!selectedClass || isBusy}
									onClick={() => handleBulkExportEcs("selected")}
								>
									{exporting === "bulk-ec-selected" ? (
										<Loader2 className="mr-1 h-3 w-3 animate-spin" />
									) : (
										<Download className="mr-1 h-3 w-3" />
									)}
									Classe sélectionnée
								</Button>
							</div>
						</div>
						<div className="rounded-md border p-3">
							<div className="font-medium text-sm">
								UE (Unités d&apos;Enseignement)
							</div>
							<p className="mt-1 text-muted-foreground text-xs">
								Une PDF par UE × classe × semestre. Skip auto si UE incomplète.
							</p>
							<div className="mt-3 flex flex-col gap-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={isBusy}
									onClick={() => handleBulkExportUes("all")}
								>
									{exporting === "bulk-ue-all" ? (
										<Loader2 className="mr-1 h-3 w-3 animate-spin" />
									) : (
										<Download className="mr-1 h-3 w-3" />
									)}
									Toutes classes
								</Button>
								<Button
									type="button"
									size="sm"
									disabled={!selectedClass || isBusy}
									onClick={() => handleBulkExportUes("selected")}
								>
									{exporting === "bulk-ue-selected" ? (
										<Loader2 className="mr-1 h-3 w-3 animate-spin" />
									) : (
										<Download className="mr-1 h-3 w-3" />
									)}
									Classe sélectionnée
								</Button>
							</div>
						</div>
					</div>
					<p className="text-muted-foreground text-xs">
						⚠️ La génération massive peut prendre plusieurs minutes selon le
						volume (1 PDF ≈ 1-2s). Le serveur réutilise un seul navigateur
						Chromium pour accélérer le batch.
					</p>
				</CardContent>
			</Card>

			<Dialog open={showPreview} onOpenChange={setShowPreview}>
				<DialogContent className="max-h-[90vh] min-w-[80vw] overflow-auto">
					<DialogHeader>
						<DialogTitle>{previewTitle}</DialogTitle>
						<DialogDescription>
							Prévisualisation HTML avant génération PDF
						</DialogDescription>
					</DialogHeader>
					<div className="h-[80vh] w-full overflow-hidden rounded-md border bg-muted">
						<iframe
							title="preview"
							className="h-full w-full bg-card"
							sandbox="allow-same-origin"
							srcDoc={previewHtml}
						/>
					</div>
				</DialogContent>
			</Dialog>

			{/* Bulk export results modal — shown after each ZIP completes.
			    Lists succeeded count + every skipped item with its reason so
			    the user can see exactly what didn't make it into the archive
			    (typically ECs/UEs whose pondérations don't sum to 100%). */}
			<Dialog
				open={bulkReport !== null}
				onOpenChange={(open) => !open && setBulkReport(null)}
			>
				<DialogContent className="max-h-[85vh] min-w-[60vw] gap-4 overflow-auto p-6">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Files className="h-5 w-5" />
							Rapport d&apos;export — {bulkReport?.kind}
						</DialogTitle>
						<DialogDescription>
							ZIP téléchargé :{" "}
							<span className="font-mono text-xs">{bulkReport?.filename}</span>
						</DialogDescription>
					</DialogHeader>
					{bulkReport && (
						<div className="space-y-4">
							<div className="grid grid-cols-3 gap-3">
								<div className="rounded-md border p-3">
									<div className="text-muted-foreground text-xs">
										Total candidats
									</div>
									<div className="font-semibold text-2xl">
										{bulkReport.total}
									</div>
								</div>
								<div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-900/20">
									<div className="flex items-center gap-1 text-emerald-800 text-xs dark:text-emerald-300">
										<CheckCircle2 className="h-3.5 w-3.5" /> Générés
									</div>
									<div className="font-semibold text-2xl text-emerald-900 dark:text-emerald-200">
										{bulkReport.succeeded}
									</div>
								</div>
								<div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-900/20">
									<div className="flex items-center gap-1 text-amber-800 text-xs dark:text-amber-300">
										<AlertCircle className="h-3.5 w-3.5" /> Ignorés
									</div>
									<div className="font-semibold text-2xl text-amber-900 dark:text-amber-200">
										{bulkReport.skipped.length}
									</div>
								</div>
							</div>
							{bulkReport.skipped.length > 0 && (
								<div className="rounded-md border">
									<div className="border-b bg-muted/40 px-4 py-2 font-medium text-sm">
										Détail des éléments ignorés
									</div>
									<div className="max-h-[40vh] overflow-auto">
										<table className="w-full text-sm">
											<thead className="sticky top-0 bg-muted/40 text-xs">
												<tr>
													<th className="px-4 py-2 text-left font-medium">
														ID
													</th>
													<th className="px-4 py-2 text-left font-medium">
														Raison
													</th>
												</tr>
											</thead>
											<tbody className="divide-y">
												{bulkReport.skipped.map((s, i) => (
													<tr
														key={`${s.id}-${i}`}
														className="hover:bg-muted/30"
													>
														<td className="px-4 py-2 font-mono text-xs">
															{s.id}
														</td>
														<td className="px-4 py-2 text-amber-800 dark:text-amber-300">
															{s.reason}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

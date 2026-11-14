import { useTranslation } from "react-i18next";
import { trpcClient } from "@/utils/trpc";
import { exportExamGradesExcel } from "../services/exam-grades-excel";
import { buildExportFilename, slugify } from "../services/export-header";
import { fetchStudentsWithGrades } from "../services/student-grades";
import { exportTranscriptExcel } from "../services/transcript-excel";
import { exportVerbalReportExcel } from "../services/verbal-report-excel";
import type { ExamItem } from "../types";
import type { ExportFilters, ExportTask } from "./use-export-task";
import type { GradeExportData } from "./use-grade-export-data";

/** Excel exports built in the browser: transcript, verbal report, one exam. */
export function useGradeExcelExports(
	{
		selectedYear,
		selectedClass,
		selectedSemester,
		includeRetakes,
	}: ExportFilters,
	{ classes, semesters, academicYears, exportConfig }: GradeExportData,
	selectedExams: string[],
	{ run }: ExportTask,
) {
	const { t } = useTranslation();

	const classData = classes?.find((c) => c.id === selectedClass);
	const semester = semesters?.find((s) => s.id === selectedSemester);
	const year = academicYears?.find((y) => y.id === selectedYear);
	const context = { classData, semester, year };

	const buildFilename = (prefix: string, suffix?: string) =>
		buildExportFilename(
			prefix,
			classData?.name ?? t("admin.gradeExport.unknownClass"),
			suffix,
		);

	const exportTranscript = () => {
		if (!selectedClass || selectedExams.length === 0 || !exportConfig) return;
		return run(
			"combined",
			async () => {
				const students = await fetchStudentsWithGrades(selectedClass);
				if (students.length === 0) return;
				exportTranscriptExcel({
					students,
					selectedExams,
					config: exportConfig,
					context,
					filename: buildFilename(t("admin.gradeExport.filePrefix")),
					t,
				});
			},
			{
				log: "Export error",
				key: "admin.gradeExport.toast.exportError",
				defaultValue: "Export failed",
			},
		);
	};

	const exportVerbalReport = () => {
		if (!selectedClass || !selectedSemester || !selectedYear) return;
		return run(
			"pv",
			async () => {
				// Fetch structured PV data from backend (correct LMD computation)
				const pvData = await trpcClient.exports.getPVData.query({
					classId: selectedClass,
					semesterId: selectedSemester,
					academicYearId: selectedYear,
					includeRetakes,
				});
				if (!pvData.students || pvData.students.length === 0) return;
				exportVerbalReportExcel({
					pvData,
					classData,
					hasContext: Boolean(classData || semester || year),
					filename: buildFilename(t("admin.gradeExport.pv.filePrefix")),
					t,
				});
			},
			{
				log: "Verbal report export error",
				key: "admin.gradeExport.toast.verbalReportError",
				defaultValue: "Verbal report export failed",
			},
		);
	};

	const exportExam = (exam: ExamItem) => {
		if (!selectedClass || !exportConfig) return;
		return run(
			exam.id,
			async () => {
				const students = await fetchStudentsWithGrades(selectedClass);
				if (students.length === 0) return;
				const courseSegment = slugify(exam.courseCode ?? exam.courseName);
				exportExamGradesExcel({
					exam,
					students,
					config: exportConfig,
					context,
					filename: buildFilename(
						t("admin.gradeExport.actions.examGroup.filePrefix"),
						`${courseSegment}-${slugify(exam.type)}`,
					),
					t,
				});
			},
			{
				log: "Exam export error",
				key: "admin.gradeExport.toast.examExportError",
				defaultValue: "Exam export failed",
			},
		);
	};

	return { exportTranscript, exportVerbalReport, exportExam };
}

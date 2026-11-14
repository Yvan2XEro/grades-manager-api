import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BulkZipExportCard } from "../components/bulk-zip-export-card";
import { EcExportsCard } from "../components/ec-exports-card";
import { ExamExportsCard } from "../components/exam-exports-card";
import { ExamSelectionCard } from "../components/exam-selection-card";
import { GradeExportContextCard } from "../components/grade-export-context-card";
import { TranscriptExportCard } from "../components/transcript-export-card";
import { UeExportsCard } from "../components/ue-exports-card";
import { VerbalReportCard } from "../components/verbal-report-card";
import { useBulkGradeExports } from "../hooks/use-bulk-grade-exports";
import { useExamSelection } from "../hooks/use-exam-selection";
import { useExportTask } from "../hooks/use-export-task";
import { useGradeExcelExports } from "../hooks/use-grade-excel-exports";
import { useGradeExportData } from "../hooks/use-grade-export-data";
import { useGradePdfExports } from "../hooks/use-grade-pdf-exports";
import { loadPrefs, savePrefs } from "../services/grade-export-prefs";

export default function GradeExport() {
	const { t } = useTranslation();
	const [prefs] = useState(loadPrefs);
	const [selectedYear, setSelectedYear] = useState<string>(prefs.year ?? "");
	const [selectedClass, setSelectedClass] = useState<string>(prefs.class ?? "");
	const [selectedSemester, setSelectedSemester] = useState<string>(
		prefs.semester ?? "",
	);
	const [includeRetakes, setIncludeRetakes] = useState<boolean>(
		prefs.includeRetakes ?? true,
	);
	const filters = {
		selectedYear,
		selectedClass,
		selectedSemester,
		includeRetakes,
	};

	const data = useGradeExportData(filters);
	const selection = useExamSelection(data.exams, prefs.sortBy ?? "course");
	const task = useExportTask();
	const excel = useGradeExcelExports(
		filters,
		data,
		selection.selectedExams,
		task,
	);
	const pdf = useGradePdfExports(filters, task);
	const bulk = useBulkGradeExports(filters, task);

	const { exporting, isBusy } = task;
	const hasExamSelection = selection.selectedExamDetails.length > 0;
	const disableExamExports = !selectedClass || isBusy;

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

			<GradeExportContextCard
				selectedYear={selectedYear}
				selectedClass={selectedClass}
				classes={data.classes}
				onYearChange={(value) => {
					setSelectedYear(value);
					setSelectedClass("");
					selection.deselectAll();
					savePrefs({ year: value, class: "" });
				}}
				onClassChange={(value) => {
					setSelectedClass(value);
					selection.deselectAll();
					savePrefs({ class: value });
				}}
			/>

			{selectedClass && (
				<ExamSelectionCard
					exams={data.exams}
					isLoading={data.examsLoading}
					selection={selection}
					onSortChange={(value) => {
						selection.setSortBy(value);
						savePrefs({ sortBy: value });
					}}
				/>
			)}

			{selectedClass && (
				<div className="space-y-4">
					<TranscriptExportCard
						exporting={exporting}
						hasExamSelection={hasExamSelection}
						disabled={disableExamExports || !hasExamSelection}
						onExport={excel.exportTranscript}
					/>

					<VerbalReportCard
						exporting={exporting}
						pvReady={pdf.pvReady}
						selectedSemester={selectedSemester}
						includeRetakes={includeRetakes}
						onSemesterChange={(value) => {
							setSelectedSemester(value);
							savePrefs({ semester: value });
						}}
						onIncludeRetakesChange={(value) => {
							setIncludeRetakes(value);
							savePrefs({ includeRetakes: value });
						}}
						onExportExcel={excel.exportVerbalReport}
						onPreview={pdf.previewPV}
						onGenerate={pdf.generatePV}
					/>

					{hasExamSelection && (
						<ExamExportsCard
							exams={selection.selectedExamDetails}
							exporting={exporting}
							disabled={disableExamExports}
							onDownloadAll={() =>
								pdf.generateEvaluations(selection.selectedExamDetails)
							}
							onExportExcel={excel.exportExam}
							onPreview={pdf.previewEvaluation}
							onGenerate={pdf.generateEvaluation}
						/>
					)}

					{data.classCoursesList && data.classCoursesList.length > 0 && (
						<EcExportsCard
							classCourses={data.classCoursesList}
							exporting={exporting}
							disabled={disableExamExports}
							onPreview={pdf.previewEc}
							onGenerate={pdf.generateEc}
						/>
					)}

					{data.teachingUnits && data.teachingUnits.length > 0 && (
						<UeExportsCard
							teachingUnits={data.teachingUnits}
							exporting={exporting}
							disabled={!pdf.pvReady || isBusy}
							onDownloadAll={() => pdf.generateUEs(data.teachingUnits)}
							onPreview={pdf.previewUE}
							onGenerate={pdf.generateUE}
						/>
					)}
				</div>
			)}

			<BulkZipExportCard
				exporting={exporting}
				bulkElapsed={bulk.bulkElapsed}
				hasClass={Boolean(selectedClass)}
				onExport={bulk.bulkExport}
			/>
		</div>
	);
}

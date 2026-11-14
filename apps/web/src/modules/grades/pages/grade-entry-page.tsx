import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CourseSelectCard } from "../components/course-select-card";
import { ExamDelegatesCard } from "../components/exam-delegates-card";
import { ExamToolbarCard } from "../components/exam-toolbar-card";
import { GradeEntryHeader } from "../components/grade-entry-header";
import { GradeEntryTable } from "../components/grade-entry-table";
import { useGradeEntry } from "../hooks/use-grade-entry";
import { useGradeEntryForm } from "../hooks/use-grade-entry-form";
import { useLockExam } from "../hooks/use-grade-entry-mutations";

export default function GradeEntry() {
	const { t } = useTranslation();
	const entry = useGradeEntry();
	const form = useGradeEntryForm(entry);
	const lockExam = useLockExam(entry.selectedExam, entry.courseId);
	const { courseId, selectedExam, rosterStudents } = entry;

	if (entry.isInitialLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="h-10 w-10 text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<GradeEntryHeader courseInfo={entry.courseInfo} />

			<CourseSelectCard
				courseId={courseId}
				classCourses={entry.availableClassCourses}
				isLoading={entry.classCoursesLoading}
				onChange={entry.handleCourseChange}
			/>

			{selectedExam ? (
				<ExamDelegatesCard
					selectedExam={selectedExam}
					delegates={entry.delegates}
					isLoading={entry.delegateQuery.isLoading}
					canEditExam={entry.canEditExam}
					canManageDelegates={entry.canManageDelegates}
					viewerProfileId={entry.viewerProfileId}
					onChanged={() => entry.delegateQuery.refetch()}
				/>
			) : null}

			<ExamToolbarCard
				courseId={courseId}
				exams={entry.exams}
				selectedExam={selectedExam}
				selectedExamInfo={entry.selectedExamInfo}
				isExamLocked={entry.isExamLocked}
				canEditExam={entry.canEditExam}
				inputsDisabled={entry.inputsDisabled}
				hasStudents={rosterStudents.length > 0}
				onExamChange={form.handleExamChange}
				onExportTemplate={form.handleExportTemplate}
				onImportGrades={form.handleImportGrades}
				onLock={() => lockExam.mutate()}
				isLocking={lockExam.isPending}
			/>

			{selectedExam && rosterStudents.length > 0 ? (
				<GradeEntryTable
					selectedExam={selectedExam}
					students={rosterStudents}
					gradesByStudent={entry.gradesByStudent}
					inputsDisabled={entry.inputsDisabled}
					register={form.register}
					errors={form.errors}
					isSaving={form.isSaving}
					isLocking={lockExam.isPending}
					onSubmit={form.submitGrades}
				/>
			) : selectedExam ? (
				<Card className="text-center">
					<CardContent className="py-12">
						<AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
						<p className="mt-4 font-medium text-foreground text-lg">
							{t("teacher.gradeEntry.emptyStudents.title")}
						</p>
						<p className="text-muted-foreground text-xs">
							{t("teacher.gradeEntry.emptyStudents.description")}
						</p>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}

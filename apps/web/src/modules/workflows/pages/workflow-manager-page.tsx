import { useTranslation } from "react-i18next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { TeacherExamRow } from "../components/teacher-exam-row";
import { WorkflowManagerFilters } from "../components/workflow-manager-filters";
import { useWorkflowManager } from "../hooks/use-workflow-manager";

/** Teacher `/workflows`: submit exams for validation, follow their status. */
const WorkflowManager = () => {
	const { t } = useTranslation();
	const { examsQuery, exams, submitExam, ...filters } = useWorkflowManager();
	const { selectedClassCourse } = filters;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-foreground">
					{t("teacher.workflow.title", { defaultValue: "Exam workflow" })}
				</h1>
				<p className="text-muted-foreground">
					{t("teacher.workflow.subtitle", {
						defaultValue:
							"Submit exams for validation and monitor their status.",
					})}
				</p>
			</div>

			<WorkflowManagerFilters {...filters} />

			<Card>
				<CardHeader>
					<CardTitle>
						{t("teacher.workflow.title", { defaultValue: "Exam workflow" })}
					</CardTitle>
					<CardDescription>
						{t("teacher.workflow.subtitle", {
							defaultValue:
								"Submit exams for validation and monitor their status.",
						})}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{!selectedClassCourse ? (
						<p className="text-muted-foreground text-xs">
							{t("teacher.workflow.placeholder", {
								defaultValue: "Choose a class course to view exams.",
							})}
						</p>
					) : examsQuery.isLoading ? (
						<p className="text-muted-foreground text-xs">
							{t("common.loading", { defaultValue: "Loading..." })}
						</p>
					) : exams.length ? (
						<div className="space-y-3">
							{exams.map((exam) => (
								<TeacherExamRow
									key={exam.id}
									exam={exam}
									onSubmit={() => submitExam.mutate(exam.id)}
								/>
							))}
						</div>
					) : (
						<p className="text-muted-foreground text-xs">
							{t("teacher.workflow.empty", {
								defaultValue: "No exams for this class course.",
							})}
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default WorkflowManager;

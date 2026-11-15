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
				<h1 className="text-foreground">{t("teacher.workflow.title")}</h1>
				<p className="text-muted-foreground">
					{t("teacher.workflow.subtitle")}
				</p>
			</div>

			<WorkflowManagerFilters {...filters} />

			<Card>
				<CardHeader>
					<CardTitle>{t("teacher.workflow.title")}</CardTitle>
					<CardDescription>{t("teacher.workflow.subtitle")}</CardDescription>
				</CardHeader>
				<CardContent>
					{!selectedClassCourse ? (
						<p className="text-muted-foreground text-xs">
							{t("teacher.workflow.placeholder")}
						</p>
					) : examsQuery.isLoading ? (
						<p className="text-muted-foreground text-xs">
							{t("common.loading")}
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
							{t("teacher.workflow.empty")}
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default WorkflowManager;

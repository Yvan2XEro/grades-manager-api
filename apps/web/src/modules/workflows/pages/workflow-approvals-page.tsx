import { useTranslation } from "react-i18next";
import { EnrollmentWindowsPanel } from "../components/enrollment-windows-panel";
import { WorkflowExamQueue } from "../components/workflow-exam-queue";
import { WorkflowNotificationsPanel } from "../components/workflow-notifications-panel";
import { useWorkflowApprovals } from "../hooks/use-workflow-approvals";

/** Dean `/workflows`: approval queue, notifications and enrollment windows. */
const WorkflowApprovals = () => {
	const { t } = useTranslation();
	const workflow = useWorkflowApprovals();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-foreground">{t("dean.workflows.title")}</h1>
					<p className="text-muted-foreground">
						{t("dean.workflows.subtitle")}
					</p>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<WorkflowExamQueue workflow={workflow} />
				<WorkflowNotificationsPanel
					data={workflow.notifications}
					page={workflow.notifPage}
					pageSize={workflow.notifPageSize}
					onPageChange={workflow.setNotifPage}
					onPageSizeChange={workflow.setNotifPageSize}
				/>
			</div>

			<EnrollmentWindowsPanel windows={workflow.windows} />
		</div>
	);
};

export default WorkflowApprovals;

import { Route } from "react-router";
import { RoleView } from "@/components/navigation/RoleView";
import ApprovalHistory from "./pages/approval-history-page";
import ExamApprovals from "./pages/exam-approvals-page";
import WorkflowApprovals from "./pages/workflow-approvals-page";
import WorkflowManager from "./pages/workflow-manager-page";

/** Grade approval workflows: deans approve, teachers follow their requests. */
export const workflowsRoutes = (
	<>
		<Route path="approvals" element={<ExamApprovals />} />
		<Route
			path="workflows"
			element={
				<RoleView
					fallback={<WorkflowApprovals />}
					teacher={<WorkflowManager />}
				/>
			}
		/>
		<Route path="history" element={<ApprovalHistory />} />
	</>
);

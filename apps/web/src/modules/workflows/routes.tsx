import { Route } from "react-router";
import { RoleView } from "@/components/navigation/RoleView";
import ApprovalHistory from "./ApprovalHistory";
import ExamApprovals from "./ExamApprovals";
import WorkflowApprovals from "./WorkflowApprovals";
import WorkflowManager from "./WorkflowManager";

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

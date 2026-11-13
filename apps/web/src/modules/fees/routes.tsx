import { Navigate, Route } from "react-router";
import FeeAssignmentDetail from "./FeeAssignmentDetail";
import FeeAssignmentsList from "./FeeAssignmentsList";
import FeeClearanceHub from "./FeeClearanceHub";
import FeeGatingSettings from "./FeeGatingSettings";
import FeeStructureAssignmentsTab from "./FeeStructureAssignmentsTab";
import FeeStructureDetail from "./FeeStructureDetail";
import FeeStructureDetailsTab from "./FeeStructureDetailsTab";
import FeeStructureImpactTab from "./FeeStructureImpactTab";
import FeeStructureInstallmentsTab from "./FeeStructureInstallmentsTab";
import FeeStructuresList from "./FeeStructuresList";
import StudentFeeStatus from "./StudentFeeStatus";
import StudentFinancialHistory from "./StudentFinancialHistory";

export const feesRoutes = (
	<>
		<Route path="fees" element={<StudentFeeStatus />} />
		<Route path="fee-clearance">
			<Route element={<FeeClearanceHub />}>
				<Route index element={<Navigate to="structures" replace />} />
				<Route path="structures" element={<FeeStructuresList />} />
				<Route path="assignments" element={<FeeAssignmentsList />} />
				<Route path="assignments/:id" element={<FeeAssignmentDetail />} />
				<Route
					path="students/:studentId/history"
					element={<StudentFinancialHistory />}
				/>
				<Route path="gating" element={<FeeGatingSettings />} />
			</Route>
			<Route path="structures/:id" element={<FeeStructureDetail />}>
				<Route index element={<Navigate to="details" replace />} />
				<Route path="details" element={<FeeStructureDetailsTab />} />
				<Route path="installments" element={<FeeStructureInstallmentsTab />} />
				<Route path="impact" element={<FeeStructureImpactTab />} />
				<Route path="assignments" element={<FeeStructureAssignmentsTab />} />
			</Route>
		</Route>
	</>
);

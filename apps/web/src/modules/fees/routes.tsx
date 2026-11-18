import { Navigate, Route } from "react-router";
import FeeAssignmentDetailPage from "./pages/fee-assignment-detail-page";
import FeeAssignmentsPage from "./pages/fee-assignments-page";
import FeeClearanceLayout from "./pages/fee-clearance-layout";
import FeeGatingSettingsPage from "./pages/fee-gating-settings-page";
import FeeStructureDetailAssignments from "./pages/fee-structure-detail/fee-structure-detail-assignments";
import FeeStructureDetailDetails from "./pages/fee-structure-detail/fee-structure-detail-details";
import FeeStructureDetailImpact from "./pages/fee-structure-detail/fee-structure-detail-impact";
import FeeStructureDetailInstallments from "./pages/fee-structure-detail/fee-structure-detail-installments";
import FeeStructureDetailLayout from "./pages/fee-structure-detail/fee-structure-detail-layout";
import FeeStructuresPage from "./pages/fee-structures-page";
import StudentFeeStatusPage from "./pages/student-fee-status-page";
import StudentFinancialHistoryPage from "./pages/student-financial-history-page";

export const feesRoutes = (
	<>
		<Route path="fees" element={<StudentFeeStatusPage />} />
		<Route path="fee-clearance">
			<Route element={<FeeClearanceLayout />}>
				<Route index element={<Navigate to="structures" replace />} />
				<Route path="structures" element={<FeeStructuresPage />} />
				<Route path="assignments" element={<FeeAssignmentsPage />} />
				<Route path="assignments/:id" element={<FeeAssignmentDetailPage />} />
				<Route
					path="students/:studentId/history"
					element={<StudentFinancialHistoryPage />}
				/>
				<Route path="gating" element={<FeeGatingSettingsPage />} />
			</Route>
			<Route path="structures/:id" element={<FeeStructureDetailLayout />}>
				<Route index element={<Navigate to="details" replace />} />
				<Route path="details" element={<FeeStructureDetailDetails />} />
				<Route
					path="installments"
					element={<FeeStructureDetailInstallments />}
				/>
				<Route path="impact" element={<FeeStructureDetailImpact />} />
				<Route path="assignments" element={<FeeStructureDetailAssignments />} />
			</Route>
		</Route>
	</>
);

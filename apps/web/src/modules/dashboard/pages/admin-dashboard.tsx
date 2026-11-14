import { motion } from "framer-motion";
import type React from "react";
import { ActionNeededAlerts } from "../components/admin/action-needed-alerts";
import { AdminDashboardHeader } from "../components/admin/admin-dashboard-header";
import { DashboardSkeleton } from "../components/admin/admin-dashboard-skeleton";
import { AdminKpiGrid } from "../components/admin/admin-kpi-grid";
import { EnrollmentStatusChart } from "../components/admin/enrollment-status-chart";
import { FeeSummaryCard } from "../components/admin/fee-summary-card";
import { ProgramEnrollmentChart } from "../components/admin/program-enrollment-chart";
import { QuickActionsCard } from "../components/admin/quick-actions-card";
import { useAdminDashboard } from "../hooks/use-admin-dashboard";

/** Home page of administrators: institution KPIs, charts and shortcuts. */
const AdminDashboard: React.FC = () => {
	const d = useAdminDashboard();

	if (d.isLoading) return <DashboardSkeleton />;

	const ov = d.overview;

	return (
		<div className="space-y-8">
			<AdminDashboardHeader
				activeYearName={d.activeYearName}
				yearId={d.yearId}
				onYearChange={d.setYearId}
			/>

			<ActionNeededAlerts
				examsPending={ov?.examsPending ?? 0}
				deliberationsOpen={ov?.deliberationsOpen ?? 0}
			/>

			<AdminKpiGrid ov={ov} enrollmentTotal={d.enrollmentTotal} />

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3, duration: 0.45, ease: "easeOut" }}
				className="grid gap-6 lg:grid-cols-5"
			>
				<ProgramEnrollmentChart data={d.byProgram} />
				<EnrollmentStatusChart data={d.byStatus} />
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5, duration: 0.45, ease: "easeOut" }}
				className="grid gap-6 lg:grid-cols-5"
			>
				<FeeSummaryCard ov={ov} />
				<QuickActionsCard />
			</motion.div>
		</div>
	);
};

export default AdminDashboard;

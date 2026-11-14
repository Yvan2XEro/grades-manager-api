import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useMarkNotificationRead } from "@/modules/notifications/hooks/use-my-notifications";
import { CreditProgressCard } from "../components/student/credit-progress-card";
import { DecisionsSection } from "../components/student/decisions-section";
import { EnrollmentStatusCard } from "../components/student/enrollment-status-card";
import { EnrollmentWindowBanner } from "../components/student/enrollment-window-banner";
import { FeeClearanceWidget } from "../components/student/fee-clearance-widget";
import { PendingActionsCard } from "../components/student/pending-actions-card";
import { PendingFeesBanner } from "../components/student/pending-fees-banner";
import { ProjectionCard } from "../components/student/projection-card";
import { StudentSummaryCards } from "../components/student/student-summary-cards";
import { TranscriptSection } from "../components/student/transcript-section";
import { UpcomingExamsStrip } from "../components/student/upcoming-exams-strip";
import { useStudentDashboard } from "../hooks/use-student-dashboard";
import type { ClassInfo, FeeAssignment } from "../types";

/** Student home page. */
const PerformanceDashboard = () => {
	const { t } = useTranslation();
	const d = useStudentDashboard();
	const markReadMut = useMarkNotificationRead();
	const { student, classInfo } = d;

	return (
		<div className="space-y-6">
			<PageHeader
				title={d.fullName || t("student.performance.title")}
				description={
					student?.registrationNumber
						? `N° ${student.registrationNumber}${classInfo ? ` · ${classInfo.name}` : ""}`
						: t("student.performance.subtitle")
				}
			/>

			{d.isLoading ? (
				<div className="flex h-48 items-center justify-center">
					<Spinner className="h-8 w-8 text-primary" />
				</div>
			) : (
				<motion.div
					variants={staggerContainer}
					initial="hidden"
					animate="visible"
					className="space-y-6"
				>
					{/* Pending actions — unread notifications */}
					{d.unreadNotifs.length > 0 && (
						<motion.div variants={staggerItem}>
							<PendingActionsCard
								items={d.unreadNotifs}
								onMarkRead={(id) => markReadMut.mutate(id)}
								isMarkingRead={markReadMut.isPending}
							/>
						</motion.div>
					)}

					{d.openWindow && (
						<motion.div variants={staggerItem}>
							<EnrollmentWindowBanner />
						</motion.div>
					)}

					{/* Fee clearance alert — shown at the top when not cleared */}
					{d.latestFeeAssignment && (
						<motion.div variants={staggerItem}>
							<FeeClearanceWidget
								assignments={[d.latestFeeAssignment as FeeAssignment]}
							/>
						</motion.div>
					)}

					{d.upcomingExams.length > 0 && (
						<motion.div variants={staggerItem}>
							<UpcomingExamsStrip exams={d.upcomingExams} />
						</motion.div>
					)}

					<StudentSummaryCards
						overallAvg={d.overallAvg}
						creditsEarned={d.creditsEarned}
						creditsRequired={d.creditsRequired}
						creditsInProgress={d.creditsInProgress}
						validatedUnits={d.validatedUnits}
						totalUnits={d.units.length}
					/>

					{classInfo && (
						<motion.div variants={staggerItem}>
							<EnrollmentStatusCard classInfo={classInfo as ClassInfo} />
						</motion.div>
					)}

					{d.creditsRequired > 0 && (
						<CreditProgressCard
							creditProgress={d.creditProgress}
							creditsEarned={d.creditsEarned}
							creditsRequired={d.creditsRequired}
						/>
					)}

					{!d.decisionsPending && <DecisionsSection decisions={d.decisions} />}

					{d.feeNotCleared && <PendingFeesBanner />}

					{d.projectionRate !== null && d.gradedUnitCount > 0 && (
						<ProjectionCard
							projectionRate={d.projectionRate}
							onTrackUnits={d.onTrackUnits}
							gradedUnitCount={d.gradedUnitCount}
						/>
					)}

					<TranscriptSection units={d.units} />
				</motion.div>
			)}
		</div>
	);
};

export default PerformanceDashboard;

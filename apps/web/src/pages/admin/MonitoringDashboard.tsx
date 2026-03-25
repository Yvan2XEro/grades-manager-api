import { Activity, Bell, CheckCircle2, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

const MonitoringDashboard = () => {
	const { t } = useTranslation();

	const metrics = [
		{
			label: t("admin.monitoring.gradeWindows"),
			value: "3",
			icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
		},
		{
			label: t("admin.monitoring.pendingAlerts"),
			value: "5",
			icon: <Bell className="h-5 w-5 text-amber-600" />,
		},
		{
			label: t("admin.monitoring.jobs"),
			value: t("admin.monitoring.jobsValue"),
			icon: <Activity className="h-5 w-5 text-blue-600" />,
		},
		{
			label: t("admin.monitoring.compliance"),
			value: t("admin.monitoring.complianceValue"),
			icon: <Shield className="h-5 w-5 text-purple-600" />,
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-foreground">{t("admin.monitoring.title")}</h1>
				<p className="text-muted-foreground">
					{t("admin.monitoring.subtitle")}
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{metrics.map((metric) => (
					<div
						key={metric.label}
						className="rounded-xl border bg-card p-4 shadow-sm"
					>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-xs">{metric.label}</p>
								<p className="font-semibold text-2xl text-foreground">
									{metric.value}
								</p>
							</div>
							<div className="rounded-full bg-muted p-2">{metric.icon}</div>
						</div>
					</div>
				))}
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<div className="rounded-xl border bg-card p-6 shadow-sm">
					<div className="mb-4 flex items-center justify-between">
						<div>
							<h2 className="font-semibold text-foreground text-lg">
								{t("admin.monitoring.workflows")}
							</h2>
							<p className="text-muted-foreground text-xs">
								{t("admin.monitoring.workflowsDescription")}
							</p>
						</div>
						<span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 text-xs">
							{t("admin.monitoring.healthy")}
						</span>
					</div>
					<div className="space-y-3">
						<div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
							<div>
								<p className="font-medium text-emerald-800">
									{t("admin.monitoring.gradeValidation")}
								</p>
								<p className="text-emerald-700 text-sm">
									{t("admin.monitoring.gradeValidationDesc")}
								</p>
							</div>
							<CheckCircle2 className="h-5 w-5 text-emerald-700" />
						</div>
						<div className="flex items-center justify-between rounded-lg bg-amber-50 p-3">
							<div>
								<p className="font-medium text-amber-800">
									{t("admin.monitoring.enrollments")}
								</p>
								<p className="text-amber-700 text-sm">
									{t("admin.monitoring.enrollmentsDesc")}
								</p>
							</div>
							<Bell className="h-5 w-5 text-amber-700" />
						</div>
					</div>
				</div>
				<div className="rounded-xl border bg-card p-6 shadow-sm">
					<h2 className="mb-2 font-semibold text-foreground text-lg">
						{t("admin.monitoring.backgroundJobs")}
					</h2>
					<p className="text-muted-foreground text-xs">
						{t("admin.monitoring.backgroundJobsDesc")}
					</p>
					<ul className="mt-4 space-y-2">
						<li className="flex items-center justify-between rounded-lg bg-muted p-3">
							<div>
								<p className="font-medium text-foreground">
									{t("admin.monitoring.jobExam")}
								</p>
								<p className="text-muted-foreground text-xs">
									{t("admin.monitoring.jobExamDesc")}
								</p>
							</div>
							<span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 text-xs">
								{t("admin.monitoring.active")}
							</span>
						</li>
						<li className="flex items-center justify-between rounded-lg bg-muted p-3">
							<div>
								<p className="font-medium text-foreground">
									{t("admin.monitoring.jobNotifications")}
								</p>
								<p className="text-muted-foreground text-xs">
									{t("admin.monitoring.jobNotificationsDesc")}
								</p>
							</div>
							<span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 text-xs">
								{t("admin.monitoring.active")}
							</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default MonitoringDashboard;

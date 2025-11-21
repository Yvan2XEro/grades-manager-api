import { AlertTriangle, BellRing } from "lucide-react";
import { useTranslation } from "react-i18next";

const AttendanceAlerts = () => {
	const { t } = useTranslation();

	const alerts = [
		{
			title: t("teacher.attendance.atRisk"),
			description: t("teacher.attendance.atRiskDesc"),
			tone: "warning" as const,
		},
		{
			title: t("teacher.attendance.lowEngagement"),
			description: t("teacher.attendance.lowEngagementDesc"),
			tone: "info" as const,
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl text-gray-900">
					{t("teacher.attendance.title")}
				</h1>
				<p className="text-gray-600">{t("teacher.attendance.subtitle")}</p>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<div className="rounded-xl border bg-white p-6 shadow-sm">
					<h2 className="font-semibold text-gray-900 text-lg">
						{t("teacher.attendance.openAlerts")}
					</h2>
					<div className="mt-4 space-y-3">
						{alerts.map((alert) => (
							<div
								key={alert.title}
								className="flex items-start space-x-3 rounded-lg bg-gray-50 p-4"
							>
								<div
									className={`rounded-full p-2 ${
										alert.tone === "warning"
											? "bg-amber-100 text-amber-700"
											: "bg-blue-100 text-blue-700"
									}`}
								>
									<AlertTriangle className="h-5 w-5" />
								</div>
								<div>
									<p className="font-medium text-gray-900">{alert.title}</p>
									<p className="text-gray-600 text-sm">{alert.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>
				<div className="rounded-xl border bg-white p-6 shadow-sm">
					<h2 className="font-semibold text-gray-900 text-lg">
						{t("teacher.attendance.broadcast")}
					</h2>
					<p className="text-gray-600 text-sm">
						{t("teacher.attendance.broadcastDesc")}
					</p>
					<div className="mt-4 rounded-lg bg-primary-50 p-4 text-primary-900">
						<div className="flex items-center space-x-3">
							<BellRing className="h-5 w-5" />
							<div>
								<p className="font-semibold">
									{t("teacher.attendance.latest")}
								</p>
								<p className="text-sm">{t("teacher.attendance.latestDesc")}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AttendanceAlerts;

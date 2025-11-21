import { ArrowRight, ClipboardCheck, Clock3, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

const WorkflowApprovals = () => {
	const { t } = useTranslation();

	const timeline = [
		{
			title: t("dean.workflows.submitted"),
			description: t("dean.workflows.submittedDesc"),
			icon: <ClipboardCheck className="h-5 w-5" />,
		},
		{
			title: t("dean.workflows.inReview"),
			description: t("dean.workflows.inReviewDesc"),
			icon: <Clock3 className="h-5 w-5" />,
		},
		{
			title: t("dean.workflows.locked"),
			description: t("dean.workflows.lockedDesc"),
			icon: <Lock className="h-5 w-5" />,
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl text-gray-900">
						{t("dean.workflows.title")}
					</h1>
					<p className="text-gray-600">{t("dean.workflows.subtitle")}</p>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<div className="rounded-xl border bg-white p-6 shadow-sm">
					<h2 className="font-semibold text-gray-900 text-lg">
						{t("dean.workflows.queue")}
					</h2>
					<p className="text-gray-600 text-sm">
						{t("dean.workflows.queueDesc")}
					</p>
					<div className="mt-4 space-y-3">
						{timeline.map((item) => (
							<div
								key={item.title}
								className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
							>
								<div className="flex items-center space-x-3">
									<div className="rounded-full bg-white p-2 text-primary-700">
										{item.icon}
									</div>
									<div>
										<p className="font-medium text-gray-900">{item.title}</p>
										<p className="text-gray-600 text-sm">{item.description}</p>
									</div>
								</div>
								<ArrowRight className="h-4 w-4 text-gray-400" />
							</div>
						))}
					</div>
				</div>
				<div className="rounded-xl border bg-white p-6 shadow-sm">
					<h2 className="font-semibold text-gray-900 text-lg">
						{t("dean.workflows.notifications")}
					</h2>
					<p className="text-gray-600 text-sm">
						{t("dean.workflows.notificationsDesc")}
					</p>
					<ul className="mt-4 space-y-2">
						<li className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
							<span className="font-medium text-blue-900">
								{t("dean.workflows.gradeValidations")}
							</span>
							<span className="text-blue-700 text-sm">
								{t("dean.workflows.realTime")}
							</span>
						</li>
						<li className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
							<span className="font-medium text-emerald-900">
								{t("dean.workflows.enrollmentWindows")}
							</span>
							<span className="text-emerald-700 text-sm">
								{t("dean.workflows.openClose")}
							</span>
						</li>
						<li className="flex items-center justify-between rounded-lg bg-amber-50 p-3">
							<span className="font-medium text-amber-900">
								{t("dean.workflows.alerts")}
							</span>
							<span className="text-amber-700 text-sm">
								{t("dean.workflows.escalations")}
							</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default WorkflowApprovals;

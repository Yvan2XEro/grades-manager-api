import { useQuery } from "@tanstack/react-query";
import { BarChart3, LineChart, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { useStore } from "../../store";
import { trpc } from "../../utils/trpc";

const PerformanceDashboard = () => {
	const { t } = useTranslation();
	const { user } = useStore();
	const studentId = user?.profileId ?? "";
	const summaryQuery = useQuery({
		...trpc.studentCreditLedger.summary.queryOptions({ studentId }),
		enabled: Boolean(studentId),
	});
	const promotionQuery = useQuery({
		...trpc.promotions.evaluateStudent.queryOptions({ studentId }),
		enabled: Boolean(studentId),
	});
	const studentProfileQuery = useQuery({
		...trpc.students.getById.queryOptions({ id: studentId }),
		enabled: Boolean(studentId),
	});
	const classId = studentProfileQuery.data?.class;
	const classQuery = useQuery({
		...trpc.classes.getById.queryOptions({ id: classId ?? "" }),
		enabled: Boolean(classId),
	});

	const ledger = summaryQuery.data;
	const progress = useMemo(() => {
		if (!ledger) return 0;
		if (!ledger.requiredCredits) return 0;
		return Math.min(100, (ledger.creditsEarned / ledger.requiredCredits) * 100);
	}, [ledger]);
	const classInfo = classQuery.data;
	const cycle = classInfo?.cycle;
	const cycleLevel = classInfo?.cycleLevel;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl text-gray-900">
					{t("student.performance.title")}
				</h1>
				<p className="text-gray-600">{t("student.performance.subtitle")}</p>
				{(cycle || cycleLevel) && (
					<div className="mt-3 flex flex-wrap gap-2">
						{cycle && (
							<Badge variant="outline">
								{t("student.performance.cycleBadge", {
									defaultValue: "Cycle: {{value}}",
									value: `${cycle.name}${cycle.code ? ` (${cycle.code})` : ""}`,
								})}
							</Badge>
						)}
						{cycleLevel && (
							<Badge variant="secondary">
								{t("student.performance.levelBadge", {
									defaultValue: "Level: {{value}}",
									value: `${cycleLevel.name}${cycleLevel.code ? ` (${cycleLevel.code})` : ""}`,
								})}
							</Badge>
						)}
					</div>
				)}
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<div className="rounded-xl border bg-white p-6 shadow-sm">
					<div className="mb-4 flex items-center space-x-3">
						<LineChart className="h-6 w-6 text-primary-700" />
						<div>
							<h2 className="font-semibold text-gray-900 text-lg">
								{t("student.performance.trendTitle")}
							</h2>
							<p className="text-gray-600 text-sm">
								{t("student.performance.trendSubtitle")}
							</p>
						</div>
					</div>
					<div className="space-y-2">
						<div className="rounded-lg bg-primary-50 p-4">
							<p className="font-medium text-primary-900 text-sm">
								{t("student.performance.creditsProgress", {
									defaultValue: "Credits earned",
								})}
							</p>
							<p className="font-semibold text-3xl text-primary-900">
								{ledger?.creditsEarned ?? "—"} /{" "}
								{ledger?.requiredCredits ?? "—"}
							</p>
							<p className="text-primary-900 text-xs">
								{t("student.performance.inProgress", {
									defaultValue: "In progress: {{value}} credits",
									value: ledger?.creditsInProgress ?? 0,
								})}
							</p>
							<div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-primary-100">
								<div
									className="h-3 rounded-full bg-primary-600 transition-all"
									style={{ width: `${progress}%` }}
								/>
							</div>
						</div>
						{promotionQuery.data && (
							<div
								className={`flex items-center gap-3 rounded-lg p-3 ${promotionQuery.data.eligible ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}
							>
								<ShieldCheck className="h-5 w-5" />
								<div>
									<p className="font-medium">
										{promotionQuery.data.eligible
											? t("student.performance.eligible", {
													defaultValue: "Eligible for next level 🎉",
												})
											: t("student.performance.notEligible", {
													defaultValue:
														"Keep going! You're almost ready for promotion.",
												})}
									</p>
									<p className="text-xs">
										{t("student.performance.ruleNotice", {
											defaultValue:
												"Evaluated with the promotion rules configured by your faculty.",
										})}
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
				<div className="rounded-xl border bg-white p-6 shadow-sm">
					<div className="mb-4 flex items-center space-x-3">
						<BarChart3 className="h-6 w-6 text-primary-700" />
						<div>
							<h2 className="font-semibold text-gray-900 text-lg">
								{t("student.performance.courseAverages")}
							</h2>
							<p className="text-gray-600 text-sm">
								{t("student.performance.courseSubtitle")}
							</p>
						</div>
					</div>
					<p className="rounded-lg border border-gray-200 border-dashed bg-gray-50 p-4 text-gray-600 text-sm">
						{t("student.performance.coursePlaceholder", {
							defaultValue:
								"Detailed course averages will appear once instructors publish grades for the current session.",
						})}
					</p>
				</div>
			</div>
		</div>
	);
};

export default PerformanceDashboard;

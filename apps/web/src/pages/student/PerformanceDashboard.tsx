import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, LineChart, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
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
		if (!ledger.requiredCredits || ledger.requiredCredits === 0) return 0;
		return Math.min(100, (ledger.creditsEarned / ledger.requiredCredits) * 100);
	}, [ledger]);
	const classInfo = classQuery.data;
	const cycle = classInfo?.cycle;
	const cycleLevel = classInfo?.cycleLevel;

	return (
		<div className="space-y-8">
			{/* Header */}
			<motion.div variants={fadeUp} initial="hidden" animate="visible">
				<h1 className="text-foreground">{t("student.performance.title")}</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					{t("student.performance.subtitle")}
				</p>
				{(cycle || cycleLevel) && (
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, duration: 0.35 }}
						className="mt-3 flex flex-wrap gap-2"
					>
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
					</motion.div>
				)}
			</motion.div>

			{/* Content Grid */}
			<motion.div
				variants={staggerContainer}
				initial="hidden"
				animate="visible"
				className="grid gap-6 lg:grid-cols-2"
			>
				{/* Credit Progress */}
				<motion.div variants={staggerItem}>
					<Card className="border-0 shadow-sm">
						<CardHeader className="pb-3">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
									<LineChart className="h-5 w-5 text-primary" />
								</div>
								<div>
									<CardTitle className="text-lg">
										{t("student.performance.trendTitle")}
									</CardTitle>
									<p className="text-muted-foreground text-xs">
										{t("student.performance.trendSubtitle")}
									</p>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="rounded-xl bg-primary/5 p-5">
								<p className="font-medium text-muted-foreground text-sm">
									{t("student.performance.creditsProgress", {
										defaultValue: "Credits earned",
									})}
								</p>
								<p className="mt-1 font-bold font-heading text-3xl text-foreground tabular-nums">
									{ledger?.creditsEarned ?? "\u2014"}{" "}
									<span className="font-normal text-lg text-muted-foreground">
										/ {ledger?.requiredCredits ?? "\u2014"}
									</span>
								</p>
								<p className="mt-1 text-muted-foreground text-xs">
									{t("student.performance.inProgress", {
										defaultValue: "In progress: {{value}} credits",
										value: ledger?.creditsInProgress ?? 0,
									})}
								</p>
								<div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-primary/10">
									<motion.div
										className="h-full rounded-full bg-primary"
										initial={{ width: 0 }}
										animate={{ width: `${progress}%` }}
										transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
									/>
								</div>
							</div>

							{ledger && ledger.requiredCredits > 0 && (
								<motion.div
									initial={{ opacity: 0, scale: 0.97 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: 0.6, duration: 0.35 }}
									className={`flex items-start gap-3 rounded-xl p-4 ${
										ledger.creditsEarned >= ledger.requiredCredits
											? "bg-emerald-50 text-emerald-900"
											: "bg-amber-50 text-amber-900"
									}`}
								>
									<ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
									<div>
										<p className="font-medium text-sm">
											{ledger.creditsEarned >= ledger.requiredCredits
												? t("student.performance.eligible", {
														defaultValue: "Eligible for next level",
													})
												: t("student.performance.notEligible", {
														defaultValue:
															"Keep going! You're almost ready for promotion.",
													})}
										</p>
										<p className="mt-0.5 text-xs opacity-75">
											{t("student.performance.ruleNotice", {
												defaultValue:
													"Evaluated with the promotion rules configured by your faculty.",
											})}
										</p>
									</div>
								</motion.div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Course Averages */}
				<motion.div variants={staggerItem}>
					<Card className="border-0 shadow-sm">
						<CardHeader className="pb-3">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
									<BarChart3 className="h-5 w-5 text-violet-600" />
								</div>
								<div>
									<CardTitle className="text-lg">
										{t("student.performance.courseAverages")}
									</CardTitle>
									<p className="text-muted-foreground text-xs">
										{t("student.performance.courseSubtitle")}
									</p>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col items-center gap-3 rounded-xl border border-border border-dashed bg-muted/30 p-8 text-center">
								<BarChart3 className="h-8 w-8 text-muted-foreground/40" />
								<p className="text-muted-foreground text-xs">
									{t("student.performance.coursePlaceholder", {
										defaultValue:
											"Detailed course averages will appear once instructors publish grades for the current session.",
									})}
								</p>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
};

export default PerformanceDashboard;

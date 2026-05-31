import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
	Award,
	BookOpen,
	ChevronDown,
	ChevronUp,
	GraduationCap,
	ShieldCheck,
	Star,
	TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { trpc, trpcClient } from "../../utils/trpc";

// ─── Deliberation Decision ────────────────────────────────────────────────────

const DECISION_CONFIG: Record<
	string,
	{ code: string; labelKey: string; isSuccess: boolean }
> = {
	admitted: {
		code: "ADM",
		labelKey: "deliberation.decision.admitted",
		isSuccess: true,
	},
	compensated: {
		code: "CMP",
		labelKey: "deliberation.decision.compensated",
		isSuccess: true,
	},
	deferred: {
		code: "AJ",
		labelKey: "deliberation.decision.deferred",
		isSuccess: false,
	},
	repeat: {
		code: "RED",
		labelKey: "deliberation.decision.repeat",
		isSuccess: false,
	},
	excluded: {
		code: "EXC",
		labelKey: "deliberation.decision.excluded",
		isSuccess: false,
	},
};

type DecisionResult = {
	finalDecision: string | null;
	academicYear: string | null;
	isOverridden: boolean;
	generalAverage: number | null;
};

function DeliberationDecisionCard({ decision }: { decision: DecisionResult }) {
	const { t } = useTranslation();
	if (!decision.finalDecision) return null;
	const cfg = DECISION_CONFIG[decision.finalDecision] ?? {
		code: "—",
		labelKey: "deliberation.decision.unknown",
		isSuccess: false,
	};
	const wrapCls = cfg.isSuccess
		? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
		: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30";
	const badgeCls = cfg.isSuccess
		? "bg-emerald-600 text-white"
		: "bg-amber-500 text-white";
	const iconCls = cfg.isSuccess
		? "text-emerald-600 dark:text-emerald-400"
		: "text-amber-500";

	return (
		<div
			className={`flex items-start gap-4 rounded-xl border p-4 shadow-sm ${wrapCls}`}
		>
			<div
				className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${badgeCls}`}
			>
				{cfg.code}
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					<span className="font-semibold text-foreground text-sm">
						{t("student.performance.deliberationDecision")}
					</span>
					{decision.academicYear && (
						<span className="text-muted-foreground text-xs">
							{decision.academicYear}
						</span>
					)}
					{decision.isOverridden && (
						<Badge variant="outline" className="text-xs">
							{t("deliberation.decision.overridden")}
						</Badge>
					)}
				</div>
				<p className="mt-0.5 text-muted-foreground text-xs">
					{t(cfg.labelKey)}
					{decision.generalAverage !== null && (
						<>
							{" "}
							· {t("student.performance.average")} :{" "}
							{decision.generalAverage.toFixed(2)}/20
						</>
					)}
				</p>
			</div>
			<Award className={`h-5 w-5 shrink-0 ${iconCls}`} />
		</div>
	);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function projectionBarColor(rate: number | null) {
	if (rate === null) return "bg-muted";
	if (rate >= 80) return "bg-emerald-500";
	if (rate >= 50) return "bg-violet-500";
	return "bg-amber-500";
}

// ─── Score Badge ──────────────────────────────────────────────────────────────

function scoreBadge(avg: number) {
	if (avg >= 16)
		return "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30";
	if (avg >= 12)
		return "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30";
	if (avg >= 10)
		return "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30";
	return "text-destructive bg-destructive/10";
}

// ─── UE Row ───────────────────────────────────────────────────────────────────

interface UEData {
	id: string;
	name: string;
	code: string;
	average: number;
	credits: number;
	courses: Array<{
		id: string;
		name: string;
		average: number;
		coefficient: number;
	}>;
}

function UERow({ unit }: { unit: UEData }) {
	const [open, setOpen] = useState(false);
	const validated = unit.average >= 10;

	return (
		<div className="overflow-hidden rounded-xl border bg-card shadow-sm">
			<button
				type="button"
				className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
				onClick={() => setOpen((p) => !p)}
			>
				<div
					className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${scoreBadge(unit.average)}`}
				>
					{unit.average.toFixed(1)}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="truncate font-semibold text-foreground text-sm">
							{unit.name}
						</span>
						{unit.code && (
							<span className="font-mono text-muted-foreground text-xs">
								{unit.code}
							</span>
						)}
						{validated ? (
							<Badge variant="success" className="text-xs">
								Validé
							</Badge>
						) : (
							<Badge variant="destructive" className="text-xs">
								Non validé
							</Badge>
						)}
					</div>
					<p className="mt-0.5 text-muted-foreground text-xs">
						{unit.credits} crédit{unit.credits !== 1 ? "s" : ""}
						{" · "}
						{unit.courses.length} cours
					</p>
				</div>
				<div className="shrink-0 text-muted-foreground">
					{open ? (
						<ChevronUp className="h-4 w-4" />
					) : (
						<ChevronDown className="h-4 w-4" />
					)}
				</div>
			</button>

			{open && (
				<div className="border-t bg-muted/10">
					{unit.courses.map((course) => (
						<div
							key={course.id}
							className="flex items-center justify-between border-b px-4 py-2.5 last:border-0"
						>
							<div>
								<p className="font-medium text-foreground text-sm">
									{course.name}
								</p>
								<p className="text-muted-foreground text-xs">
									Coeff. {course.coefficient}
								</p>
							</div>
							<span
								className={`inline-flex items-center rounded-md px-2.5 py-0.5 font-semibold text-sm tabular-nums ${scoreBadge(course.average)}`}
							>
								{course.average.toFixed(2)}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
	icon,
	label,
	value,
	sub,
	color,
}: {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
	sub?: string;
	color: string;
}) {
	return (
		<div className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm">
			<div
				className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}
			>
				{icon}
			</div>
			<div className="min-w-0">
				<p className="text-muted-foreground text-xs">{label}</p>
				<p className="mt-0.5 font-bold text-foreground text-xl tabular-nums">
					{value}
				</p>
				{sub && <p className="mt-0.5 text-muted-foreground text-xs">{sub}</p>}
			</div>
		</div>
	);
}

// ─── PerformanceDashboard ─────────────────────────────────────────────────────

const PerformanceDashboard = () => {
	const { t } = useTranslation();

	// students.me uses ctx.profile.id (domain_user_id) server-side — no auth user ID passed
	const studentQuery = useQuery(trpc.students.me.queryOptions());

	const studentId = studentQuery.data?.id ?? "";

	const transcriptQuery = useQuery({
		queryKey: ["student-transcript", studentId],
		queryFn: () => trpcClient.grades.consolidatedByStudent.query({ studentId }),
		enabled: Boolean(studentId),
	});

	const ledgerQuery = useQuery({
		...trpc.studentCreditLedger.summary.queryOptions({ studentId }),
		enabled: Boolean(studentId),
	});

	const classId = studentQuery.data?.class ?? "";
	const classQuery = useQuery({
		...trpc.classes.getById.queryOptions({ id: classId }),
		enabled: Boolean(classId),
	});

	const decisionsQuery = useQuery(trpc.workflows.myDecisions.queryOptions());

	const student = studentQuery.data;
	const transcript = transcriptQuery.data;
	const ledger = ledgerQuery.data;
	const classInfo = classQuery.data;
	const latestDecision = decisionsQuery.data?.[0] ?? null;

	const isLoading =
		studentQuery.isPending ||
		transcriptQuery.isPending ||
		ledgerQuery.isPending;

	const overallAvg = transcript?.overallAverage ?? 0;
	const creditsEarned = ledger?.creditsEarned ?? 0;
	const creditsRequired = ledger?.requiredCredits ?? 0;
	const creditsInProgress = ledger?.creditsInProgress ?? 0;
	const creditProgress =
		creditsRequired > 0
			? Math.min(100, (creditsEarned / creditsRequired) * 100)
			: 0;

	const fullName = student
		? `${student.firstName} ${student.lastName}`.trim()
		: "";

	const units = transcript?.units ?? [];
	const validatedUnits = units.filter((u) => u.average >= 10).length;

	// Projection : among UEs with at least one graded course, how many are on track?
	const gradedUnits = units.filter((u) => u.courses.some((c) => c.average > 0));
	const onTrackUnits = gradedUnits.filter((u) => u.average >= 10).length;
	const projectionRate =
		gradedUnits.length > 0
			? Math.round((onTrackUnits / gradedUnits.length) * 100)
			: null;

	return (
		<div className="space-y-6">
			<PageHeader
				title={fullName || t("student.performance.title")}
				description={
					student?.registrationNumber
						? `N° ${student.registrationNumber}${classInfo ? ` · ${classInfo.name}` : ""}`
						: t("student.performance.subtitle")
				}
			/>

			{isLoading ? (
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
					{/* Summary Cards */}
					<motion.div
						variants={staggerItem}
						className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
					>
						<SummaryCard
							icon={
								<Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
							}
							label={t("student.performance.generalAverage")}
							value={`${overallAvg.toFixed(2)} / 20`}
							sub={
								overallAvg >= 10
									? t("student.performance.aboveThreshold")
									: t("student.performance.belowThreshold")
							}
							color="bg-amber-50 dark:bg-amber-900/20"
						/>
						<SummaryCard
							icon={<GraduationCap className="h-5 w-5 text-primary" />}
							label={t("student.performance.creditsEarned")}
							value={`${creditsEarned} / ${creditsRequired || "?"}`}
							sub={
								creditsInProgress > 0
									? `${creditsInProgress} ${t("student.performance.inProgress")}`
									: undefined
							}
							color="bg-primary/10"
						/>
						<SummaryCard
							icon={
								<BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" />
							}
							label={t("student.performance.validatedUEs")}
							value={`${validatedUnits} / ${units.length}`}
							sub={t("student.performance.teachingUnits")}
							color="bg-violet-50 dark:bg-violet-900/20"
						/>
					</motion.div>

					{/* Credit Progress Bar */}
					{creditsRequired > 0 && (
						<motion.div
							variants={staggerItem}
							className="rounded-xl border bg-card p-4 shadow-sm"
						>
							<div className="mb-2 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<TrendingUp className="h-4 w-4 text-primary" />
									<span className="font-medium text-foreground text-sm">
										{t("student.performance.creditProgress")}
									</span>
								</div>
								<span className="font-semibold text-foreground text-sm tabular-nums">
									{creditProgress.toFixed(0)}%
								</span>
							</div>
							<div className="h-2.5 w-full overflow-hidden rounded-full bg-primary/10">
								<motion.div
									className="h-full rounded-full bg-primary"
									initial={{ width: 0 }}
									animate={{ width: `${creditProgress}%` }}
									transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
								/>
							</div>
							{creditsEarned >= creditsRequired && (
								<div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
									<ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
									<p className="font-medium text-xs">
										{t("student.performance.creditsEligible")}
									</p>
								</div>
							)}
						</motion.div>
					)}

					{/* Délibération decision */}
					{latestDecision?.finalDecision && (
						<motion.div variants={staggerItem}>
							<DeliberationDecisionCard decision={latestDecision} />
						</motion.div>
					)}

					{/* Projection fin d'année */}
					{projectionRate !== null && gradedUnits.length > 0 && (
						<motion.div
							variants={staggerItem}
							className="rounded-xl border bg-card p-4 shadow-sm"
						>
							<div className="mb-2 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
									<span className="font-medium text-foreground text-sm">
										{t("student.performance.projection")}
									</span>
								</div>
								<span className="font-semibold text-foreground text-sm tabular-nums">
									{onTrackUnits}/{gradedUnits.length} UE
								</span>
							</div>
							<div className="h-2 w-full overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/30">
								<motion.div
									className={`h-full rounded-full ${projectionBarColor(projectionRate)}`}
									initial={{ width: 0 }}
									animate={{ width: `${projectionRate}%` }}
									transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
								/>
							</div>
							<p className="mt-2 text-muted-foreground text-xs">
								{t("student.performance.projectionNote", {
									rate: projectionRate,
								})}
							</p>
						</motion.div>
					)}

					{/* Transcript */}
					<motion.div variants={staggerItem} className="space-y-3">
						<h2 className="flex items-center gap-2 font-semibold text-base text-foreground">
							<BookOpen className="h-4 w-4 text-muted-foreground" />
							{t("student.performance.transcript")}
							{units.length > 0 && (
								<span className="font-normal text-muted-foreground text-xs">
									· {units.length} UE{units.length > 1 ? "s" : ""}
								</span>
							)}
						</h2>

						{units.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
								<BookOpen className="h-8 w-8 text-muted-foreground/40" />
								<div>
									<p className="font-medium text-foreground text-sm">
										{t("student.performance.noGrades")}
									</p>
									<p className="mt-1 text-muted-foreground text-xs">
										{t("student.performance.noGradesHint")}
									</p>
								</div>
							</div>
						) : (
							<div className="space-y-2">
								{units.map((unit) => (
									<UERow key={unit.id} unit={unit} />
								))}
							</div>
						)}
					</motion.div>
				</motion.div>
			)}
		</div>
	);
};

export default PerformanceDashboard;

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
	AlertCircle,
	Award,
	Bell,
	BookOpen,
	Calendar,
	CalendarCheck,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	ChevronUp,
	CreditCard,
	GraduationCap,
	History,
	Hourglass,
	ServerCog,
	ShieldCheck,
	Star,
	TrendingUp,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { trpc, trpcClient } from "../../utils/trpc";

// ─── Pending Actions Card ─────────────────────────────────────────────────────

type TFn = (key: string, opts?: Record<string, unknown>) => string;

type NotifActionConfig = {
	icon: React.ReactNode;
	labelKey: string;
	subtitleFn?: (payload: Record<string, unknown>, t: TFn) => string;
	toFn?: (payload: Record<string, unknown>) => string | undefined;
	priority: "high" | "medium" | "low";
};

const NOTIF_ACTION_CONFIGS: Record<string, NotifActionConfig> = {
	"deliberation.published": {
		icon: <GraduationCap className="h-4 w-4 text-violet-600" />,
		labelKey: "student.pendingActions.resultsPublished",
		priority: "high",
		toFn: () => "/student",
	},
	"grade.approved": {
		icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
		labelKey: "student.pendingActions.gradesApproved",
		subtitleFn: (p) => String(p.examName ?? ""),
		priority: "medium",
		toFn: () => "/student",
	},
	"grade.rejected": {
		icon: <XCircle className="h-4 w-4 text-destructive" />,
		labelKey: "student.pendingActions.gradesRejected",
		subtitleFn: (p) => String(p.examName ?? ""),
		priority: "high",
		toFn: () => "/student",
	},
	"fee.payment_confirmed": {
		icon: <CreditCard className="h-4 w-4 text-emerald-600" />,
		labelKey: "student.pendingActions.paymentConfirmed",
		subtitleFn: (p) =>
			p.amount && p.currency
				? `${Number(p.amount).toLocaleString()} ${p.currency}`
				: "",
		priority: "low",
		toFn: () => "/student/fees",
	},
	"payment.pending": {
		icon: <CreditCard className="h-4 w-4 text-amber-500" />,
		labelKey: "student.pendingActions.paymentPending",
		priority: "high",
		toFn: () => "/student/fees",
	},
	"enrollment.window_open": {
		icon: <CalendarCheck className="h-4 w-4 text-emerald-600" />,
		labelKey: "student.pendingActions.enrollmentWindowOpen",
		priority: "high",
		toFn: () => "/student",
	},
	"batch_job.completed": {
		icon: <ServerCog className="h-4 w-4 text-emerald-600" />,
		labelKey: "student.pendingActions.jobCompleted",
		priority: "low",
	},
	"batch_job.failed": {
		icon: <ServerCog className="h-4 w-4 text-destructive" />,
		labelKey: "student.pendingActions.jobFailed",
		priority: "medium",
	},
};

function priorityDot(priority: "high" | "medium" | "low") {
	if (priority === "high") return "bg-red-500";
	if (priority === "medium") return "bg-amber-500";
	return "bg-blue-400";
}

type NotifItem = {
	id: string;
	type: string;
	readAt: string | Date | null;
	createdAt: string | Date;
	payload: unknown;
};

function PendingActionsCard({
	items,
	onMarkRead,
	isMarkingRead,
}: {
	items: NotifItem[];
	onMarkRead: (id: string) => void;
	isMarkingRead: boolean;
}) {
	const { t } = useTranslation();
	const MAX_SHOWN = 3;
	const shown = items.slice(0, MAX_SHOWN);

	if (items.length === 0) return null;

	return (
		<div className="rounded-xl border bg-card shadow-sm">
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<Bell className="h-4 w-4 text-primary" />
					<span className="font-semibold text-foreground text-sm">
						{t("student.pendingActions.title")}
					</span>
					<Badge className="h-5 bg-primary px-1.5 text-[10px] text-primary-foreground">
						{items.length}
					</Badge>
				</div>
				<Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
					<Link to="/notifications">
						{t("student.pendingActions.viewAll")}
						<ChevronRight className="ml-1 h-3 w-3" />
					</Link>
				</Button>
			</div>

			<ul className="divide-y">
				{shown.map((item) => {
					const cfg = NOTIF_ACTION_CONFIGS[item.type];
					const payload = (item.payload as Record<string, unknown>) ?? {};
					const subtitle = cfg?.subtitleFn ? cfg.subtitleFn(payload, t) : "";
					const to = cfg?.toFn ? cfg.toFn(payload) : undefined;
					const priority = cfg?.priority ?? "low";

					const inner = (
						<div className="flex min-w-0 flex-1 items-start gap-3">
							<span
								className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityDot(priority)}`}
							/>
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
								{cfg?.icon ?? (
									<Bell className="h-3.5 w-3.5 text-muted-foreground" />
								)}
							</div>
							<div className="min-w-0 flex-1">
								<p className="font-medium text-foreground text-xs">
									{t(
										(cfg?.labelKey ??
											"student.pendingActions.generic") as Parameters<
											typeof t
										>[0],
										{
											defaultValue: item.type
												.replace(/[._-]/g, " ")
												.replace(/\b\w/g, (c) => c.toUpperCase()),
										},
									)}
								</p>
								{subtitle && (
									<p className="truncate text-[11px] text-muted-foreground">
										{subtitle}
									</p>
								)}
							</div>
						</div>
					);

					return (
						<li
							key={item.id}
							className="group flex items-center gap-2 px-4 py-3"
						>
							{to ? (
								<Link
									to={to}
									className="min-w-0 flex-1"
									onClick={() => onMarkRead(item.id)}
								>
									{inner}
								</Link>
							) : (
								<div className="min-w-0 flex-1">{inner}</div>
							)}
							<button
								type="button"
								className="shrink-0 rounded px-1.5 py-0.5 font-medium text-[10px] text-primary opacity-0 transition-opacity hover:underline group-hover:opacity-100"
								onClick={() => onMarkRead(item.id)}
								disabled={isMarkingRead}
							>
								{t("notifications.markRead")}
							</button>
						</li>
					);
				})}
			</ul>

			{items.length > MAX_SHOWN && (
				<div className="border-t px-4 py-2 text-center">
					<Link
						to="/notifications"
						className="text-muted-foreground text-xs hover:text-foreground hover:underline"
					>
						{t("student.pendingActions.moreItems", {
							count: items.length - MAX_SHOWN,
						})}
					</Link>
				</div>
			)}
		</div>
	);
}

// ─── Deliberation Decision ────────────────────────────────────────────────────

const DECISION_CONFIG: Record<
	string,
	{ code: string; labelKey: string; isSuccess: boolean; isPending?: boolean }
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
	pending: {
		code: "EN",
		labelKey: "deliberation.decision.pending",
		isSuccess: false,
		isPending: true,
	},
};

type UeResult = {
	ueId: string;
	ueCode: string;
	ueName: string;
	ueCredits: number;
	ueAverage: number | null;
	isValidated: boolean;
	creditsEarned: number;
};

type DecisionResult = {
	id: string;
	finalDecision: string | null;
	academicYear: string | null;
	className: string | null;
	isOverridden: boolean;
	generalAverage: number | null;
	totalCreditsEarned: number | null;
	totalCreditsPossible: number | null;
	mention: string | null;
	rank: number | null;
	ueResults: UeResult[];
	closedAt?: string | Date | null;
};

function DeliberationDecisionCard({
	decision,
	isLatest,
}: {
	decision: DecisionResult;
	isLatest?: boolean;
}) {
	const { t } = useTranslation();
	const [ueOpen, setUeOpen] = useState(false);

	if (!decision.finalDecision) return null;
	const cfg = DECISION_CONFIG[decision.finalDecision] ?? {
		code: "—",
		labelKey: "deliberation.decision.unknown",
		isSuccess: false,
	};

	const wrapCls = cfg.isPending
		? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
		: cfg.isSuccess
			? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
			: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30";
	const badgeCls = cfg.isPending
		? "bg-blue-500 text-white"
		: cfg.isSuccess
			? "bg-emerald-600 text-white"
			: "bg-amber-500 text-white";
	const iconCls = cfg.isPending
		? "text-blue-500 dark:text-blue-400"
		: cfg.isSuccess
			? "text-emerald-600 dark:text-emerald-400"
			: "text-amber-500";

	return (
		<div className={`rounded-xl border shadow-sm ${wrapCls}`}>
			<div className="flex items-start gap-4 p-4">
				<div
					className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${badgeCls}`}
				>
					{cfg.code}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-semibold text-foreground text-sm">
							{t(cfg.labelKey)}
						</span>
						{isLatest && (
							<Badge variant="secondary" className="text-xs">
								{t("student.performance.latestDecision")}
							</Badge>
						)}
						{decision.isOverridden && (
							<Badge variant="outline" className="text-xs">
								{t("deliberation.decision.overridden")}
							</Badge>
						)}
					</div>
					<div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground text-xs">
						{decision.academicYear && <span>{decision.academicYear}</span>}
						{decision.className && <span>{decision.className}</span>}
						{decision.generalAverage !== null && (
							<span>
								{t("student.performance.average")}:{" "}
								{decision.generalAverage.toFixed(2)}/20
							</span>
						)}
						{decision.mention && (
							<span>
								{t("student.performance.mention", {
									mention: decision.mention,
								})}
							</span>
						)}
						{decision.rank !== null && (
							<span>
								{t("student.performance.rank", { rank: decision.rank })}
							</span>
						)}
						{decision.closedAt && (
							<span>
								{t("deliberation.publishedAt", {
									date: format(new Date(decision.closedAt), "dd/MM/yyyy"),
								})}
							</span>
						)}
					</div>
				</div>
				<Award className={`h-5 w-5 shrink-0 ${iconCls}`} />
			</div>

			{decision.ueResults.length > 0 && (
				<>
					<button
						type="button"
						className="flex w-full items-center justify-between border-t px-4 py-2 text-left text-muted-foreground text-xs transition-colors hover:bg-muted/20"
						onClick={() => setUeOpen((p) => !p)}
					>
						<span className="font-medium">
							{t("student.performance.ueBreakdown")}
						</span>
						{ueOpen ? (
							<ChevronUp className="h-3.5 w-3.5" />
						) : (
							<ChevronDown className="h-3.5 w-3.5" />
						)}
					</button>
					{ueOpen && (
						<div className="border-t">
							{decision.ueResults.map((ue) => (
								<div
									key={ue.ueId}
									className="flex items-center justify-between border-b px-4 py-2 last:border-0"
								>
									<div className="min-w-0">
										<p className="truncate font-medium text-foreground text-xs">
											{ue.ueName}
											{ue.ueCode && (
												<span className="ml-1 font-mono text-[10px] text-muted-foreground">
													{ue.ueCode}
												</span>
											)}
										</p>
										<p className="text-[10px] text-muted-foreground">
											{ue.creditsEarned}/{ue.ueCredits} crédits
										</p>
									</div>
									<div className="flex shrink-0 items-center gap-2">
										{ue.ueAverage !== null && (
											<span className="font-semibold text-foreground text-xs tabular-nums">
												{ue.ueAverage.toFixed(2)}
											</span>
										)}
										{ue.isValidated ? (
											<Badge variant="success" className="text-[10px]">
												{t("student.performance.validated")}
											</Badge>
										) : (
											<Badge variant="destructive" className="text-[10px]">
												{t("student.performance.notValidated")}
											</Badge>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}

// ─── Enrollment Status Card ───────────────────────────────────────────────────

type ClassInfo = {
	name: string;
	programInfo?: { name: string } | null;
	academicYearInfo?: { name: string } | null;
	cycleLevel?: { code: string } | null;
};

function EnrollmentStatusCard({ classInfo }: { classInfo: ClassInfo }) {
	const { t } = useTranslation();
	return (
		<div className="rounded-xl border bg-card p-4 shadow-sm">
			<div className="mb-3 flex items-center gap-2">
				<GraduationCap className="h-4 w-4 text-primary" />
				<span className="font-semibold text-foreground text-sm">
					{t("student.enrollment.title")}
				</span>
			</div>
			<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-xs">
				{classInfo.programInfo?.name && (
					<>
						<dt className="text-muted-foreground">
							{t("student.enrollment.program")}
						</dt>
						<dd className="truncate font-medium text-foreground">
							{classInfo.programInfo.name}
						</dd>
					</>
				)}
				<dt className="text-muted-foreground">
					{t("student.enrollment.class")}
				</dt>
				<dd className="font-medium text-foreground">{classInfo.name}</dd>
				{classInfo.academicYearInfo?.name && (
					<>
						<dt className="text-muted-foreground">
							{t("student.enrollment.year")}
						</dt>
						<dd className="font-medium text-foreground">
							{classInfo.academicYearInfo.name}
						</dd>
					</>
				)}
				{classInfo.cycleLevel?.code && (
					<>
						<dt className="text-muted-foreground">
							{t("student.enrollment.level")}
						</dt>
						<dd className="font-medium text-foreground">
							{classInfo.cycleLevel.code}
						</dd>
					</>
				)}
			</dl>
		</div>
	);
}

// ─── Enrollment Window Banner ─────────────────────────────────────────────────

function EnrollmentWindowBanner() {
	const { t } = useTranslation();
	return (
		<div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30">
			<CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
			<div className="min-w-0 flex-1">
				<p className="font-semibold text-emerald-800 text-sm dark:text-emerald-300">
					{t("student.enrollment.windowOpen")}
				</p>
				<p className="mt-0.5 text-emerald-700 text-xs dark:text-emerald-400">
					{t("student.enrollment.windowOpenHint")}
				</p>
			</div>
			<Button variant="outline" size="sm" className="shrink-0" asChild>
				<Link to="/student/enrollments">
					{t("student.enrollment.enroll")}
					<ChevronRight className="ml-1 h-3 w-3" />
				</Link>
			</Button>
		</div>
	);
}

function DecisionsPendingCard() {
	const { t } = useTranslation();
	return (
		<div className="flex items-start gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-800 dark:bg-blue-950/30">
			<Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-blue-500 dark:text-blue-400" />
			<div>
				<p className="font-semibold text-foreground text-sm">
					{t("student.performance.pendingResults")}
				</p>
				<p className="mt-0.5 text-muted-foreground text-xs">
					{t("student.performance.pendingResultsHint")}
				</p>
			</div>
		</div>
	);
}

// ─── Fee Clearance Widget ─────────────────────────────────────────────────────

type FeeAssignment = {
	id: string;
	status: string;
	effectiveAmount: number;
	paidAmount: number;
	currency: string;
	academicYear?: { name: string } | null;
};

function FeeClearanceWidget({ assignments }: { assignments: FeeAssignment[] }) {
	const { t } = useTranslation();
	if (!assignments.length) return null;

	const latest = assignments[0];
	const currency = latest.currency;
	const balance = latest.effectiveAmount - latest.paidAmount;
	const isCleared = latest.status === "paid" || latest.status === "exempt";

	return (
		<div
			className={`flex items-center gap-3 rounded-xl border p-4 shadow-sm ${
				isCleared
					? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
					: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
			}`}
		>
			{isCleared ? (
				<CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
			) : (
				<AlertCircle className="h-8 w-8 shrink-0 text-amber-600" />
			)}
			<div className="min-w-0 flex-1">
				<p className="font-semibold text-foreground text-sm">
					{isCleared
						? t("feeClearance.quitus.cleared")
						: t("feeClearance.quitus.notCleared")}
				</p>
				<p className="text-muted-foreground text-xs">
					{latest.academicYear?.name}
					{!isCleared && (
						<>
							{" · "}
							<span className="font-medium text-amber-700">
								{t("feeClearance.student.balance")} : {balance.toLocaleString()}{" "}
								{currency}
							</span>
						</>
					)}
				</p>
			</div>
			<Button variant="ghost" size="sm" asChild>
				<Link to="/student/fees">
					<CreditCard className="mr-1 h-4 w-4" />
					{t("student.dashboard.viewFees")}
					<ChevronRight className="ml-1 h-3 w-3" />
				</Link>
			</Button>
		</div>
	);
}

// ─── Upcoming Exams Strip ─────────────────────────────────────────────────────

type UpcomingExam = {
	id: string;
	courseName: string;
	examTypeName: string | null;
	scheduledAt: string | null;
	duration: number | null;
};

function UpcomingExamsStrip({ exams }: { exams: UpcomingExam[] }) {
	const { t } = useTranslation();
	if (!exams.length) return null;

	const shown = exams.slice(0, 3);

	function daysLabel(date: string) {
		const d = new Date(date);
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		d.setHours(0, 0, 0, 0);
		const diff = Math.round(
			(d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
		);
		if (diff === 0) return t("student.exams.today");
		if (diff === 1) return t("student.exams.tomorrow");
		if (diff < 0) return format(new Date(date), "dd/MM");
		return `J-${diff}`;
	}

	return (
		<div className="rounded-xl border bg-card p-4 shadow-sm">
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
					<span className="font-semibold text-foreground text-sm">
						{t("student.dashboard.upcomingExams")}
					</span>
					<Badge variant="secondary" className="text-xs">
						{exams.length}
					</Badge>
				</div>
				<Button variant="ghost" size="sm" asChild>
					<Link to="/student/exams">
						{t("student.dashboard.viewExams")}
						<ChevronRight className="ml-1 h-3 w-3" />
					</Link>
				</Button>
			</div>
			<div className="space-y-2">
				{shown.map((exam) => (
					<div
						key={exam.id}
						className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
					>
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium text-foreground text-sm">
								{exam.courseName}
							</p>
							{exam.examTypeName && (
								<p className="text-muted-foreground text-xs">
									{exam.examTypeName}
								</p>
							)}
						</div>
						<div className="shrink-0 text-right">
							{exam.scheduledAt ? (
								<>
									<p className="font-semibold text-violet-700 text-xs dark:text-violet-400">
										{daysLabel(exam.scheduledAt)}
									</p>
									<p className="text-muted-foreground text-xs">
										{format(new Date(exam.scheduledAt), "dd/MM HH:mm")}
									</p>
								</>
							) : (
								<p className="text-muted-foreground text-xs">
									{t("exam.noDate")}
								</p>
							)}
						</div>
					</div>
				))}
			</div>
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
	const queryClient = useQueryClient();

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
	const [historyOpen, setHistoryOpen] = useState(false);

	const feeHistoryQuery = useQuery(
		trpc.feeClearance.myFinancialHistory.queryOptions(),
	);

	const upcomingExamsQuery = useQuery(
		trpc.exams.upcomingForStudent.queryOptions(),
	);

	const notifQuery = useQuery(
		trpc.notifications.myNotifications.queryOptions({ limit: 20 }),
	);
	const unreadNotifs = (notifQuery.data?.items ?? []).filter(
		(n) => !n.readAt,
	) as NotifItem[];

	const enrollmentWindowsQuery = useQuery(
		trpc.workflows.enrollmentWindows.queryOptions(),
	);
	const openWindow = (enrollmentWindowsQuery.data ?? []).find(
		(w) => w.classId === classId && w.status === "open",
	);

	const markReadMut = useMutation({
		mutationFn: (id: string) =>
			trpcClient.notifications.markRead.mutate({ id }),
		onSuccess: () => {
			queryClient.invalidateQueries(
				trpc.notifications.myNotifications.queryKey(),
			);
			queryClient.invalidateQueries(trpc.notifications.unreadCount.queryKey());
		},
	});

	const student = studentQuery.data;
	const transcript = transcriptQuery.data;
	const ledger = ledgerQuery.data;
	const classInfo = classQuery.data;
	const allDecisions = (decisionsQuery.data ?? []) as DecisionResult[];
	const latestDecision = allDecisions[0] ?? null;
	const olderDecisions = allDecisions.slice(1);
	const feeAssignments = feeHistoryQuery.data ?? [];
	const upcomingExams = (upcomingExamsQuery.data ?? []) as UpcomingExam[];

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

	const gradedUnits = units.filter((u) => u.courses.some((c) => c.average > 0));
	const onTrackUnits = gradedUnits.filter((u) => u.average >= 10).length;
	const projectionRate =
		gradedUnits.length > 0
			? Math.round((onTrackUnits / gradedUnits.length) * 100)
			: null;

	// Show fee widget only for the latest assignment
	const latestFeeAssignment =
		feeAssignments.length > 0 ? feeAssignments[0] : null;
	const feeNotCleared =
		latestFeeAssignment &&
		latestFeeAssignment.status !== "paid" &&
		latestFeeAssignment.status !== "exempt";

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
					{/* Pending actions — unread notifications */}
					{unreadNotifs.length > 0 && (
						<motion.div variants={staggerItem}>
							<PendingActionsCard
								items={unreadNotifs}
								onMarkRead={(id) => markReadMut.mutate(id)}
								isMarkingRead={markReadMut.isPending}
							/>
						</motion.div>
					)}

					{/* Enrollment window open banner */}
					{openWindow && (
						<motion.div variants={staggerItem}>
							<EnrollmentWindowBanner />
						</motion.div>
					)}

					{/* Fee clearance alert — shown at the top when not cleared */}
					{latestFeeAssignment && (
						<motion.div variants={staggerItem}>
							<FeeClearanceWidget
								assignments={[latestFeeAssignment as FeeAssignment]}
							/>
						</motion.div>
					)}

					{/* Upcoming exams strip */}
					{upcomingExams.length > 0 && (
						<motion.div variants={staggerItem}>
							<UpcomingExamsStrip exams={upcomingExams} />
						</motion.div>
					)}

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

					{/* Enrollment status card */}
					{classInfo && (
						<motion.div variants={staggerItem}>
							<EnrollmentStatusCard classInfo={classInfo as ClassInfo} />
						</motion.div>
					)}

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

					{/* Délibération decisions section */}
					{!decisionsQuery.isPending && (
						<motion.div variants={staggerItem} className="space-y-3">
							<h2 className="flex items-center gap-2 font-semibold text-base text-foreground">
								<Award className="h-4 w-4 text-muted-foreground" />
								{t("student.performance.decisions")}
							</h2>
							{allDecisions.length === 0 ? (
								<DecisionsPendingCard />
							) : (
								<div className="space-y-2">
									<DeliberationDecisionCard
										decision={latestDecision!}
										isLatest={allDecisions.length > 1}
									/>
									{olderDecisions.length > 0 && (
										<>
											<button
												type="button"
												className="flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-left text-muted-foreground text-xs transition-colors hover:bg-muted/20"
												onClick={() => setHistoryOpen((p) => !p)}
											>
												<History className="h-3.5 w-3.5" />
												<span>
													{t("student.performance.decisionHistory")} (
													{olderDecisions.length})
												</span>
												{historyOpen ? (
													<ChevronUp className="ml-auto h-3.5 w-3.5" />
												) : (
													<ChevronDown className="ml-auto h-3.5 w-3.5" />
												)}
											</button>
											{historyOpen &&
												olderDecisions.map((d) => (
													<DeliberationDecisionCard key={d.id} decision={d} />
												))}
										</>
									)}
								</div>
							)}
						</motion.div>
					)}

					{/* Fee clearance not cleared — pending action banner */}
					{feeNotCleared && (
						<motion.div
							variants={staggerItem}
							className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20"
						>
							<AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
							<div className="flex-1 text-amber-800 text-sm dark:text-amber-300">
								{t("student.dashboard.pendingFees")}
							</div>
							<Button variant="outline" size="sm" className="shrink-0" asChild>
								<Link to="/student/fees">
									{t("student.dashboard.viewFees")}
								</Link>
							</Button>
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

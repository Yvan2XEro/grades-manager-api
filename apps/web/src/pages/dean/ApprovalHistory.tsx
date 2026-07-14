import { useQuery } from "@tanstack/react-query";
import {
	BookOpen,
	Calendar,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	ClipboardCheck,
	History,
	Lock,
	RefreshCw,
	Search,
	Send,
	Tag,
	Users,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ClassSelect } from "@/components/inputs/ClassSelect";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { TablePagination } from "@/components/ui/table-pagination";
import { type RouterOutputs, trpc } from "../../utils/trpc";

type ExamHistoryItem = RouterOutputs["exams"]["listPaged"]["items"][number];
type AuditEvent = RouterOutputs["exams"]["getAuditHistory"][number];

const AUDIT_ACTION_CONFIG: Record<
	string,
	{ icon: React.ReactNode; labelKey: string; color: string }
> = {
	submit: {
		icon: <Send className="h-3 w-3" />,
		labelKey: "dean.auditHistory.actions.submit",
		color: "text-blue-600",
	},
	resubmit: {
		icon: <RefreshCw className="h-3 w-3" />,
		labelKey: "dean.auditHistory.actions.resubmit",
		color: "text-blue-600",
	},
	approve: {
		icon: <CheckCircle2 className="h-3 w-3" />,
		labelKey: "dean.auditHistory.actions.approve",
		color: "text-emerald-600",
	},
	reject: {
		icon: <XCircle className="h-3 w-3" />,
		labelKey: "dean.auditHistory.actions.reject",
		color: "text-destructive",
	},
	lock: {
		icon: <Lock className="h-3 w-3" />,
		labelKey: "dean.auditHistory.actions.lock",
		color: "text-muted-foreground",
	},
};

function ExamAuditTimeline({ examId }: { examId: string }) {
	const { t } = useTranslation();
	const { data: events, isLoading } = useQuery(
		trpc.exams.getAuditHistory.queryOptions({ id: examId }),
	);

	if (isLoading) {
		return (
			<div className="mt-3 flex items-center gap-2 text-muted-foreground text-xs">
				<RefreshCw className="h-3 w-3 animate-spin" />
				{t("common.loading", { defaultValue: "Loading…" })}
			</div>
		);
	}

	if (!events || events.length === 0) {
		return (
			<p className="mt-3 text-muted-foreground text-xs italic">
				{t("dean.auditHistory.empty", { defaultValue: "No events recorded." })}
			</p>
		);
	}

	return (
		<div className="mt-3 space-y-2 border-t pt-3">
			<p className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
				<History className="h-3 w-3" />
				{t("dean.auditHistory.title", { defaultValue: "Audit trail" })}
			</p>
			<ol className="relative ml-1.5 space-y-3 border-muted border-l pl-4">
				{events.map((ev: AuditEvent) => {
					const cfg = AUDIT_ACTION_CONFIG[ev.action];
					const actorName = ev.actor
						? `${ev.actor.firstName} ${ev.actor.lastName}`
						: t("dean.auditHistory.system", { defaultValue: "System" });
					return (
						<li key={ev.id} className="relative">
							<span className="-left-[1.4rem] absolute flex h-5 w-5 items-center justify-center rounded-full border bg-background">
								<span className={cfg?.color ?? "text-muted-foreground"}>
									{cfg?.icon ?? <History className="h-3 w-3" />}
								</span>
							</span>
							<div>
								<p className="font-medium text-foreground text-xs">
									{t(cfg?.labelKey ?? ev.action, { defaultValue: ev.action })}{" "}
									<span className="font-normal text-muted-foreground">
										{t("dean.auditHistory.by", { defaultValue: "by" })}{" "}
										{actorName}
									</span>
								</p>
								{ev.reason && (
									<p className="mt-0.5 rounded bg-destructive/8 px-2 py-0.5 text-[11px] text-destructive">
										{ev.reason}
									</p>
								)}
								<p className="mt-0.5 text-[10px] text-muted-foreground/70">
									{new Date(ev.createdAt).toLocaleString("fr-FR", {
										day: "2-digit",
										month: "short",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>
						</li>
					);
				})}
			</ol>
		</div>
	);
}

type HistoryStatus = "approved" | "rejected" | "all";

const STATUS_CONFIG = {
	approved: {
		icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
		variant: "success" as const,
		labelKey: "exam.status.approved",
	},
	rejected: {
		icon: <XCircle className="h-4 w-4 text-destructive" />,
		variant: "destructive" as const,
		labelKey: "exam.status.rejected",
	},
};

export default function ApprovalHistory() {
	const { t } = useTranslation();

	// ── Filters ──────────────────────────────────────────────────────────────
	const [statusFilter, setStatusFilter] = useState<HistoryStatus>("all");
	const [search, setSearch] = useState("");
	const [classFilter, setClassFilter] = useState<string>("all");
	const [yearFilter, setYearFilter] = useState<string>("all");
	const [teacherFilter, setTeacherFilter] = useState<string>("all");
	const [dateFrom, setDateFrom] = useState<string>("");
	const [dateTo, setDateTo] = useState<string>("");
	const [expandedExamId, setExpandedExamId] = useState<string | null>(null);

	// ── Pagination ────────────────────────────────────────────────────────────
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const handleFilter =
		<T,>(setter: (v: T) => void) =>
		(value: T) => {
			setter(value);
			setPage(1);
		};

	// Status filter is passed to server: "approved", "rejected", or both
	const serverStatuses =
		statusFilter === "all"
			? (["approved", "rejected"] as const)
			: ([statusFilter] as const);

	const teachersQuery = useQuery(
		trpc.users.list.queryOptions({ roles: ["teacher"] }),
	);

	const { data: historyData, isLoading } = useQuery(
		trpc.exams.listPaged.queryOptions({
			page,
			pageSize,
			statuses: [...serverStatuses],
			query: search.trim() || undefined,
			classId: classFilter !== "all" ? classFilter : undefined,
			academicYearId: yearFilter !== "all" ? yearFilter : undefined,
			teacherId: teacherFilter !== "all" ? teacherFilter : undefined,
			dateFrom: dateFrom ? new Date(dateFrom) : undefined,
			dateTo: dateTo ? new Date(dateTo) : undefined,
		}),
	);

	const historyExams = historyData?.items ?? [];

	// KPI counts from current page
	const approvedCount = historyExams.filter(
		(e) => e.status === "approved",
	).length;
	const rejectedCount = historyExams.filter(
		(e) => e.status === "rejected",
	).length;

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("dean.history.title")}
				description={t("dean.history.subtitle")}
			/>

			{/* KPI strip */}
			<div className="grid grid-cols-2 gap-4">
				<div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
						<CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
					</div>
					<div>
						<p className="text-muted-foreground text-xs">
							{t("dean.history.approved")}
						</p>
						<p className="font-bold text-xl tabular-nums">{approvedCount}</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
						<XCircle className="h-5 w-5 text-destructive" />
					</div>
					<div>
						<p className="text-muted-foreground text-xs">
							{t("dean.history.rejected")}
						</p>
						<p className="font-bold text-xl tabular-nums">{rejectedCount}</p>
					</div>
				</div>
			</div>

			{/* ── Filters ───────────────────────────────────────────────────────── */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Search */}
				<div className="relative min-w-[200px] flex-1">
					<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 text-muted-foreground" />
					<input
						type="text"
						value={search}
						onChange={(e) => handleFilter(setSearch)(e.target.value)}
						placeholder={t("dean.history.searchPlaceholder")}
						className="w-full rounded-md border bg-background py-2 pr-3 pl-8 text-sm outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>

				{/* Year filter */}
				<AcademicYearSelect
					value={yearFilter === "all" ? null : yearFilter}
					onChange={(v) => handleFilter(setYearFilter)(v ?? "all")}
					autoSelectActive
					className="w-[170px]"
				/>

				{/* Class filter */}
				<ClassSelect
					academicYearId={yearFilter !== "all" ? yearFilter : null}
					value={classFilter === "all" ? null : classFilter}
					onChange={(v) => handleFilter(setClassFilter)(v ?? "all")}
				/>

				{/* Status filter */}
				<Select
					value={statusFilter}
					onValueChange={handleFilter((v: string) =>
						setStatusFilter(v as HistoryStatus),
					)}
				>
					<SelectTrigger className="w-[150px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("common.all")}</SelectItem>
						<SelectItem value="approved">
							{t("dean.history.approved")}
						</SelectItem>
						<SelectItem value="rejected">
							{t("dean.history.rejected")}
						</SelectItem>
					</SelectContent>
				</Select>

				{/* Teacher filter */}
				<Select
					value={teacherFilter}
					onValueChange={handleFilter(setTeacherFilter)}
				>
					<SelectTrigger className="w-[170px]">
						<SelectValue
							placeholder={t("dean.history.teacherFilter", {
								defaultValue: "All teachers",
							})}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("dean.history.allTeachers", { defaultValue: "All teachers" })}
						</SelectItem>
						{teachersQuery.data?.items?.map((u) => (
							<SelectItem key={u.id} value={u.id}>
								{u.firstName} {u.lastName}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Date range filter */}
				<div className="flex items-center gap-1.5">
					<Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
					<input
						type="date"
						value={dateFrom}
						onChange={(e) => handleFilter(setDateFrom)(e.target.value)}
						className="rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
						title={t("dean.history.dateFrom", { defaultValue: "From" })}
					/>
					<span className="text-muted-foreground text-xs">—</span>
					<input
						type="date"
						value={dateTo}
						onChange={(e) => handleFilter(setDateTo)(e.target.value)}
						className="rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
						title={t("dean.history.dateTo", { defaultValue: "To" })}
					/>
				</div>
			</div>

			{/* ── List ──────────────────────────────────────────────────────────── */}
			{isLoading ? (
				<div className="flex h-48 items-center justify-center">
					<Spinner className="h-8 w-8 text-primary" />
				</div>
			) : historyExams.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<ClipboardCheck className="h-6 w-6 text-muted-foreground" />
					</div>
					<div>
						<p className="font-medium text-foreground text-sm">
							{t("dean.history.empty")}
						</p>
						<p className="mt-1 text-muted-foreground text-xs">
							{t("dean.history.emptyHint")}
						</p>
					</div>
				</div>
			) : (
				<>
					<div className="space-y-2">
						{historyExams.map((exam: ExamHistoryItem) => {
							const cfg =
								STATUS_CONFIG[exam.status as keyof typeof STATUS_CONFIG];
							const examDate = exam.date
								? new Date(exam.date).toLocaleDateString("fr-FR", {
										day: "2-digit",
										month: "short",
										year: "numeric",
									})
								: null;
							const validatedDate = exam.validatedAt
								? new Date(exam.validatedAt).toLocaleDateString("fr-FR", {
										day: "2-digit",
										month: "short",
										year: "numeric",
									})
								: null;

							return (
								<div
									key={exam.id}
									className="flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm"
								>
									<div className="mt-0.5 shrink-0">{cfg?.icon}</div>

									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-semibold text-foreground text-sm">
												{exam.name}
											</span>
											{exam.type && (
												<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-muted-foreground text-xs">
													<Tag className="h-3 w-3" />
													{exam.type}
												</span>
											)}
											<span className="text-muted-foreground text-xs">
												{exam.percentage}%
											</span>
										</div>

										<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground text-xs">
											{exam.courseName && (
												<span className="flex items-center gap-1">
													<BookOpen className="h-3 w-3 shrink-0" />
													{exam.courseName}
													{exam.courseCode && (
														<span className="font-mono">
															({exam.courseCode})
														</span>
													)}
												</span>
											)}
											{exam.className && (
												<span className="flex items-center gap-1">
													<Users className="h-3 w-3 shrink-0" />
													{exam.className}
												</span>
											)}
											{examDate && (
												<span className="flex items-center gap-1">
													<Calendar className="h-3 w-3 shrink-0" />
													{examDate}
												</span>
											)}
										</div>

										{validatedDate && (
											<p className="mt-1 text-muted-foreground text-xs">
												{exam.status === "approved"
													? t("dean.history.approvedOn", {
															date: validatedDate,
														})
													: t("dean.history.rejectedOn", {
															date: validatedDate,
														})}
											</p>
										)}
										{exam.status === "rejected" && exam.rejectionReason && (
											<p className="mt-1.5 rounded-md bg-destructive/8 px-2.5 py-1 text-destructive text-xs">
												<span className="font-semibold">
													{t("dean.history.rejectionReason", {
														defaultValue: "Reason",
													})}
													:{" "}
												</span>
												{exam.rejectionReason}
											</p>
										)}

										<button
											type="button"
											className="mt-2 flex items-center gap-1 text-[11px] text-primary hover:underline"
											onClick={() =>
												setExpandedExamId(
													expandedExamId === exam.id ? null : exam.id,
												)
											}
										>
											{expandedExamId === exam.id ? (
												<ChevronUp className="h-3 w-3" />
											) : (
												<ChevronDown className="h-3 w-3" />
											)}
											{t("dean.auditHistory.toggle", {
												defaultValue: "Audit trail",
											})}
										</button>

										{expandedExamId === exam.id && (
											<ExamAuditTimeline examId={exam.id} />
										)}
									</div>

									{cfg && (
										<Badge variant={cfg.variant} className="shrink-0 text-xs">
											{t(cfg.labelKey)}
										</Badge>
									)}
								</div>
							);
						})}
					</div>

					<TablePagination
						page={page}
						pageCount={historyData?.pageCount ?? 1}
						total={historyData?.total ?? 0}
						pageSize={pageSize}
						onPageChange={setPage}
						onPageSizeChange={(s) => {
							setPageSize(s);
							setPage(1);
						}}
					/>
				</>
			)}
		</div>
	);
}

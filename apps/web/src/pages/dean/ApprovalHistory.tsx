import { useQuery } from "@tanstack/react-query";
import {
	BookOpen,
	Calendar,
	CheckCircle2,
	ClipboardCheck,
	Search,
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
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import { trpc } from "../../utils/trpc";

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

const PAGE_SIZE = 25;

export default function ApprovalHistory() {
	const { t } = useTranslation();

	// ── Filters ──────────────────────────────────────────────────────────────
	const [statusFilter, setStatusFilter] = useState<HistoryStatus>("all");
	const [search, setSearch] = useState("");
	const [classFilter, setClassFilter] = useState<string>("all");
	const [yearFilter, setYearFilter] = useState<string>("all");
	const pagination = useCursorPagination({ pageSize: PAGE_SIZE });

	const resetAndApply = (setter: (v: string) => void) => (v: string) => {
		setter(v);
		pagination.reset();
	};

	// Status filter is passed to server: "approved", "rejected", or both
	const serverStatuses =
		statusFilter === "all"
			? (["approved", "rejected"] as const)
			: ([statusFilter] as const);

	const examsQuery = useQuery(
		trpc.exams.list.queryOptions({
			limit: PAGE_SIZE,
			cursor: pagination.cursor,
			statuses: [...serverStatuses],
			query: search.trim() || undefined,
			classId: classFilter !== "all" ? classFilter : undefined,
			academicYearId: yearFilter !== "all" ? yearFilter : undefined,
		}),
	);

	const historyExams = examsQuery.data?.items ?? [];

	// KPI counts from current page (stable across status filter changes via server)
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
						onChange={(e) => resetAndApply(setSearch)(e.target.value)}
						placeholder={t("dean.history.searchPlaceholder")}
						className="w-full rounded-md border bg-background py-2 pr-3 pl-8 text-sm outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>

				{/* Year filter */}
				<AcademicYearSelect
					value={yearFilter === "all" ? null : yearFilter}
					onChange={(v) => resetAndApply(setYearFilter)(v ?? "all")}
					autoSelectActive
					className="w-[170px]"
				/>

				{/* Class filter */}
				<ClassSelect
					academicYearId={yearFilter !== "all" ? yearFilter : null}
					value={classFilter === "all" ? null : classFilter}
					onChange={(v) => resetAndApply(setClassFilter)(v ?? "all")}
				/>

				{/* Status filter */}
				<Select
					value={statusFilter}
					onValueChange={resetAndApply((v) =>
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
			</div>

			{/* ── List ──────────────────────────────────────────────────────────── */}
			{examsQuery.isLoading ? (
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
						{historyExams.map((exam) => {
							const cfg =
								STATUS_CONFIG[exam.status as keyof typeof STATUS_CONFIG];
							const examDate = exam.date
								? new Date(exam.date).toLocaleDateString("fr-FR", {
										day: "2-digit",
										month: "short",
										year: "numeric",
									})
								: null;
							const validatedDate = (exam as any).validatedAt
								? new Date((exam as any).validatedAt).toLocaleDateString(
										"fr-FR",
										{
											day: "2-digit",
											month: "short",
											year: "numeric",
										},
									)
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
											{(exam as any).courseName && (
												<span className="flex items-center gap-1">
													<BookOpen className="h-3 w-3 shrink-0" />
													{(exam as any).courseName}
													{(exam as any).courseCode && (
														<span className="font-mono">
															({(exam as any).courseCode})
														</span>
													)}
												</span>
											)}
											{(exam as any).className && (
												<span className="flex items-center gap-1">
													<Users className="h-3 w-3 shrink-0" />
													{(exam as any).className}
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
										{exam.status === "rejected" &&
											(exam as any).rejectionReason && (
												<p className="mt-1.5 rounded-md bg-destructive/8 px-2.5 py-1 text-destructive text-xs">
													<span className="font-semibold">
														{t("dean.history.rejectionReason", {
															defaultValue: "Reason",
														})}
														:{" "}
													</span>
													{(exam as any).rejectionReason}
												</p>
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

					<PaginationBar
						hasPrev={pagination.hasPrev}
						hasNext={!!examsQuery.data?.nextCursor}
						onPrev={pagination.handlePrev}
						onNext={() => pagination.handleNext(examsQuery.data?.nextCursor)}
						isLoading={examsQuery.isLoading}
						page={pagination.page}
						totalPages={
							examsQuery.data?.total !== undefined
								? Math.ceil(examsQuery.data.total / PAGE_SIZE)
								: undefined
						}
					/>
				</>
			)}
		</div>
	);
}

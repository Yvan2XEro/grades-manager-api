import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	BookOpen,
	Calendar,
	Check,
	ChevronDown,
	ChevronUp,
	ClipboardCheck,
	Hash,
	Search,
	Tag,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ClassSelect } from "@/components/inputs/ClassSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "../../utils/trpc";

type ExamItem = {
	id: string;
	name: string;
	percentage: string | number;
	status: string;
	type: string;
	date: Date | string | null;
	courseName: string | null;
	courseCode: string | null;
	className: string | null;
	classId: string | null;
};

// ─── Reject Dialog ────────────────────────────────────────────────────────────

function RejectExamDialog({
	examId,
	examName,
	open,
	onClose,
}: {
	examId: string;
	examName: string;
	open: boolean;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [reason, setReason] = useState("");

	const rejectMutation = useMutation({
		mutationFn: () =>
			trpcClient.workflows.rejectGrades.mutate({ examId, reason }),
		onSuccess: () => {
			toast.success(t("dean.approvals.rejected"));
			queryClient.invalidateQueries({ queryKey: ["dean-exams"] });
			onClose();
			setReason("");
		},
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<X className="h-5 w-5" />
						{t("dean.approvals.rejectTitle")}
					</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<p className="text-muted-foreground text-sm">
						<strong>{examName}</strong> — {t("dean.approvals.rejectHint")}
					</p>
					<textarea
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder={t("dean.approvals.rejectPlaceholder")}
						className="min-h-[80px] w-full resize-none rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						{t("common.cancel")}
					</Button>
					<Button
						variant="destructive"
						disabled={!reason.trim() || rejectMutation.isPending}
						onClick={() => rejectMutation.mutate()}
					>
						{t("dean.approvals.rejectConfirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ─── Exam Approval Card ───────────────────────────────────────────────────────

function ExamApprovalCard({
	exam,
	selected,
	onToggle,
	onApproved,
}: {
	exam: ExamItem;
	selected: boolean;
	onToggle: () => void;
	onApproved: () => void;
}) {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState(false);
	const [rejectOpen, setRejectOpen] = useState(false);

	const gradesQuery = useQuery({
		queryKey: ["dean-grades", exam.id],
		enabled: expanded,
		queryFn: () =>
			trpcClient.grades.listByExam
				.query({ examId: exam.id, limit: 200 })
				.then((r) => r.items),
	});

	const approveMutation = useMutation({
		mutationFn: () =>
			trpcClient.workflows.validateGrades.mutate({
				examId: exam.id,
				approverId: undefined,
			}),
		onSuccess: () => {
			toast.success(t("dean.approvals.approved"));
			onApproved();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const grades = gradesQuery.data ?? [];
	const graded = grades.length;
	const scores = grades.map((g) => Number(g.score));
	const avg =
		graded > 0 ? (scores.reduce((s, v) => s + v, 0) / graded).toFixed(2) : null;
	const min = graded > 0 ? Math.min(...scores).toFixed(2) : null;
	const max = graded > 0 ? Math.max(...scores).toFixed(2) : null;
	const below10 = graded > 0 ? scores.filter((s) => s < 10).length : 0;

	const examDate = exam.date
		? new Date(exam.date).toLocaleDateString("fr-FR", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			})
		: null;

	return (
		<div className="overflow-hidden rounded-xl border bg-card shadow-sm">
			<div className="flex items-start gap-3 px-4 py-3">
				<Checkbox
					checked={selected}
					onCheckedChange={onToggle}
					className="mt-0.5"
				/>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-semibold text-foreground text-sm">
							{exam.name}
						</span>
						<Badge variant="warning" className="text-xs">
							{t("exam.status.submitted")}
						</Badge>
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
									<span className="font-mono">({exam.courseCode})</span>
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
				</div>

				{avg && (
					<div className="hidden shrink-0 flex-col items-end gap-0.5 text-xs md:flex">
						<span className="text-muted-foreground">
							{t("dean.approvals.avg")}{" "}
							<strong className="text-foreground">{avg}</strong>
						</span>
						<span className="text-muted-foreground">
							min {min} · max {max}
						</span>
						{below10 > 0 && (
							<span className="text-destructive">{below10} &lt; 10</span>
						)}
					</div>
				)}

				<div className="flex shrink-0 items-center gap-1.5">
					<Button
						size="sm"
						variant="outline"
						className="border-destructive/30 text-destructive hover:bg-destructive/5"
						onClick={() => setRejectOpen(true)}
					>
						<X className="mr-1 h-3.5 w-3.5" />
						{t("dean.approvals.reject")}
					</Button>
					<Button
						size="sm"
						onClick={() => approveMutation.mutate()}
						disabled={approveMutation.isPending}
					>
						<Check className="mr-1 h-3.5 w-3.5" />
						{t("dean.approvals.approve")}
					</Button>
					<Button
						size="icon"
						variant="ghost"
						className="h-8 w-8"
						onClick={() => setExpanded((p) => !p)}
						title={t("dean.approvals.viewGrades")}
					>
						{expanded ? (
							<ChevronUp className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			{expanded && (
				<div className="border-t bg-muted/20 px-4 py-3">
					{gradesQuery.isLoading ? (
						<div className="flex justify-center py-4">
							<Spinner className="h-5 w-5" />
						</div>
					) : grades.length === 0 ? (
						<p className="py-2 text-center text-muted-foreground text-sm">
							{t("dean.approvals.noGrades")}
						</p>
					) : (
						<>
							{avg && (
								<div className="mb-3 flex flex-wrap gap-3 md:hidden">
									<span className="text-muted-foreground text-xs">
										{t("dean.approvals.avg")}{" "}
										<strong className="text-foreground">{avg}</strong>
									</span>
									<span className="text-muted-foreground text-xs">
										min {min} · max {max}
									</span>
								</div>
							)}
							<div className="max-h-72 overflow-y-auto rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-28">
												<span className="flex items-center gap-1">
													<Hash className="h-3 w-3" />
													{t("dean.approvals.regNumber")}
												</span>
											</TableHead>
											<TableHead>{t("dean.approvals.student")}</TableHead>
											<TableHead className="w-20 text-right">
												{t("dean.approvals.score")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{grades.map((g) => (
											<TableRow key={g.id}>
												<TableCell className="font-mono text-muted-foreground text-xs">
													{(g as any).registrationNumber ?? "—"}
												</TableCell>
												<TableCell className="text-sm">
													{(g as any).studentName ?? "—"}
												</TableCell>
												<TableCell
													className={`text-right font-semibold text-sm tabular-nums ${
														Number(g.score) < 10
															? "text-destructive"
															: "text-foreground"
													}`}
												>
													{Number(g.score).toFixed(2)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</>
					)}
				</div>
			)}

			<RejectExamDialog
				examId={exam.id}
				examName={exam.name}
				open={rejectOpen}
				onClose={() => setRejectOpen(false)}
			/>
		</div>
	);
}

// ─── DeanDashboard ────────────────────────────────────────────────────────────

export default function DeanDashboard() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	// ── Filters ────────────────────────────────────────────────────────────────
	const [search, setSearch] = useState("");
	const [classFilter, setClassFilter] = useState<string>("all");
	const [yearFilter, setYearFilter] = useState<string>("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const resetAndApply = (setter: (v: string) => void) => (v: string) => {
		setter(v);
		setPage(1);
	};

	const examsQuery = useQuery(
		trpc.exams.listPaged.queryOptions({
			page,
			pageSize,
			statuses: ["submitted"],
			query: search.trim() || undefined,
			classId: classFilter !== "all" ? classFilter : undefined,
			academicYearId: yearFilter !== "all" ? yearFilter : undefined,
		}),
	);

	const bulkApproveMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((examId) =>
					trpcClient.workflows.validateGrades.mutate({
						examId,
						approverId: undefined,
					}),
				),
			);
		},
		onSuccess: () => {
			toast.success(t("dean.approvals.bulkApproved"));
			queryClient.invalidateQueries(trpc.exams.listPaged.queryKey());
			setSelectedIds(new Set());
		},
		onError: (e: Error) => toast.error(e.message),
	});

	// Server already filters status: "submitted" — no client-side re-filter needed
	const submittedExams = (examsQuery.data?.items ?? []) as ExamItem[];

	const toggle = (id: string) =>
		setSelectedIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	const allSelected =
		submittedExams.length > 0 && selectedIds.size === submittedExams.length;

	const invalidateAndReset = () => {
		queryClient.invalidateQueries(trpc.exams.listPaged.queryKey());
		setSelectedIds(new Set());
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("dean.approvals.title")}
				description={
					submittedExams.length > 0
						? t("dean.approvals.pendingCount", {
								count: submittedExams.length,
							})
						: t("dean.approvals.noPending")
				}
			/>

			{/* ── Filters ─────────────────────────────────────────────────────── */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative min-w-[200px] flex-1">
					<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 text-muted-foreground" />
					<input
						type="text"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						placeholder={t("dean.approvals.searchPlaceholder")}
						className="w-full rounded-md border bg-background py-2 pr-3 pl-8 text-sm outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
				<AcademicYearSelect
					value={yearFilter === "all" ? null : yearFilter}
					onChange={(v) => resetAndApply(setYearFilter)(v ?? "all")}
					autoSelectActive
					className="w-[170px]"
				/>
				<ClassSelect
					academicYearId={yearFilter !== "all" ? yearFilter : null}
					value={classFilter === "all" ? null : classFilter}
					onChange={(v) => resetAndApply(setClassFilter)(v ?? "all")}
				/>
			</div>

			{examsQuery.isLoading ? (
				<div className="flex h-48 items-center justify-center">
					<Spinner className="h-8 w-8 text-primary" />
				</div>
			) : submittedExams.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
						<ClipboardCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
					</div>
					<div>
						<p className="font-medium text-foreground">
							{t("dean.approvals.allDone")}
						</p>
						<p className="text-muted-foreground text-sm">
							{t("dean.approvals.noPending")}
						</p>
					</div>
				</div>
			) : (
				<>
					{/* Bulk action bar */}
					<div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
						<div className="flex items-center gap-2">
							<Checkbox
								checked={allSelected}
								onCheckedChange={(checked) => {
									setSelectedIds(
										checked
											? new Set(submittedExams.map((e) => e.id))
											: new Set(),
									);
								}}
							/>
							<span className="text-muted-foreground text-sm">
								{selectedIds.size > 0
									? t("common.selectedCount", { count: selectedIds.size })
									: t("common.selectAll")}
							</span>
						</div>
						{selectedIds.size > 0 && (
							<Button
								size="sm"
								onClick={() => bulkApproveMutation.mutate([...selectedIds])}
								disabled={bulkApproveMutation.isPending}
							>
								<Check className="mr-1 h-3.5 w-3.5" />
								{t("dean.approvals.approveSelection", {
									count: selectedIds.size,
								})}
							</Button>
						)}
					</div>

					<div className="space-y-3">
						{submittedExams.map((exam) => (
							<ExamApprovalCard
								key={exam.id}
								exam={exam}
								selected={selectedIds.has(exam.id)}
								onToggle={() => toggle(exam.id)}
								onApproved={invalidateAndReset}
							/>
						))}
					</div>

					<TablePagination
						page={page}
						pageCount={examsQuery.data?.pageCount ?? 1}
						total={examsQuery.data?.total ?? 0}
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

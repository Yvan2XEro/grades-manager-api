import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowRight,
	BookOpen,
	CheckCircle2,
	ClipboardCheck,
	Clock3,
	ShieldCheck,
	Users,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ClassSelect } from "@/components/inputs/ClassSelect";
import ConfirmModal from "@/components/modals/ConfirmModal";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
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
import { Label } from "@/components/ui/label";
import { TablePagination } from "@/components/ui/table-pagination";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { type RouterOutputs, trpc, trpcClient } from "../../utils/trpc";

type ExamItem = RouterOutputs["exams"]["listPaged"]["items"][number];

type PendingConfirm =
	| { kind: "single"; examId: string; examName: string }
	| { kind: "bulk"; examIds: string[] };

const WorkflowApprovals = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [examPage, setExamPage] = useState(1);
	const [examPageSize, setExamPageSize] = useState(25);
	const [notifPage, setNotifPage] = useState(1);
	const [notifPageSize, setNotifPageSize] = useState(25);

	const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(
		new Set(),
	);
	const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
		null,
	);
	const [rejectTarget, setRejectTarget] = useState<ExamItem | null>(null);
	const [rejectReason, setRejectReason] = useState("");

	// Filters
	const [yearFilter, setYearFilter] = useState<string | null>(null);
	const [classFilter, setClassFilter] = useState<string | null>(null);
	const [dateFrom, setDateFrom] = useState<string>("");

	const resetFilters = () => {
		setExamPage(1);
		setSelectedExamIds(new Set());
	};

	const examsQuery = useQuery(
		trpc.exams.listPaged.queryOptions({
			page: examPage,
			pageSize: examPageSize,
			statuses: ["submitted"],
			academicYearId: yearFilter ?? undefined,
			classId: classFilter ?? undefined,
			dateFrom: dateFrom ? new Date(dateFrom) : undefined,
		}),
	);
	const notificationsQuery = useQuery(
		trpc.notifications.listPaged.queryOptions({
			page: notifPage,
			pageSize: notifPageSize,
			status: "pending",
		}),
	);
	const windowsQuery = useQuery(
		trpc.workflows.enrollmentWindows.queryOptions(),
	);

	const invalidateExams = () =>
		queryClient.invalidateQueries(trpc.exams.listPaged.queryKey());

	const validateExam = useMutation({
		mutationFn: (examId: string) =>
			trpcClient.workflows.validateGrades.mutate({
				examId,
				approverId: undefined,
			}),
		onSuccess: () => {
			toast.success(
				t("dean.workflows.toast.validated", { defaultValue: "Exam approved" }),
			);
			invalidateExams();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const rejectExam = useMutation({
		mutationFn: ({ examId, reason }: { examId: string; reason: string }) =>
			trpcClient.exams.validate.mutate({
				examId,
				status: "rejected",
				rejectionReason: reason,
			}),
		onSuccess: () => {
			toast.success(
				t("dean.workflows.toast.rejected", { defaultValue: "Exam rejected" }),
			);
			setRejectTarget(null);
			setRejectReason("");
			invalidateExams();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const bulkValidateMutation = useMutation({
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
			invalidateExams();
			setSelectedExamIds(new Set());
			toast.success(
				t("dean.workflows.toast.bulkValidated", {
					defaultValue: "Exams approved successfully",
				}),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const toggleExam = (id: string) => {
		setSelectedExamIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const pendingExams = examsQuery.data?.items ?? [];
	const pendingNotifications = notificationsQuery.data?.items ?? [];

	const allExamsSelected =
		pendingExams.length > 0 && selectedExamIds.size === pendingExams.length;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-foreground">{t("dean.workflows.title")}</h1>
					<p className="text-muted-foreground">
						{t("dean.workflows.subtitle")}
					</p>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				{/* ── Pending queue ──────────────────────────────────────────────── */}
				<div className="rounded-xl border-0 bg-card p-6 shadow-sm">
					<h2 className="font-heading font-semibold text-foreground text-lg">
						{t("dean.workflows.queue", { defaultValue: "Submitted exams" })}
					</h2>

					{/* Filters */}
					<div className="mt-3 flex flex-wrap items-center gap-2">
						<AcademicYearSelect
							value={yearFilter}
							onChange={(v) => {
								setYearFilter(v);
								setClassFilter(null);
								resetFilters();
							}}
							className="w-[160px]"
						/>
						<ClassSelect
							academicYearId={yearFilter}
							value={classFilter}
							onChange={(v) => {
								setClassFilter(v);
								resetFilters();
							}}
						/>
						<input
							type="date"
							value={dateFrom}
							onChange={(e) => {
								setDateFrom(e.target.value);
								resetFilters();
							}}
							className="rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
							title={t("dean.workflows.dateFrom", {
								defaultValue: "Submitted from",
							})}
						/>
					</div>

					<BulkActionBar
						selectedCount={selectedExamIds.size}
						onClear={() => setSelectedExamIds(new Set())}
					>
						<Button
							size="sm"
							onClick={() =>
								setPendingConfirm({
									kind: "bulk",
									examIds: [...selectedExamIds],
								})
							}
							disabled={
								bulkValidateMutation.isPending || selectedExamIds.size === 0
							}
						>
							<ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
							{t("dean.workflows.actions.bulkValidate", {
								defaultValue: "Approve all selected",
							})}
						</Button>
					</BulkActionBar>

					<div className="mt-4 space-y-3">
						{pendingExams.length ? (
							<>
								<div className="flex items-center gap-2 px-1">
									<Checkbox
										checked={allExamsSelected}
										onCheckedChange={(checked) => {
											if (checked) {
												setSelectedExamIds(
													new Set(pendingExams.map((e) => e.id)),
												);
											} else {
												setSelectedExamIds(new Set());
											}
										}}
										aria-label="Select all exams"
									/>
									<span className="text-muted-foreground text-xs">
										{t("common.bulkActions.selectAll", {
											defaultValue: "Select all",
										})}
									</span>
								</div>
								{pendingExams.map((exam) => (
									<div key={exam.id} className="rounded-lg bg-muted/50 p-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<Checkbox
													checked={selectedExamIds.has(exam.id)}
													onCheckedChange={() => toggleExam(exam.id)}
													aria-label={`Select ${exam.name}`}
												/>
												<div>
													<p className="font-medium text-foreground text-sm">
														{exam.name}
													</p>
													<div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-muted-foreground text-xs">
														{exam.courseName && (
															<span className="flex items-center gap-1">
																<BookOpen className="h-3 w-3" />
																{exam.courseName}
															</span>
														)}
														{exam.className && (
															<span className="flex items-center gap-1">
																<Users className="h-3 w-3" />
																{exam.className}
															</span>
														)}
														<span>{exam.percentage}%</span>
													</div>
												</div>
											</div>
											<div className="flex shrink-0 gap-1.5">
												<Button
													size="sm"
													variant="outline"
													className="text-destructive hover:bg-destructive/10"
													onClick={() => {
														setRejectTarget(exam);
														setRejectReason("");
													}}
													disabled={rejectExam.isPending}
												>
													<XCircle className="mr-1 h-3.5 w-3.5" />
													{t("dean.workflows.actions.reject", {
														defaultValue: "Reject",
													})}
												</Button>
												<Button
													size="sm"
													onClick={() =>
														setPendingConfirm({
															kind: "single",
															examId: exam.id,
															examName: exam.name,
														})
													}
													disabled={validateExam.isPending}
												>
													<CheckCircle2 className="mr-1 h-3.5 w-3.5" />
													{t("dean.workflows.actions.validate", {
														defaultValue: "Approve",
													})}
												</Button>
											</div>
										</div>
									</div>
								))}
							</>
						) : (
							<p className="text-muted-foreground text-xs">
								{t("dean.workflows.empty", {
									defaultValue: "No pending exams.",
								})}
							</p>
						)}
					</div>
					<TablePagination
						page={examPage}
						pageCount={examsQuery.data?.pageCount ?? 1}
						total={examsQuery.data?.total ?? 0}
						pageSize={examPageSize}
						onPageChange={setExamPage}
						onPageSizeChange={(s) => {
							setExamPageSize(s);
							setExamPage(1);
						}}
					/>
				</div>

				{/* ── Notifications panel ────────────────────────────────────────── */}
				<div className="rounded-xl border-0 bg-card p-6 shadow-sm">
					<h2 className="font-heading font-semibold text-foreground text-lg">
						{t("dean.workflows.notifications", {
							defaultValue: "Workflow notifications",
						})}
					</h2>
					<ul className="mt-4 space-y-2">
						{pendingNotifications.length ? (
							pendingNotifications.map((notification) => (
								<li
									key={notification.id}
									className="flex items-center justify-between rounded-lg bg-primary/5 p-3"
								>
									<div className="flex items-center space-x-3">
										<div className="rounded-full bg-card p-2 text-primary">
											{notification.type.includes("enrollment") ? (
												<Clock3 className="h-5 w-5" />
											) : (
												<ClipboardCheck className="h-5 w-5" />
											)}
										</div>
										<div>
											<p className="font-medium text-foreground">
												{notification.type}
											</p>
											<p className="text-muted-foreground text-xs">
												{JSON.stringify(notification.payload)}
											</p>
										</div>
									</div>
									<ArrowRight className="h-4 w-4 text-muted-foreground/60" />
								</li>
							))
						) : (
							<li className="rounded-lg bg-muted/50 p-3 text-muted-foreground text-sm">
								{t("dean.workflows.notificationsEmpty", {
									defaultValue: "No notifications",
								})}
							</li>
						)}
					</ul>
					<TablePagination
						page={notifPage}
						pageCount={notificationsQuery.data?.pageCount ?? 1}
						total={notificationsQuery.data?.total ?? 0}
						pageSize={notifPageSize}
						onPageChange={setNotifPage}
						onPageSizeChange={(s) => {
							setNotifPageSize(s);
							setNotifPage(1);
						}}
					/>
				</div>
			</div>

			{/* ── Enrollment windows ─────────────────────────────────────────────── */}
			<div className="rounded-xl border-0 bg-card p-6 shadow-sm">
				<h2 className="mb-3 font-heading font-semibold text-foreground text-lg">
					{t("dean.workflows.windows", { defaultValue: "Enrollment windows" })}
				</h2>
				<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
					{windowsQuery.data?.map((window) => (
						<div
							key={window.id}
							className="rounded-lg border px-4 py-3 text-foreground text-sm"
						>
							<p className="font-semibold">{window.classId}</p>
							<p className="text-muted-foreground text-xs">
								{window.academicYearId}
							</p>
							<p className="mt-1 text-primary text-xs uppercase">
								{window.status}
							</p>
						</div>
					))}
				</div>
			</div>

			{/* ── Approve confirm modal ──────────────────────────────────────────── */}
			<ConfirmModal
				isOpen={pendingConfirm !== null}
				onClose={() => setPendingConfirm(null)}
				onConfirm={() => {
					if (!pendingConfirm) return;
					if (pendingConfirm.kind === "single") {
						validateExam.mutate(pendingConfirm.examId);
					} else {
						bulkValidateMutation.mutate(pendingConfirm.examIds);
					}
					setPendingConfirm(null);
				}}
				title={t("dean.workflows.confirm.title", {
					defaultValue: "Approve and lock?",
				})}
				message={
					pendingConfirm?.kind === "bulk"
						? t("dean.workflows.confirm.bulkMessage", {
								count: pendingConfirm.examIds.length,
								defaultValue:
									"You are about to approve and lock {{count}} exam(s). This action is irreversible — grades will no longer be editable.",
							})
						: t("dean.workflows.confirm.singleMessage", {
								name:
									pendingConfirm?.kind === "single"
										? pendingConfirm.examName
										: "",
								defaultValue:
									'Approve and lock "{{name}}"? This action is irreversible — grades will no longer be editable.',
							})
				}
				confirmText={t("dean.workflows.actions.validate", {
					defaultValue: "Approve & lock",
				})}
				isLoading={validateExam.isPending || bulkValidateMutation.isPending}
			/>

			{/* ── Reject dialog ──────────────────────────────────────────────────── */}
			<Dialog
				open={rejectTarget !== null}
				onOpenChange={(open) => {
					if (!open) {
						setRejectTarget(null);
						setRejectReason("");
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{t("dean.workflows.rejectDialog.title", {
								defaultValue: "Reject grades",
							})}
						</DialogTitle>
					</DialogHeader>
					<DialogBody className="space-y-3">
						<p className="text-muted-foreground text-sm">
							{t("dean.workflows.rejectDialog.subtitle", {
								name: rejectTarget?.name ?? "",
								defaultValue:
									'Provide a reason for rejecting "{{name}}". The teacher will see this.',
							})}
						</p>
						<div>
							<Label>{t("admin.exams.rejectReasonLabel")}</Label>
							<Textarea
								className="mt-1"
								rows={3}
								value={rejectReason}
								onChange={(e) => setRejectReason(e.target.value)}
								placeholder={t("admin.exams.rejectReasonPlaceholder")}
							/>
						</div>
					</DialogBody>
					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={() => {
								setRejectTarget(null);
								setRejectReason("");
							}}
						>
							{t("common.cancel")}
						</Button>
						<Button
							variant="destructive"
							disabled={!rejectReason.trim() || rejectExam.isPending}
							onClick={() => {
								if (rejectTarget && rejectReason.trim()) {
									rejectExam.mutate({
										examId: rejectTarget.id,
										reason: rejectReason.trim(),
									});
								}
							}}
						>
							<XCircle className="mr-1.5 h-4 w-4" />
							{t("dean.workflows.actions.reject", { defaultValue: "Reject" })}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default WorkflowApprovals;

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ClipboardCheck, Clock3, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "../../utils/trpc";

const WorkflowApprovals = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const examPagination = useCursorPagination({ pageSize: 20 });
	const notifPagination = useCursorPagination({ pageSize: 20 });
	const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(
		new Set(),
	);

	const examsQuery = useQuery(
		trpc.exams.list.queryOptions({
			cursor: examPagination.cursor,
			limit: examPagination.pageSize,
		}),
	);
	const notificationsQuery = useQuery(
		trpc.notifications.list.queryOptions({
			status: "pending",
			cursor: notifPagination.cursor,
			limit: notifPagination.pageSize,
		}),
	);
	const windowsQuery = useQuery(
		trpc.workflows.enrollmentWindows.queryOptions(),
	);

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
			queryClient.invalidateQueries(trpc.exams.list.queryKey());
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
			queryClient.invalidateQueries(trpc.exams.list.queryKey());
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

	const pendingExams =
		examsQuery.data?.items?.filter((exam) => exam.status === "submitted") ?? [];
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
				<div className="rounded-xl border-0 bg-card p-6 shadow-sm">
					<h2 className="font-heading font-semibold text-foreground text-lg">
						{t("dean.workflows.queue", { defaultValue: "Submitted exams" })}
					</h2>
					<BulkActionBar
						selectedCount={selectedExamIds.size}
						onClear={() => setSelectedExamIds(new Set())}
					>
						<Button
							size="sm"
							onClick={() => bulkValidateMutation.mutate([...selectedExamIds])}
							disabled={bulkValidateMutation.isPending}
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
									<div
										key={exam.id}
										className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
									>
										<div className="flex items-center gap-3">
											<Checkbox
												checked={selectedExamIds.has(exam.id)}
												onCheckedChange={() => toggleExam(exam.id)}
												aria-label={`Select ${exam.name}`}
											/>
											<div>
												<p className="font-medium text-foreground">
													{exam.name}
												</p>
												<p className="text-muted-foreground text-xs">
													{exam.classCourse} • {exam.percentage}%
												</p>
											</div>
										</div>
										<Button
											size="sm"
											onClick={() => validateExam.mutate(exam.id)}
										>
											<ShieldCheck className="mr-1 h-4 w-4" />
											{t("dean.workflows.actions.validate", {
												defaultValue: "Approve & lock",
											})}
										</Button>
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
					<PaginationBar
						hasPrev={examPagination.hasPrev}
						hasNext={!!examsQuery.data?.nextCursor}
						onPrev={examPagination.handlePrev}
						onNext={() =>
							examPagination.handleNext(examsQuery.data?.nextCursor)
						}
						isLoading={examsQuery.isLoading}
					/>
				</div>
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
					<PaginationBar
						hasPrev={notifPagination.hasPrev}
						hasNext={!!notificationsQuery.data?.nextCursor}
						onPrev={notifPagination.handlePrev}
						onNext={() =>
							notifPagination.handleNext(notificationsQuery.data?.nextCursor)
						}
						isLoading={notificationsQuery.isLoading}
					/>
				</div>
			</div>

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
		</div>
	);
};

export default WorkflowApprovals;

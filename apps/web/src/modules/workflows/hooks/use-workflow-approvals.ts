import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { useRowSelection } from "@/hooks/useRowSelection";
import { toast } from "@/lib/toast";
import { RejectExamDialog } from "@/modules/exams/components/reject-exam-dialog";
import { trpc, trpcClient } from "@/utils/trpc";
import type { PagedExam, PendingConfirm } from "../types";

/** Dean workflow queue: submitted exams, pending notifications, windows. */
export function useWorkflowApprovals() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [examPage, setExamPage] = useState(1);
	const [examPageSize, setExamPageSize] = useState(25);
	const [notifPage, setNotifPage] = useState(1);
	const [notifPageSize, setNotifPageSize] = useState(25);

	// Filters
	const [yearFilter, setYearFilter] = useState<string | null>(null);
	const [classFilter, setClassFilter] = useState<string | null>(null);
	const [dateFrom, setDateFrom] = useState<string>("");

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

	const pendingExams = examsQuery.data?.items ?? [];
	const selection = useRowSelection(pendingExams);

	const resetFilters = () => {
		setExamPage(1);
		selection.clear();
	};

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
			selection.clear();
			toast.success(
				t("dean.workflows.toast.bulkValidated", {
					defaultValue: "Exams approved successfully",
				}),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const openReject = async (exam: PagedExam) => {
		const rejected = await RejectExamDialog.call({
			examId: exam.id,
			description: t("dean.workflows.rejectDialog.subtitle", {
				name: exam.name,
				defaultValue:
					'Provide a reason for rejecting "{{name}}". The teacher will see this.',
			}),
			successMessage: t("dean.workflows.toast.rejected", {
				defaultValue: "Exam rejected",
			}),
		});
		if (rejected) invalidateExams();
	};

	const confirmApproval = (pending: PendingConfirm) =>
		confirmAction({
			title: t("dean.workflows.confirm.title", {
				defaultValue: "Approve and lock?",
			}),
			message:
				pending.kind === "bulk"
					? t("dean.workflows.confirm.bulkMessage", {
							count: pending.examIds.length,
							defaultValue:
								"You are about to approve and lock {{count}} exam(s). This action is irreversible — grades will no longer be editable.",
						})
					: t("dean.workflows.confirm.singleMessage", {
							name: pending.examName,
							defaultValue:
								'Approve and lock "{{name}}"? This action is irreversible — grades will no longer be editable.',
						}),
			confirmText: t("dean.workflows.actions.validate", {
				defaultValue: "Approve & lock",
			}),
			onConfirm: () =>
				(pending.kind === "single"
					? validateExam.mutateAsync(pending.examId)
					: bulkValidateMutation.mutateAsync(pending.examIds)
				).catch(() => undefined),
		});

	return {
		filters: {
			yearFilter,
			classFilter,
			dateFrom,
			onYearChange: (v: string | null) => {
				setYearFilter(v);
				setClassFilter(null);
				resetFilters();
			},
			onClassChange: (v: string | null) => {
				setClassFilter(v);
				resetFilters();
			},
			onDateFromChange: (v: string) => {
				setDateFrom(v);
				resetFilters();
			},
		},
		examsQuery,
		pendingExams,
		selection,
		examPage,
		setExamPage,
		examPageSize,
		setExamPageSize: (s: number) => {
			setExamPageSize(s);
			setExamPage(1);
		},
		notifications: notificationsQuery.data,
		notifPage,
		setNotifPage,
		notifPageSize,
		setNotifPageSize: (s: number) => {
			setNotifPageSize(s);
			setNotifPage(1);
		},
		windows: windowsQuery.data,
		validateExam,
		bulkValidateMutation,
		openReject,
		confirmApproval,
	};
}

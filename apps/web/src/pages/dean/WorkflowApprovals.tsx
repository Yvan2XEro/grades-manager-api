import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowRight,
	ClipboardCheck,
	Clock3,
	Lock,
	ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpc, trpcClient } from "../../utils/trpc";

const WorkflowApprovals = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const examsQuery = useQuery(trpc.exams.list.queryOptions({ limit: 100 }));
	const notificationsQuery = useQuery(
		trpc.notifications.list.queryOptions({ status: "pending" }),
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
			queryClient.invalidateQueries(trpc.exams.list.queryKey({ limit: 100 }));
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const pendingExams =
		examsQuery.data?.items?.filter((exam) => exam.status === "submitted") ?? [];
	const pendingNotifications = notificationsQuery.data ?? [];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl text-gray-900">
						{t("dean.workflows.title")}
					</h1>
					<p className="text-gray-600">{t("dean.workflows.subtitle")}</p>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<div className="rounded-xl border bg-white p-6 shadow-sm">
					<h2 className="font-semibold text-gray-900 text-lg">
						{t("dean.workflows.queue", { defaultValue: "Submitted exams" })}
					</h2>
					<div className="mt-4 space-y-3">
						{pendingExams.length ? (
							pendingExams.map((exam) => (
								<div
									key={exam.id}
									className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
								>
									<div>
										<p className="font-medium text-gray-900">{exam.name}</p>
										<p className="text-gray-500 text-xs">
											{exam.classCourse} • {exam.percentage}%
										</p>
									</div>
									<button
										type="button"
										className="flex items-center rounded-lg bg-primary-600 px-3 py-2 font-semibold text-white text-xs"
										onClick={() => validateExam.mutate(exam.id)}
									>
										<ShieldCheck className="mr-1 h-4 w-4" />
										{t("dean.workflows.actions.validate", {
											defaultValue: "Approve & lock",
										})}
									</button>
								</div>
							))
						) : (
							<p className="text-gray-500 text-sm">
								{t("dean.workflows.empty", {
									defaultValue: "No pending exams.",
								})}
							</p>
						)}
					</div>
				</div>
				<div className="rounded-xl border bg-white p-6 shadow-sm">
					<h2 className="font-semibold text-gray-900 text-lg">
						{t("dean.workflows.notifications", {
							defaultValue: "Workflow notifications",
						})}
					</h2>
					<ul className="mt-4 space-y-2">
						{pendingNotifications.length ? (
							pendingNotifications.map((notification) => (
								<li
									key={notification.id}
									className="flex items-center justify-between rounded-lg bg-blue-50 p-3"
								>
									<div className="flex items-center space-x-3">
										<div className="rounded-full bg-white p-2 text-primary-700">
											{notification.type.includes("enrollment") ? (
												<Clock3 className="h-5 w-5" />
											) : (
												<ClipboardCheck className="h-5 w-5" />
											)}
										</div>
										<div>
											<p className="font-medium text-gray-900">
												{notification.type}
											</p>
											<p className="text-gray-500 text-xs">
												{JSON.stringify(notification.payload)}
											</p>
										</div>
									</div>
									<ArrowRight className="h-4 w-4 text-gray-400" />
								</li>
							))
						) : (
							<li className="rounded-lg bg-gray-50 p-3 text-gray-500 text-sm">
								{t("dean.workflows.notificationsEmpty", {
									defaultValue: "No notifications",
								})}
							</li>
						)}
					</ul>
				</div>
			</div>

			<div className="rounded-xl border bg-white p-6 shadow-sm">
				<h2 className="mb-3 font-semibold text-gray-900 text-lg">
					{t("dean.workflows.windows", { defaultValue: "Enrollment windows" })}
				</h2>
				<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
					{windowsQuery.data?.map((window) => (
						<div
							key={window.id}
							className="rounded-lg border px-4 py-3 text-gray-700 text-sm"
						>
							<p className="font-semibold">{window.classId}</p>
							<p className="text-gray-500 text-xs">{window.academicYearId}</p>
							<p className="mt-1 text-primary-700 text-xs uppercase">
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

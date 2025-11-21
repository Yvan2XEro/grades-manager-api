import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpc, trpcClient } from "../../utils/trpc";

const WorkflowManager = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [selectedClassCourse, setSelectedClassCourse] = useState<string>("");

	const { data: classCourses } = useQuery(
		trpc.classCourses.list.queryOptions({ limit: 200 }),
	);

	const examsQuery = useQuery({
		...trpc.exams.list.queryOptions({
			classCourseId: selectedClassCourse || undefined,
		}),
		enabled: Boolean(selectedClassCourse),
	});

	const submitExam = useMutation({
		mutationFn: (examId: string) => trpcClient.exams.submit.mutate({ examId }),
		onSuccess: () => {
			toast.success(
				t("teacher.workflow.toast.submitted", {
					defaultValue: "Exam submitted",
				}),
			);
			queryClient.invalidateQueries(
				trpc.exams.list.queryKey({
					classCourseId: selectedClassCourse || undefined,
				}),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const lockExam = useMutation({
		mutationFn: (examId: string) =>
			trpcClient.exams.lock.mutate({ examId, lock: true }),
		onSuccess: () => {
			toast.success(
				t("teacher.workflow.toast.locked", { defaultValue: "Exam locked" }),
			);
			queryClient.invalidateQueries(
				trpc.exams.list.queryKey({
					classCourseId: selectedClassCourse || undefined,
				}),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const exams = useMemo(() => examsQuery.data?.items ?? [], [examsQuery.data]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl text-gray-900">
					{t("teacher.workflow.title", { defaultValue: "Exam workflow" })}
				</h1>
				<p className="text-gray-600">
					{t("teacher.workflow.subtitle", {
						defaultValue:
							"Submit exams for validation and monitor their status.",
					})}
				</p>
			</div>

			<select
				className="rounded-lg border px-3 py-2"
				value={selectedClassCourse}
				onChange={(event) => setSelectedClassCourse(event.target.value)}
			>
				<option value="">
					{t("teacher.workflow.selectCourse", {
						defaultValue: "Select class course",
					})}
				</option>
				{classCourses?.items?.map((cc) => (
					<option key={cc.id} value={cc.id}>
						{cc.class} • {cc.course}
					</option>
				))}
			</select>

			<div className="rounded-xl border bg-white p-6 shadow-sm">
				{!selectedClassCourse ? (
					<p className="text-gray-500 text-sm">
						{t("teacher.workflow.placeholder", {
							defaultValue: "Choose a class course to view exams.",
						})}
					</p>
				) : examsQuery.isLoading ? (
					<p className="text-gray-500 text-sm">
						{t("common.loading", { defaultValue: "Loading..." })}
					</p>
				) : exams.length ? (
					<div className="space-y-3">
						{exams.map((exam) => (
							<div
								key={exam.id}
								className="flex flex-wrap items-center justify-between rounded-lg border px-4 py-3"
							>
								<div>
									<p className="font-medium text-gray-900">{exam.name}</p>
									<p className="text-gray-500 text-xs">
										{exam.type} • {new Date(exam.date).toLocaleDateString()} •{" "}
										{exam.percentage}%
									</p>
								</div>
								<div className="flex gap-2">
									<button
										type="button"
										className="flex items-center rounded-lg bg-primary-600 px-3 py-2 font-medium text-sm text-white disabled:opacity-50"
										onClick={() => submitExam.mutate(exam.id)}
										disabled={
											exam.status !== "draft" && exam.status !== "scheduled"
										}
									>
										<Send className="mr-1 h-4 w-4" />
										{t("teacher.workflow.actions.submit", {
											defaultValue: "Submit",
										})}
									</button>
									<button
										type="button"
										className="flex items-center rounded-lg bg-emerald-100 px-3 py-2 font-medium text-emerald-800 text-sm disabled:opacity-50"
										onClick={() => lockExam.mutate(exam.id)}
										disabled={exam.isLocked || exam.status !== "approved"}
									>
										<ShieldCheck className="mr-1 h-4 w-4" />
										{t("teacher.workflow.actions.lock", {
											defaultValue: "Lock",
										})}
									</button>
									<span className="flex items-center font-medium text-gray-600 text-xs uppercase">
										<CheckCircle2 className="mr-1 h-4 w-4 text-emerald-600" />
										{exam.status}
									</span>
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="text-gray-500 text-sm">
						{t("teacher.workflow.empty", {
							defaultValue: "No exams for this class course.",
						})}
					</p>
				)}
			</div>
		</div>
	);
};

export default WorkflowManager;

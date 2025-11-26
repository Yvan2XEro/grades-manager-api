import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpc, trpcClient } from "../../utils/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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
				<h1 className="text-2xl font-semibold text-foreground">
					{t("teacher.workflow.title", { defaultValue: "Exam workflow" })}
				</h1>
				<p className="text-muted-foreground">
					{t("teacher.workflow.subtitle", {
						defaultValue:
							"Submit exams for validation and monitor their status.",
					})}
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="class-course">
					{t("teacher.workflow.selectCourse", {
						defaultValue: "Select class course",
					})}
				</Label>
				<Select
					value={selectedClassCourse || undefined}
					onValueChange={(value) => setSelectedClassCourse(value)}
				>
					<SelectTrigger id="class-course">
						<SelectValue
							placeholder={t("teacher.workflow.selectCourse", {
								defaultValue: "Select class course",
							})}
						/>
					</SelectTrigger>
					<SelectContent>
						{classCourses?.items?.map((cc) => (
							<SelectItem key={cc.id} value={cc.id}>
								{cc.class} • {cc.course}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>
						{t("teacher.workflow.title", { defaultValue: "Exam workflow" })}
					</CardTitle>
					<CardDescription>
						{t("teacher.workflow.subtitle", {
							defaultValue:
								"Submit exams for validation and monitor their status.",
						})}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{!selectedClassCourse ? (
						<p className="text-sm text-muted-foreground">
							{t("teacher.workflow.placeholder", {
								defaultValue: "Choose a class course to view exams.",
							})}
						</p>
					) : examsQuery.isLoading ? (
						<p className="text-sm text-muted-foreground">
							{t("common.loading", { defaultValue: "Loading..." })}
						</p>
					) : exams.length ? (
						<div className="space-y-3">
							{exams.map((exam) => (
								<div
									key={exam.id}
									className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
								>
									<div>
										<p className="font-medium text-foreground">{exam.name}</p>
										<p className="text-xs text-muted-foreground">
											{exam.type} • {new Date(exam.date).toLocaleDateString()} •{" "}
											{exam.percentage}%
										</p>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<Button
											type="button"
											size="sm"
											onClick={() => submitExam.mutate(exam.id)}
											disabled={
												exam.status !== "draft" && exam.status !== "scheduled"
											}
										>
											<Send className="mr-1 h-4 w-4" />
											{t("teacher.workflow.actions.submit", {
												defaultValue: "Submit",
											})}
										</Button>
										<Button
											type="button"
											size="sm"
											variant="secondary"
											onClick={() => lockExam.mutate(exam.id)}
											disabled={exam.isLocked || exam.status !== "approved"}
										>
											<ShieldCheck className="mr-1 h-4 w-4" />
											{t("teacher.workflow.actions.lock", {
												defaultValue: "Lock",
											})}
										</Button>
										<Badge variant="outline" className="uppercase">
											<CheckCircle2 className="mr-1 h-4 w-4 text-emerald-600" />
											{exam.status}
										</Badge>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							{t("teacher.workflow.empty", {
								defaultValue: "No exams for this class course.",
							})}
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default WorkflowManager;

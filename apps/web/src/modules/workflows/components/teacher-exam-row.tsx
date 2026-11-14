import { AlertCircle, CheckCircle2, Clock, Send, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TeacherExam } from "../types";

/** Exam of the teacher with its status and the submit action. */
export function TeacherExamRow({
	exam,
	onSubmit,
}: {
	exam: TeacherExam;
	onSubmit: () => void;
}) {
	const { t } = useTranslation();
	const isRejected = exam.status === "rejected";
	const isApproved = exam.status === "approved";
	const isSubmitted = exam.status === "submitted";
	const rejectionReason = exam.rejectionReason;
	return (
		<div
			className={`rounded-lg border px-4 py-3 ${isRejected ? "border-destructive/40 bg-destructive/5" : ""}`}
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="font-medium text-foreground">{exam.name}</p>
					<p className="text-muted-foreground text-xs">
						{exam.type} • {new Date(exam.date).toLocaleDateString()} •{" "}
						{exam.percentage}%
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						size="sm"
						onClick={onSubmit}
						disabled={exam.status !== "draft" && exam.status !== "scheduled"}
					>
						<Send className="mr-1 h-4 w-4" />
						{t("teacher.workflow.actions.submit", {
							defaultValue: "Submit",
						})}
					</Button>
					<Badge
						variant={
							isRejected ? "destructive" : isApproved ? "success" : "outline"
						}
						className="gap-1 uppercase"
					>
						{isApproved && <CheckCircle2 className="h-3.5 w-3.5" />}
						{isRejected && <XCircle className="h-3.5 w-3.5" />}
						{isSubmitted && <Clock className="h-3.5 w-3.5" />}
						{!isApproved && !isRejected && !isSubmitted && (
							<AlertCircle className="h-3.5 w-3.5" />
						)}
						{exam.status}
					</Badge>
				</div>
			</div>
			{isRejected && rejectionReason && (
				<div className="mt-2 flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-destructive text-xs">
					<XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
					<span>
						<span className="font-semibold">
							{t("teacher.workflow.rejectionReason", {
								defaultValue: "Rejection reason",
							})}
							{": "}
						</span>
						{rejectionReason}
					</span>
				</div>
			)}
		</div>
	);
}

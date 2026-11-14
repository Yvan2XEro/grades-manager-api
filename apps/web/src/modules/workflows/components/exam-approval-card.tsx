import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { useExamApproval } from "../hooks/use-exam-approval";
import type { ExamItem } from "../types";
import { DeanRejectExamDialog } from "./dean-reject-exam-dialog";
import { ExamGradesTable } from "./exam-grades-table";
import { ExamMetaLine, ExamTypeTag } from "./exam-meta";

export function ExamApprovalCard({
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
	const { gradesQuery, grades, approveMutation, avg, min, max, below10 } =
		useExamApproval(exam.id, expanded, onApproved);

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
						<ExamTypeTag type={exam.type} />
						<span className="text-muted-foreground text-xs">
							{exam.percentage}%
						</span>
					</div>
					<ExamMetaLine exam={exam} />
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
						onClick={() =>
							DeanRejectExamDialog.call({
								examId: exam.id,
								examName: exam.name,
							})
						}
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
							<ExamGradesTable grades={grades} />
						</>
					)}
				</div>
			)}
		</div>
	);
}

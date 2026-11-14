import { BookOpen, CheckCircle2, Users, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { PagedExam } from "../types";

/** Submitted exam in the dean's workflow queue. */
export function WorkflowExamRow({
	exam,
	selected,
	onToggle,
	onReject,
	onApprove,
	isApproving,
}: {
	exam: PagedExam;
	selected: boolean;
	onToggle: () => void;
	onReject: () => void;
	onApprove: () => void;
	isApproving: boolean;
}) {
	const { t } = useTranslation();
	return (
		<div className="rounded-lg bg-muted/50 p-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Checkbox
						checked={selected}
						onCheckedChange={onToggle}
						aria-label={`Select ${exam.name}`}
					/>
					<div>
						<p className="font-medium text-foreground text-sm">{exam.name}</p>
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
						onClick={onReject}
					>
						<XCircle className="mr-1 h-3.5 w-3.5" />
						{t("dean.workflows.actions.reject", {
							defaultValue: "Reject",
						})}
					</Button>
					<Button size="sm" onClick={onApprove} disabled={isApproving}>
						<CheckCircle2 className="mr-1 h-3.5 w-3.5" />
						{t("dean.workflows.actions.validate", {
							defaultValue: "Approve",
						})}
					</Button>
				</div>
			</div>
		</div>
	);
}

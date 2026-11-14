import { Check, Eye, Lock, Send } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { examStatusVariant } from "@/lib/exam-status";
import { cn } from "@/lib/utils";
import {
	useExamGradesSummary,
	useSubmitExam,
} from "../hooks/use-teacher-courses";
import type { ExamData } from "../types";

/** One exam of a teacher course card: progress, average, status and next action. */
export function CompactExamRow({
	exam,
	studentCount,
	classCourseId,
}: {
	exam: ExamData;
	studentCount: number;
	classCourseId: string;
}) {
	const navigate = useNavigate();
	const gradesQuery = useExamGradesSummary(exam.id);
	const submitMutation = useSubmitExam(exam.id);

	const grades = gradesQuery.data ?? [];
	const graded = grades.length;
	const avg =
		graded > 0
			? (grades.reduce((sum, g) => sum + Number(g.score), 0) / graded).toFixed(
					1,
				)
			: null;
	const allGraded = graded >= studentCount && studentCount > 0;
	const canEnter = !exam.isLocked && ["draft", "open"].includes(exam.status);
	const canSubmit =
		(exam.isLocked && ["draft", "open"].includes(exam.status)) ||
		exam.status === "locked";

	const goToGradeEntry = () => navigate(`/grades/${classCourseId}`);

	const actionButton = () => {
		if (canSubmit)
			return (
				<Button
					size="sm"
					className="h-7 px-2.5 text-xs"
					onClick={() => submitMutation.mutate()}
					disabled={submitMutation.isPending}
				>
					<Send className="mr-1 h-3 w-3" />
					Soumettre
				</Button>
			);
		if (canEnter)
			return (
				<Button
					size="sm"
					variant="outline"
					className="h-7 px-2.5 text-xs"
					onClick={goToGradeEntry}
				>
					Saisir
				</Button>
			);
		return (
			<Button
				size="sm"
				variant="ghost"
				className="h-7 px-2.5 text-muted-foreground text-xs"
				onClick={goToGradeEntry}
			>
				<Eye className="mr-1 h-3 w-3" />
				Voir
			</Button>
		);
	};

	return (
		<div className="flex items-center gap-3 px-4 py-2.5 text-sm">
			<div className="min-w-0 flex-1">
				<span className="font-medium text-foreground text-xs">{exam.name}</span>
				<span className="ml-1 text-muted-foreground text-xs">
					{exam.percentage}%
				</span>
			</div>

			<div className="flex w-14 shrink-0 items-center gap-1">
				<span
					className={cn(
						"font-mono text-xs tabular-nums",
						allGraded
							? "text-emerald-600 dark:text-emerald-400"
							: "text-muted-foreground",
					)}
				>
					{graded}/{studentCount}
				</span>
				{allGraded && <Check className="h-3 w-3 text-emerald-500" />}
			</div>

			<span className="w-14 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
				{avg ? `moy ${avg}` : ""}
			</span>

			<div className="flex shrink-0 items-center gap-2">
				{exam.isLocked && (
					<Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
				)}
				<Badge
					variant={examStatusVariant(exam.status)}
					className="hidden text-xs sm:flex"
				>
					{exam.status}
				</Badge>
				{actionButton()}
			</div>
		</div>
	);
}

import { CheckCircle2, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { RouterOutputs } from "@/utils/trpc";
import { daysUntil, shortMonth, urgencyColor } from "../services/exam-calendar";

type StudentExam = RouterOutputs["exams"]["upcomingForStudent"][number];

const STATUS_BADGES: Record<
	string,
	{
		variant: "success" | "warning" | "outline" | "destructive";
		icon?: ReactNode;
		labelKey: string;
	}
> = {
	approved: {
		variant: "success",
		icon: <CheckCircle2 className="h-3 w-3" />,
		labelKey: "exam.status.approved",
	},
	submitted: { variant: "warning", labelKey: "exam.status.submitted" },
	locked: {
		variant: "outline",
		icon: <Lock className="h-3 w-3" />,
		labelKey: "exam.status.locked",
	},
	draft: { variant: "outline", labelKey: "exam.status.draft" },
};

function ExamStatusBadge({ status }: { status: string }) {
	const { t } = useTranslation();
	const cfg = STATUS_BADGES[status] ?? STATUS_BADGES.draft;
	return (
		<Badge variant={cfg.variant} className="gap-1 text-xs">
			{cfg.icon}
			{t(cfg.labelKey)}
		</Badge>
	);
}

/** Upcoming exam: date tile, name, course and countdown. */
export function UpcomingExamCard({ exam }: { exam: StudentExam }) {
	const { t } = useTranslation();
	return (
		<div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
			<div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-center">
				<span className="font-bold text-lg text-primary tabular-nums leading-none">
					{new Date(exam.date).getDate()}
				</span>
				<span className="text-primary/70 text-xs uppercase">
					{shortMonth(exam.date)}
				</span>
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					<span className="font-semibold text-foreground text-sm">
						{exam.name}
					</span>
					<ExamStatusBadge status={exam.status} />
				</div>
				<p className="mt-0.5 text-muted-foreground text-xs">
					{exam.courseName ?? "—"}
					{exam.className ? ` · ${exam.className}` : ""}
					{exam.percentage ? ` · ${exam.percentage}%` : ""}
				</p>
			</div>
			<div className={`shrink-0 text-right text-xs ${urgencyColor(exam.date)}`}>
				{daysUntil(exam.date, t)}
			</div>
		</div>
	);
}

/** Past exam, dimmed. */
export function PastExamCard({ exam }: { exam: StudentExam }) {
	return (
		<div className="flex items-center gap-4 rounded-xl border bg-card/50 p-3">
			<div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-center">
				<span className="font-semibold text-foreground text-sm tabular-nums leading-none">
					{new Date(exam.date).getDate()}
				</span>
				<span className="text-muted-foreground text-xs uppercase">
					{shortMonth(exam.date)}
				</span>
			</div>
			<div className="min-w-0 flex-1">
				<p className="font-medium text-foreground text-sm">{exam.name}</p>
				<p className="text-muted-foreground text-xs">
					{exam.courseName ?? "—"}
				</p>
			</div>
			<ExamStatusBadge status={exam.status} />
		</div>
	);
}

import { format } from "date-fns";
import { Calendar, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UpcomingExam } from "../../types";

export function UpcomingExamsStrip({ exams }: { exams: UpcomingExam[] }) {
	const { t } = useTranslation();
	if (!exams.length) return null;

	const shown = exams.slice(0, 3);

	function daysLabel(date: string) {
		const d = new Date(date);
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		d.setHours(0, 0, 0, 0);
		const diff = Math.round(
			(d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
		);
		if (diff === 0) return t("student.exams.today");
		if (diff === 1) return t("student.exams.tomorrow");
		if (diff < 0) return format(new Date(date), "dd/MM");
		return `J-${diff}`;
	}

	return (
		<div className="rounded-xl border bg-card p-4 shadow-sm">
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
					<span className="font-semibold text-foreground text-sm">
						{t("student.dashboard.upcomingExams")}
					</span>
					<Badge variant="secondary" className="text-xs">
						{exams.length}
					</Badge>
				</div>
				<Button variant="ghost" size="sm" asChild>
					<Link to="/exams">
						{t("student.dashboard.viewExams")}
						<ChevronRight className="ml-1 h-3 w-3" />
					</Link>
				</Button>
			</div>
			<div className="space-y-2">
				{shown.map((exam) => (
					<div
						key={exam.id}
						className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
					>
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium text-foreground text-sm">
								{exam.courseName}
							</p>
							{exam.examTypeName && (
								<p className="text-muted-foreground text-xs">
									{exam.examTypeName}
								</p>
							)}
						</div>
						<div className="shrink-0 text-right">
							{exam.scheduledAt ? (
								<>
									<p className="font-semibold text-violet-700 text-xs dark:text-violet-400">
										{daysLabel(exam.scheduledAt)}
									</p>
									<p className="text-muted-foreground text-xs">
										{format(new Date(exam.scheduledAt), "dd/MM HH:mm")}
									</p>
								</>
							) : (
								<p className="text-muted-foreground text-xs">
									{t("exam.noDate")}
								</p>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

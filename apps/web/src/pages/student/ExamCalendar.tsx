import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, Calendar, CheckCircle2, Clock, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { trpc } from "../../utils/trpc";

function statusBadge(status: string, t: (k: string) => string) {
	const variants: Record<
		string,
		{
			variant: "success" | "warning" | "outline" | "destructive";
			icon?: React.ReactNode;
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
	const cfg = variants[status] ?? variants.draft;
	return (
		<Badge variant={cfg.variant} className="gap-1 text-xs">
			{cfg.icon}
			{t(cfg.labelKey)}
		</Badge>
	);
}

function daysUntil(date: Date | string, t: (k: string) => string) {
	const d = new Date(date);
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	d.setHours(0, 0, 0, 0);
	const diff = Math.round(
		(d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
	);
	if (diff === 0) return t("student.exams.today");
	if (diff === 1) return t("student.exams.tomorrow");
	if (diff < 0) return `-${Math.abs(diff)}j`;
	return `+${diff}j`;
}

function urgencyColor(date: Date | string) {
	const d = new Date(date);
	const diff = Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
	if (diff < 0) return "text-muted-foreground";
	if (diff <= 3) return "text-destructive font-semibold";
	if (diff <= 7) return "text-amber-600 dark:text-amber-400 font-medium";
	return "text-emerald-600 dark:text-emerald-400";
}

export default function ExamCalendar() {
	const { t } = useTranslation();
	const examsQuery = useQuery(trpc.exams.upcomingForStudent.queryOptions());

	const exams = examsQuery.data ?? [];
	const upcoming = exams.filter((e) => new Date(e.date) >= new Date());
	const past = exams.filter((e) => new Date(e.date) < new Date());

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("student.exams.title")}
				description={
					upcoming.length > 0
						? `${upcoming.length} ${t("student.exams.upcoming").toLowerCase()}`
						: t("student.exams.noExams")
				}
			/>

			{examsQuery.isPending ? (
				<div className="flex h-48 items-center justify-center">
					<Spinner className="h-8 w-8 text-primary" />
				</div>
			) : exams.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
					<Calendar className="h-8 w-8 text-muted-foreground/40" />
					<div>
						<p className="font-medium text-foreground text-sm">
							{t("student.exams.noExams")}
						</p>
						<p className="mt-1 text-muted-foreground text-xs">
							{t("student.exams.noExamsHint")}
						</p>
					</div>
				</div>
			) : (
				<motion.div
					variants={staggerContainer}
					initial="hidden"
					animate="visible"
					className="space-y-8"
				>
					{upcoming.length > 0 && (
						<motion.div variants={staggerItem} className="space-y-3">
							<h2 className="flex items-center gap-2 font-semibold text-base text-foreground">
								<Clock className="h-4 w-4 text-primary" />
								{t("student.exams.upcoming")}
								<span className="font-normal text-muted-foreground text-xs">
									· {upcoming.length}
								</span>
							</h2>
							<div className="space-y-2">
								{upcoming.map((exam) => (
									<div
										key={exam.id}
										className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm"
									>
										<div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-center">
											<span className="font-bold text-lg text-primary tabular-nums leading-none">
												{new Date(exam.date).getDate()}
											</span>
											<span className="text-primary/70 text-xs uppercase">
												{new Date(exam.date).toLocaleDateString("fr-FR", {
													month: "short",
												})}
											</span>
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<span className="font-semibold text-foreground text-sm">
													{exam.name}
												</span>
												{statusBadge(exam.status, t)}
											</div>
											<p className="mt-0.5 text-muted-foreground text-xs">
												{exam.courseName ?? "—"}
												{exam.className ? ` · ${exam.className}` : ""}
												{exam.percentage ? ` · ${exam.percentage}%` : ""}
											</p>
										</div>
										<div
											className={`shrink-0 text-right text-xs ${urgencyColor(exam.date)}`}
										>
											{daysUntil(exam.date, t)}
										</div>
									</div>
								))}
							</div>
						</motion.div>
					)}

					{past.length > 0 && (
						<motion.div variants={staggerItem} className="space-y-3">
							<h2 className="flex items-center gap-2 font-semibold text-muted-foreground text-sm">
								<BookOpen className="h-4 w-4" />
								{t("student.exams.past")}
								<span className="font-normal text-xs">· {past.length}</span>
							</h2>
							<div className="space-y-2 opacity-70">
								{past.slice(0, 5).map((exam) => (
									<div
										key={exam.id}
										className="flex items-center gap-4 rounded-xl border bg-card/50 p-3"
									>
										<div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-center">
											<span className="font-semibold text-foreground text-sm tabular-nums leading-none">
												{new Date(exam.date).getDate()}
											</span>
											<span className="text-muted-foreground text-xs uppercase">
												{new Date(exam.date).toLocaleDateString("fr-FR", {
													month: "short",
												})}
											</span>
										</div>
										<div className="min-w-0 flex-1">
											<p className="font-medium text-foreground text-sm">
												{exam.name}
											</p>
											<p className="text-muted-foreground text-xs">
												{exam.courseName ?? "—"}
											</p>
										</div>
										{statusBadge(exam.status, t)}
									</div>
								))}
							</div>
						</motion.div>
					)}
				</motion.div>
			)}
		</div>
	);
}

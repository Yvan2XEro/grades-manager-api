import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-format";
import { cn } from "@/lib/utils";
import {
	useActivateAcademicYear,
	useCreateNextAcademicYear,
} from "@/modules/academic-years/hooks/use-academic-years";
import { trpc } from "@/utils/trpc";

/**
 * Warns when the active academic year is over and gives the year-end steps
 * in order: close the annual juries, promote and place the students, then
 * activate the next year (created here when missing). Each step shows where
 * it stands and its action.
 */
export function YearEndedAlert() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { data } = useQuery(trpc.academicYears.list.queryOptions({}));
	const createNext = useCreateNextAcademicYear(() => undefined);
	const activateYear = useActivateAcademicYear();

	const years = data?.items ?? [];
	const active = years.find((y) => y.isActive);
	const ended = !!active && new Date(active.endDate).getTime() < Date.now();
	const next = active
		? years
				.filter((y) => new Date(y.startDate) > new Date(active.startDate))
				.sort(
					(a, b) =>
						new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
				)[0]
		: undefined;
	const { data: checklist } = useQuery({
		...trpc.academicYears.activationChecklist.queryOptions({
			id: next?.id ?? "",
		}),
		enabled: ended && !!next,
	});

	if (!active || !ended) return null;

	const missingJuries = checklist?.classesWithoutJury.length ?? 0;
	const juriesDone = !!checklist && missingJuries === 0;
	const studentsDone = !!checklist && checklist.unplacedStudentCount === 0;

	return (
		<div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
			<div className="flex items-start gap-3">
				<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
					<CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-amber-900 text-sm dark:text-amber-200">
						{t("admin.dashboard.yearEnded.title", {
							year: active.name,
							date: formatDate(active.endDate),
						})}
					</p>
					<p className="mt-0.5 text-amber-800 text-xs dark:text-amber-300">
						{t("admin.dashboard.yearEnded.stepsIntro")}
					</p>
				</div>
			</div>
			<ol className="space-y-2">
				<Step
					index={1}
					done={juriesDone}
					title={t("admin.dashboard.yearEnded.steps.juries")}
					status={
						checklist
							? juriesDone
								? t("admin.dashboard.yearEnded.steps.juriesDone")
								: t("admin.dashboard.yearEnded.steps.juriesMissing", {
										count: missingJuries,
										total: checklist.classCount,
									})
							: null
					}
					action={
						<Button
							size="sm"
							variant="outline"
							onClick={() => navigate("/academic-results/deliberations")}
						>
							{t("admin.dashboard.yearEnded.steps.juriesAction")}
						</Button>
					}
				/>
				<Step
					index={2}
					done={studentsDone}
					title={t("admin.dashboard.yearEnded.steps.promote")}
					status={
						!next
							? t("admin.dashboard.yearEnded.steps.promoteNeedsYear")
							: checklist
								? studentsDone
									? t("admin.dashboard.yearEnded.steps.promoteDone", {
											year: next.name,
										})
									: t("admin.dashboard.yearEnded.steps.promoteMissing", {
											count: checklist.unplacedStudentCount,
											year: next.name,
										})
								: null
					}
					action={
						next ? (
							<Button
								size="sm"
								variant="outline"
								onClick={() => navigate("/academic-results/promotion")}
							>
								{t("admin.dashboard.yearEnded.steps.promoteAction")}
							</Button>
						) : (
							<Button
								size="sm"
								disabled={createNext.isPending}
								onClick={() => createNext.mutate(active.id)}
							>
								{t("admin.dashboard.yearEnded.createButton")}
							</Button>
						)
					}
				/>
				<Step
					index={3}
					done={false}
					title={
						next
							? t("admin.dashboard.yearEnded.steps.activate", {
									year: next.name,
								})
							: t("admin.dashboard.yearEnded.steps.activateNext")
					}
					status={t("admin.dashboard.yearEnded.steps.activateHint")}
					action={
						next ? (
							<Button
								size="sm"
								variant={juriesDone && studentsDone ? "default" : "outline"}
								onClick={() => void activateYear({ ...next, isActive: false })}
							>
								{t("admin.dashboard.yearEnded.steps.activateAction")}
							</Button>
						) : null
					}
				/>
			</ol>
		</div>
	);
}

function Step({
	index,
	done,
	title,
	status,
	action,
}: {
	index: number;
	done: boolean;
	title: string;
	status: string | null;
	action: React.ReactNode;
}) {
	return (
		<li className="flex flex-col gap-2 rounded-lg bg-white/60 px-3 py-2 sm:flex-row sm:items-center dark:bg-black/10">
			<div className="flex min-w-0 flex-1 items-start gap-2.5">
				<span
					className={cn(
						"flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-semibold text-[11px]",
						done
							? "bg-emerald-600 text-white"
							: "bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100",
					)}
				>
					{done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index}
				</span>
				<div className="min-w-0">
					<p className="font-medium text-amber-950 text-sm dark:text-amber-100">
						{title}
					</p>
					{status && (
						<p className="text-amber-800 text-xs dark:text-amber-300">
							{status}
						</p>
					)}
				</div>
			</div>
			{action && <div className="shrink-0 sm:ml-auto">{action}</div>}
		</li>
	);
}

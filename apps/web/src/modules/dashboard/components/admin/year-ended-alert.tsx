import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-format";
import { useCreateNextAcademicYear } from "@/modules/academic-years/hooks/use-academic-years";
import { trpc } from "@/utils/trpc";

/**
 * Warns when the active academic year is over: new enrollments, fees and
 * imports keep landing in a finished year until the next one is activated.
 * Offers to create the next year, or to open the years page to activate it.
 */
export function YearEndedAlert() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { data } = useQuery(trpc.academicYears.list.queryOptions({}));
	const createNext = useCreateNextAcademicYear(() =>
		navigate("/academic-years"),
	);

	const years = data?.items ?? [];
	const active = years.find((y) => y.isActive);
	if (!active || new Date(active.endDate).getTime() >= Date.now()) return null;
	const next = years
		.filter((y) => new Date(y.startDate) > new Date(active.startDate))
		.sort(
			(a, b) =>
				new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
		)[0];

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center dark:border-amber-800 dark:bg-amber-900/20">
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
					{next
						? t("admin.dashboard.yearEnded.activateNext", { year: next.name })
						: t("admin.dashboard.yearEnded.createNext")}
				</p>
			</div>
			{next ? (
				<Button
					size="sm"
					variant="outline"
					className="shrink-0"
					onClick={() => navigate("/academic-years")}
				>
					{t("admin.dashboard.yearEnded.openYears")}
				</Button>
			) : (
				<Button
					size="sm"
					className="shrink-0"
					disabled={createNext.isPending}
					onClick={() => createNext.mutate(active.id)}
				>
					{t("admin.dashboard.yearEnded.createButton")}
				</Button>
			)}
		</div>
	);
}

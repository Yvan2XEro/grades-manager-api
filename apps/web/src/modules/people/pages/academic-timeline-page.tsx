import { useQuery } from "@tanstack/react-query";
import { BookOpen, History } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { TimelineEventCard } from "../components/timeline-event-card";
import { groupByYear } from "../services/timeline";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AcademicTimeline() {
	const { t } = useTranslation();
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);

	const { data: events, isPending } = useQuery(
		trpc.students.myTimeline.queryOptions({
			academicYearId: academicYearId ?? undefined,
		}),
	);

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("student.timeline.title")}
				description={t("student.timeline.description")}
			/>
			<div className="w-64">
				<AcademicYearSelect
					value={academicYearId ?? undefined}
					onChange={setAcademicYearId}
					placeholder={t("student.timeline.allAcademicYears")}
				/>
			</div>

			{isPending ? (
				<div className="space-y-4">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-16 w-full rounded-xl" />
					))}
				</div>
			) : !events?.length ? (
				<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
					<History className="h-8 w-8 text-muted-foreground/40" />
					<div>
						<p className="font-medium text-foreground text-sm">
							{t("student.timeline.empty")}
						</p>
						<p className="mt-1 text-muted-foreground text-xs">
							{t("student.timeline.emptyHint")}
						</p>
					</div>
				</div>
			) : (
				<div className="space-y-6">
					{groupByYear(events).map(([year, yearEvents]) => (
						<div key={year}>
							<div className="mb-3 flex items-center gap-2">
								<BookOpen className="h-4 w-4 text-muted-foreground" />
								<h2 className="font-semibold text-base text-foreground">
									{year}
								</h2>
								<span className="text-muted-foreground text-xs">
									{t("student.timeline.eventCount", {
										count: yearEvents.length,
									})}
								</span>
							</div>
							<div>
								{yearEvents.map((event) => (
									<TimelineEventCard key={event.id} event={event} />
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

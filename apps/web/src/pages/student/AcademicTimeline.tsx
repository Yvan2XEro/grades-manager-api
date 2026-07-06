import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	Award,
	BookOpen,
	CheckCircle2,
	GraduationCap,
	History,
	LogIn,
	LogOut,
	RotateCcw,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

// ── Types ─────────────────────────────────────────────────────────────────────

type TimelineEvent = {
	id: string;
	type: "enrollment" | "deliberation" | "fee_cleared" | "promotion";
	date: string;
	academicYear: string | null;
	className: string | null;
	status?: string | null;
	admissionType?: string | null;
	finalDecision?: string | null;
	generalAverage?: number | null;
	mention?: string | null;
};

// ── Icon & colour per event type ──────────────────────────────────────────────

const DECISION_CONFIG: Record<
	string,
	{ variant: "success" | "destructive" | "secondary" | "outline" }
> = {
	admitted: { variant: "success" },
	compensated: { variant: "success" },
	deferred: { variant: "outline" },
	repeat: { variant: "destructive" },
	excluded: { variant: "destructive" },
	pending: { variant: "secondary" },
};

function EventIcon({ event }: { event: TimelineEvent }) {
	const cls = "h-5 w-5";
	if (event.type === "promotion")
		return <GraduationCap className={`${cls} text-emerald-600`} />;
	if (event.type === "fee_cleared")
		return <CheckCircle2 className={`${cls} text-emerald-600`} />;
	if (event.type === "deliberation") {
		if (
			event.finalDecision === "admitted" ||
			event.finalDecision === "compensated"
		)
			return <Award className={`${cls} text-emerald-600`} />;
		if (event.finalDecision === "repeat" || event.finalDecision === "excluded")
			return <XCircle className={`${cls} text-destructive`} />;
		if (event.finalDecision === "deferred")
			return <RotateCcw className={`${cls} text-amber-500`} />;
		return <Award className={`${cls} text-blue-500`} />;
	}
	// enrollment
	if (event.status === "withdrawn")
		return <LogOut className={`${cls} text-muted-foreground`} />;
	if (event.status === "completed" || event.status === "graduated")
		return <GraduationCap className={`${cls} text-primary`} />;
	return <LogIn className={`${cls} text-primary`} />;
}

function dotColor(event: TimelineEvent): string {
	if (event.type === "promotion") return "bg-emerald-500";
	if (event.type === "fee_cleared") return "bg-emerald-500";
	if (event.type === "deliberation") {
		if (
			event.finalDecision === "admitted" ||
			event.finalDecision === "compensated"
		)
			return "bg-emerald-500";
		if (event.finalDecision === "repeat" || event.finalDecision === "excluded")
			return "bg-destructive";
		return "bg-blue-400";
	}
	if (event.status === "withdrawn") return "bg-muted-foreground/40";
	return "bg-primary";
}

// ── Event card ────────────────────────────────────────────────────────────────

function TimelineEventCard({ event }: { event: TimelineEvent }) {
	const { t } = useTranslation();

	function label() {
		if (event.type === "promotion")
			return t("student.timeline.event.promotion");
		if (event.type === "fee_cleared")
			return t("student.timeline.event.fee_cleared");
		if (event.type === "deliberation")
			return t("student.timeline.event.deliberation");
		// enrollment
		if (event.admissionType === "transfer")
			return t("student.timeline.event.enrollment_transfer");
		if (event.status === "active")
			return t("student.timeline.event.enrollment_active");
		if (event.status === "completed")
			return t("student.timeline.event.enrollment_completed");
		if (event.status === "withdrawn")
			return t("student.timeline.event.enrollment_withdrawn");
		return t("student.timeline.event.enrollment");
	}

	return (
		<div className="flex gap-4">
			{/* Dot + connector */}
			<div className="flex flex-col items-center">
				<div
					className={`h-3 w-3 shrink-0 rounded-full border-2 border-background ring-2 ring-border ${dotColor(event)}`}
				/>
				<div className="mt-1 w-px flex-1 bg-border" />
			</div>

			{/* Content */}
			<div className="mb-6 min-w-0 flex-1 pb-1">
				<div className="flex flex-wrap items-start gap-2">
					<div className="flex items-center gap-1.5">
						<EventIcon event={event} />
						<span className="font-semibold text-foreground text-sm">
							{label()}
						</span>
					</div>
					{event.type === "deliberation" && event.finalDecision && (
						<Badge
							variant={
								DECISION_CONFIG[event.finalDecision]?.variant ?? "outline"
							}
							className="text-xs"
						>
							{t(
								`student.timeline.decision.${event.finalDecision}` as Parameters<
									typeof t
								>[0],
								{ defaultValue: event.finalDecision },
							)}
						</Badge>
					)}
				</div>

				<div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground text-xs">
					<span>{format(new Date(event.date), "dd MMM yyyy")}</span>
					{event.academicYear && <span>{event.academicYear}</span>}
					{event.className && <span>{event.className}</span>}
					{event.generalAverage !== null &&
						event.generalAverage !== undefined && (
							<span>
								{t("student.timeline.average")}{" "}
								{event.generalAverage.toFixed(2)}
								/20
							</span>
						)}
					{event.mention && <span>{event.mention}</span>}
				</div>
			</div>
		</div>
	);
}

// ── Group events by year ──────────────────────────────────────────────────────

function groupByYear(events: TimelineEvent[]) {
	const groups = new Map<string, TimelineEvent[]>();
	for (const e of events) {
		const yr = new Date(e.date).getFullYear().toString();
		const list = groups.get(yr) ?? [];
		list.push(e);
		groups.set(yr, list);
	}
	return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

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

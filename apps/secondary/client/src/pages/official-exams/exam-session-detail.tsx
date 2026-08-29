import { Award, ClipboardList, Settings, UserCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

// ─── Constants ────────────────────────────────────────────────────────────────

const EXAM_TYPE_VARIANTS: Record<
	string,
	"default" | "info" | "success" | "warning"
> = {
	BEPC: "info",
	PROBATOIRE: "warning",
	BAC: "success",
};

const EXAM_TYPE_LABELS: Record<string, string> = {
	BEPC: "BEPC",
	PROBATOIRE: "Probatoire",
	BAC: "Baccalauréat",
};

// ─── Shell component ──────────────────────────────────────────────────────────

export function ExamSessionDetail() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();

	const { data: session, isLoading } = trpc.officialExams.getSession.useQuery(
		{ id: id! },
		{ enabled: !!id },
	);

	const TABS = [
		{
			to: `/official-exams/${id}/candidates`,
			label: "official_exams.tab_candidates",
			fallback: "Candidates",
			icon: UserCheck,
		},
		{
			to: `/official-exams/${id}/results`,
			label: "official_exams.tab_results",
			fallback: "Results",
			icon: Award,
		},
		{
			to: `/official-exams/${id}/settings`,
			label: "official_exams.tab_settings",
			fallback: "Settings",
			icon: Settings,
		},
	];

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-8 w-64" />
				<div className="flex gap-4 border-border border-b pb-px">
					{[1, 2].map((i) => (
						<Skeleton key={i} className="h-8 w-24" />
					))}
				</div>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
				<ClipboardList className="h-10 w-10 opacity-30" />
				<p className="font-medium">{t("common.no_data", "Not found")}</p>
			</div>
		);
	}

	const s = session as {
		examType: string;
		series?: string | null;
		sessionYear: number;
		centerCode?: string | null;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="space-y-2">
				<div className="flex items-center gap-3">
					<h1 className="font-bold text-2xl text-foreground">
						{EXAM_TYPE_LABELS[s.examType] ?? s.examType}
						{s.series ? ` – ${s.series}` : ""} {s.sessionYear}
					</h1>
					<Badge variant={EXAM_TYPE_VARIANTS[s.examType] ?? "secondary"}>
						{s.examType}
					</Badge>
					{s.series && <Badge variant="outline">{s.series}</Badge>}
				</div>
				{s.centerCode && (
					<p className="text-muted-foreground text-sm">
						{t("official_exams.center_code", "Center")}: {s.centerCode}
					</p>
				)}
			</div>

			{/* Tab bar — NavLink underline style matching ClassDetail */}
			<div className="flex border-border border-b" role="tablist">
				{TABS.map(({ to, label, fallback, icon: Icon }) => (
					<NavLink
						key={to}
						to={to}
						className={({ isActive }) =>
							cn(
								"inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 font-medium text-sm transition-colors",
								"-mb-px border-b-2 focus-visible:outline-none",
								isActive
									? "border-primary text-foreground"
									: "border-transparent text-muted-foreground hover:text-foreground",
							)
						}
					>
						<Icon className="h-4 w-4" />
						{t(label, fallback)}
					</NavLink>
				))}
			</div>

			<Outlet />
		</div>
	);
}

import {
	AlertCircle,
	CheckCircle2,
	Clock3,
	GraduationCap,
	ShieldCheck,
	UsersRound,
} from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

import { count } from "../services/transition-status";
import type { Summary } from "../types";

function Metric({
	icon,
	label,
	value,
	tone = "muted",
}: {
	icon: React.ReactNode;
	label: string;
	value: number;
	tone?: "success" | "warning" | "danger" | "muted";
}) {
	return (
		<div
			className={cn(
				"rounded-lg border bg-card p-4",
				tone === "success" && "border-emerald-500/30 bg-emerald-500/5",
				tone === "warning" && "border-amber-500/30 bg-amber-500/5",
				tone === "danger" && "border-destructive/30 bg-destructive/5",
			)}
		>
			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				{icon}
				<span>{label}</span>
			</div>
			<div className="mt-2 font-semibold text-2xl">{value}</div>
		</div>
	);
}

/** Per-outcome counters of a transition plan. */
export function TransitionSummaryMetrics({ summary }: { summary: Summary }) {
	const { t } = useTranslation();
	return (
		<div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
			<Metric
				icon={<UsersRound />}
				label={t("admin.academicYearTransitions.summary.total")}
				value={count(summary, "total")}
			/>
			<Metric
				icon={<CheckCircle2 />}
				label={t("admin.academicYearTransitions.summary.promote")}
				value={count(summary, "promote")}
				tone="success"
			/>
			<Metric
				icon={<Clock3 />}
				label={t("admin.academicYearTransitions.summary.repeat")}
				value={count(summary, "repeat")}
				tone="warning"
			/>
			<Metric
				icon={<GraduationCap />}
				label={t("admin.academicYearTransitions.summary.graduate")}
				value={count(summary, "graduate")}
				tone="success"
			/>
			<Metric
				icon={<AlertCircle />}
				label={t("admin.academicYearTransitions.summary.blocked")}
				value={count(summary, "blocked")}
				tone={count(summary, "blocked") > 0 ? "danger" : "muted"}
			/>
			<Metric
				icon={<ShieldCheck />}
				label={t("admin.academicYearTransitions.summary.overridden")}
				value={count(summary, "overridden")}
			/>
		</div>
	);
}

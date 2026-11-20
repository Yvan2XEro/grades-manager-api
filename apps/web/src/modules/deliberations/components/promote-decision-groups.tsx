import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { DecisionGroups } from "../services/decision-groups";

/**
 * The four groups of a class after its jury, with what promotion does to
 * each: shown before confirming.
 */
export function PromoteDecisionGroups({
	groups,
	isLastLevel,
	nextLevelName,
	levelName,
}: {
	groups: DecisionGroups;
	isLastLevel: boolean;
	nextLevelName?: string;
	levelName?: string;
}) {
	const { t } = useTranslation();
	const rows = [
		{
			key: "admitted",
			count: groups.admitted,
			dot: "bg-emerald-500",
			label: t("admin.deliberations.promote.groups.admitted"),
			effect: isLastLevel
				? t("admin.deliberations.promote.groups.admittedGraduate")
				: t("admin.deliberations.promote.groups.admittedEffect", {
						level: nextLevelName ?? "—",
					}),
		},
		{
			key: "repeat",
			count: groups.repeat,
			dot: "bg-amber-500",
			label: t("admin.deliberations.promote.groups.repeat"),
			effect: [
				t("admin.deliberations.promote.groups.repeatEffect", {
					level: levelName ?? "—",
				}),
				groups.deferred > 0
					? t("admin.deliberations.promote.groups.deferredNote", {
							count: groups.deferred,
						})
					: null,
			]
				.filter(Boolean)
				.join(" "),
		},
		...(groups.awaitingRetake > 0
			? [
					{
						key: "awaitingRetake",
						count: groups.awaitingRetake,
						dot: "bg-sky-500",
						label: t("admin.deliberations.promote.groups.awaitingRetake"),
						effect: t(
							"admin.deliberations.promote.groups.awaitingRetakeEffect",
						),
					},
				]
			: []),
		{
			key: "excluded",
			count: groups.excluded,
			dot: "bg-red-500",
			label: t("admin.deliberations.promote.groups.excluded"),
			effect: t("admin.deliberations.promote.groups.excludedEffect"),
		},
		{
			key: "undecided",
			count: groups.undecided,
			dot: "bg-slate-400",
			label: t("admin.deliberations.promote.groups.undecided"),
			effect: t("admin.deliberations.promote.groups.undecidedEffect"),
		},
	];
	return (
		<ul className="divide-y rounded-lg border">
			{rows.map((row) => (
				<li
					key={row.key}
					className={cn(
						"flex items-start gap-3 px-3 py-2 text-sm",
						row.count === 0 && "opacity-50",
					)}
				>
					<span
						className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", row.dot)}
					/>
					<div className="min-w-0 flex-1">
						<p className="font-medium">{row.label}</p>
						<p className="text-muted-foreground text-xs">{row.effect}</p>
					</div>
					<span className="font-semibold tabular-nums">{row.count}</span>
				</li>
			))}
		</ul>
	);
}

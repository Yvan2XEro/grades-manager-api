import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ueDecisionVariants } from "../services/deliberation-status";
import type { UeResult } from "../types";

const UE_INLINE_MAX = 4;

/** UE decisions of a student: inline badges, or per-decision counts that expand. */
export function UeBadgesSummary({ ueResults }: { ueResults: UeResult[] }) {
	const { t } = useTranslation();

	if (ueResults.length === 0)
		return <span className="text-muted-foreground">—</span>;

	const counts: Record<string, number> = {};
	for (const ue of ueResults) {
		counts[ue.decision] = (counts[ue.decision] ?? 0) + 1;
	}

	const renderBadge = (ue: UeResult) => (
		<Badge
			key={ue.ueId}
			variant={ueDecisionVariants[ue.decision] ?? "outline"}
			className="px-1.5 py-0 text-[10px]"
			title={`${ue.ueName} (${ue.ueAverage != null ? Number(ue.ueAverage).toFixed(2) : "—"}/20)`}
		>
			{ue.ueCode}: {ue.decision}
		</Badge>
	);

	if (ueResults.length <= UE_INLINE_MAX) {
		return (
			<div className="flex flex-wrap gap-1">{ueResults.map(renderBadge)}</div>
		);
	}

	return (
		<Collapsible>
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className="flex items-center gap-1.5 text-muted-foreground text-xs hover:text-foreground"
				>
					<div className="flex gap-1">
						{Object.entries(counts).map(([decision, count]) => (
							<Badge
								key={decision}
								variant={ueDecisionVariants[decision] ?? "outline"}
								className="px-1.5 py-0 text-[10px]"
							>
								{count}{" "}
								{t(`admin.deliberations.ueDecision.${decision}`, {
									defaultValue: decision,
								})}
							</Badge>
						))}
					</div>
					<ChevronDown className="h-3 w-3" />
				</button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="mt-1.5 flex flex-wrap gap-1">
					{ueResults.map(renderBadge)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

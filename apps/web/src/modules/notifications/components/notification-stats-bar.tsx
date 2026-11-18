import { AlertTriangle, CheckCircle2, Clock, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { RouterOutputs } from "@/utils/trpc";
import type { StatusFilter } from "../types";

type Stats = RouterOutputs["notifications"]["stats"];

/** Counts per delivery status; a click filters the list on that status. */
export function NotificationStatsBar({
	stats: statsData,
	onSelect,
}: {
	stats: Stats;
	onSelect: (status: StatusFilter) => void;
}) {
	const { t } = useTranslation();
	return (
		<div className="grid grid-cols-4 gap-3">
			{(
				[
					{
						key: "pending",
						labelKey: "admin.notifications.status.pending",
						icon: <Clock className="h-4 w-4" />,
						color: "text-muted-foreground",
					},
					{
						key: "retrying",
						labelKey: "admin.notifications.status.retrying",
						icon: <RotateCcw className="h-4 w-4" />,
						color: "text-amber-600",
					},
					{
						key: "failed",
						labelKey: "admin.notifications.status.failed",
						icon: <AlertTriangle className="h-4 w-4" />,
						color: "text-destructive",
					},
					{
						key: "sent",
						labelKey: "admin.notifications.status.sent",
						icon: <CheckCircle2 className="h-4 w-4" />,
						color: "text-primary",
					},
				] as const
			).map(({ key, labelKey, icon, color }) => (
				<button
					key={key}
					type="button"
					onClick={() => onSelect(key)}
					className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/40"
				>
					<span className={color}>{icon}</span>
					<div>
						<p className="font-semibold text-foreground text-lg leading-none">
							{statsData[key]}
						</p>
						<p className="mt-0.5 text-muted-foreground text-xs">
							{t(labelKey)}
						</p>
					</div>
				</button>
			))}
		</div>
	);
}

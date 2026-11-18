import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { staggerItem } from "@/lib/animations";
import { projectionBarColor } from "../../services/score-styles";

/** End-of-year projection: share of graded UEs currently validated. */
export function ProjectionCard({
	projectionRate,
	onTrackUnits,
	gradedUnitCount,
}: {
	projectionRate: number;
	onTrackUnits: number;
	gradedUnitCount: number;
}) {
	const { t } = useTranslation();
	return (
		<motion.div
			variants={staggerItem}
			className="rounded-xl border bg-card p-4 shadow-sm"
		>
			<div className="mb-2 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
					<span className="font-medium text-foreground text-sm">
						{t("student.performance.projection")}
					</span>
				</div>
				<span className="font-semibold text-foreground text-sm tabular-nums">
					{onTrackUnits}/{gradedUnitCount} UE
				</span>
			</div>
			<div className="h-2 w-full overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/30">
				<motion.div
					className={`h-full rounded-full ${projectionBarColor(projectionRate)}`}
					initial={{ width: 0 }}
					animate={{ width: `${projectionRate}%` }}
					transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
				/>
			</div>
			<p className="mt-2 text-muted-foreground text-xs">
				{t("student.performance.projectionNote", {
					rate: projectionRate,
				})}
			</p>
		</motion.div>
	);
}

import { motion } from "framer-motion";
import {
	Award,
	ChevronDown,
	ChevronUp,
	History,
	Hourglass,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { staggerItem } from "@/lib/animations";
import type { DecisionResult } from "../../types";

import { DeliberationDecisionCard } from "./deliberation-decision-card";

function DecisionsPendingCard() {
	const { t } = useTranslation();
	return (
		<div className="flex items-start gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-800 dark:bg-blue-950/30">
			<Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-blue-500 dark:text-blue-400" />
			<div>
				<p className="font-semibold text-foreground text-sm">
					{t("student.performance.pendingResults")}
				</p>
				<p className="mt-0.5 text-muted-foreground text-xs">
					{t("student.performance.pendingResultsHint")}
				</p>
			</div>
		</div>
	);
}

/** Deliberation decisions: the latest one, older ones behind a toggle. */
export function DecisionsSection({
	decisions,
}: {
	decisions: DecisionResult[];
}) {
	const { t } = useTranslation();
	const [historyOpen, setHistoryOpen] = useState(false);
	const latestDecision = decisions[0] ?? null;
	const olderDecisions = decisions.slice(1);

	return (
		<motion.div variants={staggerItem} className="space-y-3">
			<h2 className="flex items-center gap-2 font-semibold text-base text-foreground">
				<Award className="h-4 w-4 text-muted-foreground" />
				{t("student.performance.decisions")}
			</h2>
			{decisions.length === 0 ? (
				<DecisionsPendingCard />
			) : (
				<div className="space-y-2">
					<DeliberationDecisionCard
						decision={latestDecision!}
						isLatest={decisions.length > 1}
					/>
					{olderDecisions.length > 0 && (
						<>
							<button
								type="button"
								className="flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-left text-muted-foreground text-xs transition-colors hover:bg-muted/20"
								onClick={() => setHistoryOpen((p) => !p)}
							>
								<History className="h-3.5 w-3.5" />
								<span>
									{t("student.performance.decisionHistory")} (
									{olderDecisions.length})
								</span>
								{historyOpen ? (
									<ChevronUp className="ml-auto h-3.5 w-3.5" />
								) : (
									<ChevronDown className="ml-auto h-3.5 w-3.5" />
								)}
							</button>
							{historyOpen &&
								olderDecisions.map((d) => (
									<DeliberationDecisionCard key={d.id} decision={d} />
								))}
						</>
					)}
				</div>
			)}
		</motion.div>
	);
}

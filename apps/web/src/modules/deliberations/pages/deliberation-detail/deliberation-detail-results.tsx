import {
	AlertTriangle,
	CheckCircle2,
	ExternalLink,
	UserCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-format";
import { DeliberationResultsTable } from "../../components/deliberation-results-table";
import { DeliberationStatsCards } from "../../components/deliberation-stats-cards";
import { useDeliberationContext } from "../../hooks/use-deliberation-context";
import { isIncompleteResult } from "../../services/deliberation-status";
import type { StudentResult } from "../../types";

/** Amber banner listing students whose decision the jury still has to give. */
function PendingBanner({
	title,
	hint,
	results,
}: {
	title: string;
	hint: string;
	results: StudentResult[];
}) {
	return (
		<div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800/40 dark:bg-amber-900/20">
			<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
			<div className="text-sm">
				<p className="font-semibold text-amber-900 dark:text-amber-200">
					{title}
				</p>
				<p className="mt-0.5 text-amber-800 text-xs dark:text-amber-300">
					{hint}
				</p>
				<p className="mt-1 text-amber-900 text-xs dark:text-amber-200">
					{results
						.map((r) =>
							`${r.student?.profile?.lastName ?? ""} ${r.student?.profile?.firstName ?? ""}`.trim(),
						)
						.join(" · ")}
				</p>
			</div>
		</div>
	);
}

export default function DeliberationResultsTab() {
	const { t } = useTranslation();
	const {
		delib,
		isOpen,
		isClosed,
		isSigned,
		overrideDecision,
		promoteAdmitted,
	} = useDeliberationContext();

	const stats = delib.stats;
	const results = delib.studentResults ?? [];
	const pending = results.filter(
		(r) => (r.finalDecision ?? "pending") === "pending",
	);
	// Missing marks, or complete results no rule of the institution decided
	const incomplete = pending.filter((r) => isIncompleteResult(r));
	const undecided = pending.filter((r) => !isIncompleteResult(r));
	const promotion = delib.promotion;

	return (
		<div className="space-y-6 pt-6">
			{/* Students the jury still has to decide on */}
			{incomplete.length > 0 && (
				<PendingBanner
					title={t("admin.deliberations.incomplete.title", {
						count: incomplete.length,
					})}
					hint={
						isOpen
							? t("admin.deliberations.incomplete.hintOpen")
							: t("admin.deliberations.incomplete.hintClosed")
					}
					results={incomplete}
				/>
			)}
			{undecided.length > 0 && (
				<PendingBanner
					title={t("admin.deliberations.undecided.title", {
						count: undecided.length,
					})}
					hint={
						isOpen
							? t("admin.deliberations.undecided.hintOpen")
							: t("admin.deliberations.undecided.hintClosed")
					}
					results={undecided}
				/>
			)}

			{/* Promotion — when closed or signed */}
			{(isClosed || isSigned) && (
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-emerald-50 px-5 py-4 dark:bg-emerald-900/20">
					<div className="flex items-start gap-3">
						<CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
						<div>
							<p className="font-semibold text-emerald-900 text-sm dark:text-emerald-200">
								{promotion
									? t("admin.deliberations.promote.doneAt", {
											date: formatDate(promotion.at, "PPp"),
										})
									: t("admin.deliberations.promote.ctaTitle")}
							</p>
							{promotion ? (
								<ul className="mt-1 space-y-0.5 text-emerald-800 text-xs dark:text-emerald-300">
									{promotion.promotedCount > 0 && (
										<li>
											{promotion.graduated
												? t("admin.deliberations.promote.result.graduated", {
														count: promotion.promotedCount,
													})
												: t("admin.deliberations.promote.result.promotedTo", {
														count: promotion.promotedCount,
														className: promotion.targetClassName ?? "—",
													})}
										</li>
									)}
									{promotion.repeatCount > 0 && (
										<li>
											{t("admin.deliberations.promote.result.repeatingIn", {
												count: promotion.repeatCount,
												className: promotion.repeatClassName ?? "—",
											})}
										</li>
									)}
									{promotion.excludedCount > 0 && (
										<li>
											{t("admin.deliberations.promote.result.excluded", {
												count: promotion.excludedCount,
											})}
										</li>
									)}
									{promotion.repeatUnplacedCount + promotion.undecidedCount >
										0 && (
										<li>
											{t("admin.deliberations.promote.result.stillToPlace", {
												count:
													promotion.repeatUnplacedCount +
													promotion.undecidedCount,
											})}{" "}
											<Link
												to="/academic-results/promotion"
												className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
											>
												{t("admin.deliberations.promote.yearTransitionLink")}
												<ExternalLink className="h-3 w-3" />
											</Link>
										</li>
									)}
								</ul>
							) : (
								<p className="mt-0.5 text-emerald-700 text-xs dark:text-emerald-300">
									{t("admin.deliberations.promote.ctaDesc")}
								</p>
							)}
						</div>
					</div>
					{!promotion && (
						<Button onClick={promoteAdmitted}>
							<UserCheck className="mr-2 h-4 w-4" />
							{t("admin.deliberations.promote.button")}
						</Button>
					)}
				</div>
			)}

			{stats && <DeliberationStatsCards stats={stats} />}

			<DeliberationResultsTable
				results={results}
				isOpen={isOpen}
				onOverride={overrideDecision}
			/>
		</div>
	);
}

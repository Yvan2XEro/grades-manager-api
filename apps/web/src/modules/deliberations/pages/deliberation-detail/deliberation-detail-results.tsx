import { CheckCircle2, UserCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DeliberationResultsTable } from "../../components/deliberation-results-table";
import { DeliberationStatsCards } from "../../components/deliberation-stats-cards";
import { useDeliberationContext } from "../../hooks/use-deliberation-context";

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

	return (
		<div className="space-y-6 pt-6">
			{/* Promote CTA — when closed or signed */}
			{(isClosed || isSigned) && (
				<div className="flex items-center justify-between rounded-xl border bg-emerald-50 px-5 py-4 dark:bg-emerald-900/20">
					<div className="flex items-center gap-3">
						<CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
						<div>
							<p className="font-semibold text-emerald-900 text-sm dark:text-emerald-200">
								{t("admin.deliberations.promote.ctaTitle", {
									defaultValue: "Promote admitted students",
								})}
							</p>
							<p className="mt-0.5 text-emerald-700 text-xs dark:text-emerald-300">
								{t("admin.deliberations.promote.ctaDesc", {
									defaultValue:
										"Students with an 'Admitted' decision can be promoted to the next academic level.",
								})}
							</p>
						</div>
					</div>
					<Button onClick={promoteAdmitted}>
						<UserCheck className="mr-2 h-4 w-4" />
						{t("admin.deliberations.promote.button")}
					</Button>
				</div>
			)}

			{stats && <DeliberationStatsCards stats={stats} />}

			<DeliberationResultsTable
				results={delib.studentResults ?? []}
				isOpen={isOpen}
				onOverride={overrideDecision}
			/>
		</div>
	);
}

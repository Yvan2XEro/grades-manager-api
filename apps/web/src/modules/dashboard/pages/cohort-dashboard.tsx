import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { CohortCard } from "../components/cohort/cohort-card";
import { CohortKpis } from "../components/cohort/cohort-kpis";
import { useCohortAnalytics } from "../hooks/use-cohort-analytics";

/** Home page of deans: grading progress and results per cohort. */
export default function CohortDashboard() {
	const { t } = useTranslation();
	const { isPending, cohorts, ...totals } = useCohortAnalytics();

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("dean.cohort.title")}
				description={t("dean.cohort.subtitle")}
			/>

			{isPending ? (
				<div className="flex h-48 items-center justify-center">
					<Spinner className="h-8 w-8 text-primary" />
				</div>
			) : (
				<motion.div
					variants={staggerContainer}
					initial="hidden"
					animate="visible"
					className="space-y-6"
				>
					<CohortKpis {...totals} />

					{cohorts.length === 0 ? (
						<motion.div variants={staggerItem}>
							<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
								<BarChart3 className="h-8 w-8 text-muted-foreground/40" />
								<div>
									<p className="font-medium text-foreground text-sm">
										{t("dean.cohort.noData")}
									</p>
									<p className="mt-1 text-muted-foreground text-xs">
										{t("dean.cohort.noDataHint")}
									</p>
								</div>
							</div>
						</motion.div>
					) : (
						<motion.div
							variants={staggerItem}
							className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
						>
							{cohorts.map((cohort) => (
								<CohortCard key={cohort.classId} cohort={cohort} />
							))}
						</motion.div>
					)}
				</motion.div>
			)}
		</div>
	);
}

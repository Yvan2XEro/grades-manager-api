import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { staggerItem } from "@/lib/animations";
import { SummaryCard } from "./summary-card";

export function StudentSummaryCards({
	overallAvg,
	creditsEarned,
	creditsRequired,
	creditsInProgress,
	validatedUnits,
	totalUnits,
}: {
	overallAvg: number;
	creditsEarned: number;
	creditsRequired: number;
	creditsInProgress: number;
	validatedUnits: number;
	totalUnits: number;
}) {
	const { t } = useTranslation();
	return (
		<motion.div
			variants={staggerItem}
			className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
		>
			<SummaryCard
				icon={<Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
				label={t("student.performance.generalAverage")}
				value={`${overallAvg.toFixed(2)} / 20`}
				sub={
					overallAvg >= 10
						? t("student.performance.aboveThreshold")
						: t("student.performance.belowThreshold")
				}
				color="bg-amber-50 dark:bg-amber-900/20"
			/>
			<SummaryCard
				icon={<GraduationCap className="h-5 w-5 text-primary" />}
				label={t("student.performance.creditsEarned")}
				value={`${creditsEarned} / ${creditsRequired || "?"}`}
				sub={
					creditsInProgress > 0
						? `${creditsInProgress} ${t("student.performance.inProgress")}`
						: undefined
				}
				color="bg-primary/10"
			/>
			<SummaryCard
				icon={
					<BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" />
				}
				label={t("student.performance.validatedUEs")}
				value={`${validatedUnits} / ${totalUnits}`}
				sub={t("student.performance.teachingUnits")}
				color="bg-violet-50 dark:bg-violet-900/20"
			/>
		</motion.div>
	);
}

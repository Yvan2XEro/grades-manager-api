import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { fadeUp } from "@/lib/animations";

export function AdminDashboardHeader({
	activeYearName,
	yearId,
	onYearChange,
}: {
	activeYearName: string;
	yearId: string | null;
	onYearChange: (id: string | null) => void;
}) {
	const { t } = useTranslation();
	return (
		<motion.div
			variants={fadeUp}
			initial="hidden"
			animate="visible"
			className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
		>
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("admin.dashboard.title")}
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					{t("admin.dashboard.subtitle", {
						defaultValue: "Vue d'ensemble de l'institution",
					})}
				</p>
			</div>
			<div className="flex items-center gap-3">
				<motion.div
					whileHover={{ scale: 1.02 }}
					transition={{ duration: 0.15 }}
					className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5"
				>
					<Calendar className="h-4 w-4 text-primary" />
					<span className="font-semibold text-primary text-sm">
						{activeYearName}
					</span>
				</motion.div>
				<div className="w-48">
					<AcademicYearSelect
						value={yearId}
						onChange={onYearChange}
						allowAll
						allLabel={t("common.allYears", { defaultValue: "Toutes" })}
						autoSelectActive={false}
					/>
				</div>
			</div>
		</motion.div>
	);
}

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { staggerItem } from "@/lib/animations";
import type { UEData } from "../../types";
import { UERow } from "./ue-row";

export function TranscriptSection({ units }: { units: UEData[] }) {
	const { t } = useTranslation();
	return (
		<motion.div variants={staggerItem} className="space-y-3">
			<h2 className="flex items-center gap-2 font-semibold text-base text-foreground">
				<BookOpen className="h-4 w-4 text-muted-foreground" />
				{t("student.performance.transcript")}
				{units.length > 0 && (
					<span className="font-normal text-muted-foreground text-xs">
						· {units.length} UE{units.length > 1 ? "s" : ""}
					</span>
				)}
			</h2>

			{units.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
					<BookOpen className="h-8 w-8 text-muted-foreground/40" />
					<div>
						<p className="font-medium text-foreground text-sm">
							{t("student.performance.noGrades")}
						</p>
						<p className="mt-1 text-muted-foreground text-xs">
							{t("student.performance.noGradesHint")}
						</p>
					</div>
				</div>
			) : (
				<div className="space-y-2">
					{units.map((unit) => (
						<UERow key={unit.id} unit={unit} />
					))}
				</div>
			)}
		</motion.div>
	);
}

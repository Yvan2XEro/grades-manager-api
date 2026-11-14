import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { staggerItem } from "@/lib/animations";

/** Shown while the latest fee assignment is not cleared. */
export function PendingFeesBanner() {
	const { t } = useTranslation();
	return (
		<motion.div
			variants={staggerItem}
			className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20"
		>
			<AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
			<div className="flex-1 text-amber-800 text-sm dark:text-amber-300">
				{t("student.dashboard.pendingFees")}
			</div>
			<Button variant="outline" size="sm" className="shrink-0" asChild>
				<Link to="/fees">{t("student.dashboard.viewFees")}</Link>
			</Button>
		</motion.div>
	);
}

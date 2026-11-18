import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { staggerItem } from "@/lib/animations";

export function CreditProgressCard({
	creditProgress,
	creditsEarned,
	creditsRequired,
}: {
	creditProgress: number;
	creditsEarned: number;
	creditsRequired: number;
}) {
	const { t } = useTranslation();
	return (
		<motion.div
			variants={staggerItem}
			className="rounded-xl border bg-card p-4 shadow-sm"
		>
			<div className="mb-2 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<TrendingUp className="h-4 w-4 text-primary" />
					<span className="font-medium text-foreground text-sm">
						{t("student.performance.creditProgress")}
					</span>
				</div>
				<span className="font-semibold text-foreground text-sm tabular-nums">
					{creditProgress.toFixed(0)}%
				</span>
			</div>
			<div className="h-2.5 w-full overflow-hidden rounded-full bg-primary/10">
				<motion.div
					className="h-full rounded-full bg-primary"
					initial={{ width: 0 }}
					animate={{ width: `${creditProgress}%` }}
					transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
				/>
			</div>
			{creditsEarned >= creditsRequired && (
				<div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
					<ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
					<p className="font-medium text-xs">
						{t("student.performance.creditsEligible")}
					</p>
				</div>
			)}
		</motion.div>
	);
}

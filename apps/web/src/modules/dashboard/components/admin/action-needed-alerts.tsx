import { motion } from "framer-motion";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { Link } from "react-router";

/** Banners linking to exams awaiting approval and open deliberations. */
export function ActionNeededAlerts({
	examsPending,
	deliberationsOpen,
}: {
	examsPending: number;
	deliberationsOpen: number;
}) {
	if (examsPending <= 0 && deliberationsOpen <= 0) return null;
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="grid gap-3 sm:grid-cols-2"
		>
			{examsPending > 0 && (
				<Link to="/exams/list?status=submitted">
					<div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:hover:bg-amber-900/30">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
							<CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="font-semibold text-amber-900 text-sm dark:text-amber-200">
								{examsPending} examen
								{examsPending > 1 ? "s" : ""} en attente d'approbation
							</p>
							<p className="mt-0.5 text-amber-700 text-xs dark:text-amber-400">
								Voir les examens soumis →
							</p>
						</div>
					</div>
				</Link>
			)}
			{deliberationsOpen > 0 && (
				<Link to="/academic-results/deliberations">
					<div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
							<ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="font-semibold text-blue-900 text-sm dark:text-blue-200">
								{deliberationsOpen} délibération
								{deliberationsOpen > 1 ? "s" : ""} en cours
							</p>
							<p className="mt-0.5 text-blue-700 text-xs dark:text-blue-400">
								Voir les délibérations →
							</p>
						</div>
					</div>
				</Link>
			)}
		</motion.div>
	);
}

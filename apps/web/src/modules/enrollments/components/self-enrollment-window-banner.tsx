import { CheckCircle2, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Tells the student whether the enrollment window of their class is open. */
export function SelfEnrollmentWindowBanner({
	open: openWindow,
}: {
	open: boolean;
}) {
	const { t } = useTranslation();
	return (
		<div
			className={`flex items-center gap-3 rounded-xl border p-4 ${
				openWindow
					? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
					: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
			}`}
		>
			{openWindow ? (
				<CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
			) : (
				<Lock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
			)}
			<div>
				<p
					className={`font-semibold text-sm ${openWindow ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"}`}
				>
					{openWindow
						? t("student.enrollments.windowOpen")
						: t("student.enrollments.windowClosed")}
				</p>
				<p
					className={`text-xs ${openWindow ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}
				>
					{openWindow
						? t("student.enrollments.windowOpenHint")
						: t("student.enrollments.windowClosedHint")}
				</p>
			</div>
		</div>
	);
}

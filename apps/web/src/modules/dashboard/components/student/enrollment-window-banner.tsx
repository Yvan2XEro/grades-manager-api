import { CalendarCheck, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function EnrollmentWindowBanner() {
	const { t } = useTranslation();
	return (
		<div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30">
			<CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
			<div className="min-w-0 flex-1">
				<p className="font-semibold text-emerald-800 text-sm dark:text-emerald-300">
					{t("student.enrollment.windowOpen")}
				</p>
				<p className="mt-0.5 text-emerald-700 text-xs dark:text-emerald-400">
					{t("student.enrollment.windowOpenHint")}
				</p>
			</div>
			<Button variant="outline" size="sm" className="shrink-0" asChild>
				<Link to="/enrollments">
					{t("student.enrollment.enroll")}
					<ChevronRight className="ml-1 h-3 w-3" />
				</Link>
			</Button>
		</div>
	);
}

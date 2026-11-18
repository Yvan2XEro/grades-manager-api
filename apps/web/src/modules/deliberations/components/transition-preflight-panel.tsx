import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CreateTransitionPlanState } from "../hooks/use-academic-year-transitions";

/** Pre-flight diagnostic of a transition plan before it is created. */
export function TransitionPreflightPanel({
	readiness,
}: {
	readiness: NonNullable<CreateTransitionPlanState["readiness"]>;
}) {
	const { t } = useTranslation();
	const rows = [
		{
			label: t("admin.academicYearTransitions.readiness.enrollments"),
			value: readiness.enrollmentCount,
			warn: readiness.enrollmentCount === 0,
		},
		{
			label: t("admin.academicYearTransitions.readiness.signedDelibs"),
			value: `${readiness.signedDeliberationCount}/${readiness.classCount}`,
			warn: readiness.missingDeliberationClassCount > 0,
		},
		{
			label: t("admin.academicYearTransitions.readiness.unlockedExams"),
			value: readiness.unlockedApprovedExamCount,
			warn: readiness.unlockedApprovedExamCount > 0,
		},
		{
			label: t("admin.academicYearTransitions.readiness.incompleteCourses"),
			value: readiness.incompleteStudentCourseCount,
			warn: readiness.incompleteStudentCourseCount > 0,
		},
	];

	return (
		<div className="space-y-1.5 rounded-md border bg-muted/30 p-3">
			<p className="mb-2 font-medium text-foreground text-xs">
				{t("admin.academicYearTransitions.readiness.preflightTitle")}
			</p>
			{rows.map((row) => (
				<div
					key={row.label}
					className="flex items-center justify-between gap-2 text-xs"
				>
					<span className="flex items-center gap-1 text-muted-foreground">
						{row.warn ? (
							<AlertTriangle className="size-3 shrink-0 text-amber-500" />
						) : (
							<CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
						)}
						{row.label}
					</span>
					<span
						className={
							row.warn
								? "font-semibold text-amber-600"
								: "font-medium text-foreground"
						}
					>
						{row.value}
					</span>
				</div>
			))}
		</div>
	);
}

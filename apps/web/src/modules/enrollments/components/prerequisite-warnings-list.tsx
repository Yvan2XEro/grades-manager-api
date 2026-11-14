import type { TFunction } from "i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
	buildCourseLabel,
	getWarningMeta,
	resolveWarningCategory,
} from "../services/prerequisite-warnings";
import type { PrerequisiteWarning } from "../types";

export const PrerequisiteWarningsList = ({
	warnings,
	t,
	showDescription = true,
}: {
	warnings: PrerequisiteWarning[];
	t: TFunction<"translation", undefined>;
	showDescription?: boolean;
}) => {
	if (!warnings.length) return null;
	const alertClass = showDescription
		? "border-amber-200 bg-amber-50 text-amber-900"
		: "border-amber-200 bg-amber-50 text-amber-900 text-xs sm:text-sm";
	return (
		<Alert className={alertClass}>
			<AlertTitle className="font-semibold text-sm">
				{t("admin.enrollments.warnings.title", {
					defaultValue: "Prerequisite warnings",
				})}
			</AlertTitle>
			<AlertDescription className="grid gap-2">
				{showDescription ? (
					<p className="text-muted-foreground text-xs sm:text-sm">
						{t("admin.enrollments.warnings.description", {
							defaultValue:
								"Review these unmet prerequisites before confirming next steps.",
						})}
					</p>
				) : null}
				{warnings.map((warning, index) => {
					const category = resolveWarningCategory(warning);
					const meta = getWarningMeta(category, t);
					const prerequisiteLabel = buildCourseLabel(
						warning.prerequisiteCourseName,
						warning.prerequisiteCourseCode,
						warning.prerequisiteCourseId,
						t,
					);
					const targetLabel = buildCourseLabel(
						warning.targetCourseName,
						warning.targetCourseCode,
						warning.targetCourseId,
						t,
					);
					return (
						<div
							key={`${warning.prerequisiteCourseId}-${warning.targetCourseId}-${index}`}
							className="space-y-1"
						>
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="outline" className={meta.badgeClass}>
									{meta.label}
								</Badge>
								<span className="font-medium text-foreground text-sm">
									{prerequisiteLabel}
								</span>
							</div>
							<p className="text-muted-foreground text-xs sm:text-sm">
								{t("admin.enrollments.warnings.appliesTo", {
									defaultValue: "Required for {{course}}",
									course: targetLabel,
								})}
							</p>
						</div>
					);
				})}
			</AlertDescription>
		</Alert>
	);
};

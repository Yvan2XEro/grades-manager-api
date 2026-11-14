import type { TFunction } from "i18next";
import type { PrerequisiteWarning, WarningCategory } from "../types";

const warningTranslationDefaults = {
	mandatory: "Mandatory gap",
	recommended: "Recommended gap",
	corequisite: "Co-requisite in progress",
} as const;

const warningMetaMap: Record<
	WarningCategory,
	{
		badgeClass: string;
		translationKey: keyof typeof warningTranslationDefaults;
	}
> = {
	mandatory: {
		badgeClass: "border-amber-200 bg-amber-50 text-amber-900",
		translationKey: "mandatory",
	},
	recommended: {
		badgeClass: "border-border bg-muted text-foreground",
		translationKey: "recommended",
	},
	corequisite: {
		badgeClass: "border-blue-200 bg-blue-50 text-blue-800",
		translationKey: "corequisite",
	},
};

export const resolveWarningCategory = (
	warning: PrerequisiteWarning,
): WarningCategory => {
	if (warning.state === "in-progress") {
		return "corequisite";
	}
	return warning.prerequisiteType === "mandatory" ? "mandatory" : "recommended";
};

export const getWarningMeta = (
	category: WarningCategory,
	t: TFunction<"translation", undefined>,
) => {
	const meta = warningMetaMap[category];
	return {
		badgeClass: meta.badgeClass,
		label: t(`admin.enrollments.warnings.${meta.translationKey}`, {
			defaultValue: warningTranslationDefaults[meta.translationKey],
		}),
	};
};

export const buildCourseLabel = (
	name: string | null,
	code: string | null,
	fallbackId: string | null,
	t: TFunction<"translation", undefined>,
) => {
	if (name && code) {
		return t("admin.enrollments.warnings.courseLabel", {
			defaultValue: "{{name}} ({{code}})",
			name,
			code,
		});
	}
	if (name) return name;
	if (code) return code;
	return t("admin.enrollments.warnings.courseFallback", {
		defaultValue: "Course {{courseId}}",
		courseId: fallbackId ?? "N/A",
	});
};

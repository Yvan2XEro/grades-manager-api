import type { TFunction } from "i18next";
import { BookOpen, GraduationCap, Layers, type LucideIcon } from "lucide-react";
import type {
	FoundationStep,
	ImportOverview,
	ImportYear,
	StepStatus,
} from "../types";

/** Prefix of the guided import translations. */
export const G = "admin.dataImport.guided.";

/** Translated name of an import step (the server label is the fallback). */
export const stepLabel = (key: string, t: TFunction, fallback?: string) =>
	t(`${G}steps.${key}`, { defaultValue: fallback ?? key });

/** What each foundation step is for, and where to do it by hand. */
export const FOUNDATION_META: Record<
	string,
	{ icon: LucideIcon; manualPath: string }
> = {
	"foundation.cycles": {
		icon: Layers,
		manualPath: "/institution/cycles",
	},
	"foundation.programs": {
		icon: GraduationCap,
		manualPath: "/programs/programs",
	},
	"foundation.curriculum": {
		icon: BookOpen,
		manualPath: "/programs/teaching-units",
	},
};

export const foundationStatus = (step: FoundationStep): StepStatus =>
	step.skipped
		? "skipped"
		: Object.values(step.counts).some((n) => n > 0)
			? "done"
			: "todo";

/** Steps of an academic year, with the count that tells they are done. */
export const YEAR_STEPS: {
	key: string;
	count: keyof ImportYear["counts"];
	manualPath: string;
}[] = [
	{
		key: "classes",
		count: "classes",
		manualPath: "/classes/classes",
	},
	{
		key: "assignments",
		count: "classCourses",
		manualPath: "/classes/assignments",
	},
	{
		key: "enrollments",
		count: "enrollments",
		manualPath: "/classes/enrollments",
	},
	{ key: "exams", count: "exams", manualPath: "/exams/list" },
	{
		key: "grades",
		count: "grades",
		manualPath: "/exams/export",
	},
];

export const yearProgress = (year: ImportYear) =>
	YEAR_STEPS.filter((step) => year.counts[step.count] > 0).length;

/** One milestone of the institution setup, shown on the hub and the dashboard. */
export interface SetupMilestone {
	key: string;
	label: string;
	done: boolean;
	href: string;
}

/**
 * Milestones of the setup, in order: profile, foundations, a first academic
 * year, then the data of that year (classes, enrollments).
 */
export function setupMilestones(
	overview: ImportOverview,
	t: TFunction,
): SetupMilestone[] {
	const { profile, foundations, years } = overview;
	// The active year is the one being worked on; else the most recent one
	const current = years.find((y) => y.isActive) ?? years.at(-1);
	return [
		{
			key: "profile",
			label: t(`${G}milestones.profile`),
			done: profile.hasLogo && profile.hasContact,
			href: "/institution/overview",
		},
		...foundations.map((step) => ({
			key: step.key,
			label: stepLabel(step.key, t),
			done: foundationStatus(step) !== "todo",
			href: `/import/${step.key}`,
		})),
		{
			key: "year",
			label: t(`${G}milestones.year`),
			done: years.length > 0,
			href: "/academic-years",
		},
		{
			key: "classes",
			label: current
				? t(`${G}milestones.classes`, { year: current.name })
				: t(`${G}milestones.classesNoYear`),
			done: (current?.counts.classes ?? 0) > 0,
			href: "/classes/classes",
		},
		{
			key: "enrollments",
			label: current
				? t(`${G}milestones.enrollments`, { year: current.name })
				: t(`${G}milestones.enrollmentsNoYear`),
			done: (current?.counts.enrollments ?? 0) > 0,
			href: "/classes/enrollments",
		},
	];
}

/** True when nothing has been set up yet (first connection). */
export const isEmptyInstitution = (overview: ImportOverview) =>
	overview.years.length === 0 &&
	overview.foundations.every((s) =>
		Object.values(s.counts).every((n) => n === 0),
	);

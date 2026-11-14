import { BookOpen, GraduationCap, Layers, type LucideIcon } from "lucide-react";
import type { FoundationStep, ImportYear, StepStatus } from "../types";

/** What each foundation step is for, and where to do it by hand. */
export const FOUNDATION_META: Record<
	string,
	{ icon: LucideIcon; description: string; manualPath: string }
> = {
	"foundation.cycles": {
		icon: Layers,
		description:
			"Les cycles de formation (Licence, Master, BTS…) et leurs niveaux (L1, L2, L3…). Tout le reste en dépend.",
		manualPath: "/institution/cycles",
	},
	"foundation.programs": {
		icon: GraduationCap,
		description:
			"Les programmes (filières) rattachés à un cycle, et leurs options ou parcours.",
		manualPath: "/programs/programs",
	},
	"foundation.curriculum": {
		icon: BookOpen,
		description:
			"La maquette pédagogique : les unités d'enseignement (UE) de chaque programme et leurs éléments constitutifs (EC).",
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
	label: string;
	count: keyof ImportYear["counts"];
	manualPath: string;
}[] = [
	{
		key: "classes",
		label: "Classes",
		count: "classes",
		manualPath: "/classes/classes",
	},
	{
		key: "assignments",
		label: "Affectations",
		count: "classCourses",
		manualPath: "/classes/assignments",
	},
	{
		key: "enrollments",
		label: "Inscriptions",
		count: "enrollments",
		manualPath: "/classes/enrollments",
	},
	{ key: "exams", label: "Examens", count: "exams", manualPath: "/exams/list" },
	{
		key: "grades",
		label: "Notes",
		count: "grades",
		manualPath: "/exams/export",
	},
];

export const yearProgress = (year: ImportYear) =>
	YEAR_STEPS.filter((step) => year.counts[step.count] > 0).length;

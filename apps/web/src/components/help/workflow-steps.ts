export interface WorkflowStep {
	key: string;
	route: string;
	label: { en: string; fr: string };
}

/** Linear setup workflow for administrators */
export const ADMIN_WORKFLOW: WorkflowStep[] = [
	{
		key: "institution",
		route: "/settings",
		label: { en: "Institution settings", fr: "Paramètres institution" },
	},
	{
		key: "academic-years",
		route: "/academic-years",
		label: { en: "Academic years", fr: "Années académiques" },
	},
	{
		key: "faculties",
		route: "/faculties",
		label: { en: "Faculties", fr: "Facultés" },
	},
	{
		key: "study-cycles",
		route: "/study-cycles",
		label: { en: "Study cycles", fr: "Cycles d'études" },
	},
	{
		key: "classes",
		route: "/classes",
		label: { en: "Classes", fr: "Classes" },
	},
	{
		key: "teaching-units",
		route: "/teaching-units",
		label: { en: "Teaching units", fr: "Unités d'enseignement" },
	},
	{
		key: "exam-types",
		route: "/exam-types",
		label: { en: "Exam types", fr: "Types d'examen" },
	},
	{
		key: "students",
		route: "/students",
		label: { en: "Students", fr: "Étudiants" },
	},
	{
		key: "enrollments",
		route: "/enrollments",
		label: { en: "Enrollments", fr: "Inscriptions" },
	},
	{
		key: "exams",
		route: "/exams",
		label: { en: "Exams", fr: "Examens" },
	},
];

/** Returns the index of the current step (-1 if the page is not in the workflow) */
export function getCurrentStepIndex(pathname: string): number {
	return ADMIN_WORKFLOW.findIndex((step) => pathname.startsWith(step.route));
}

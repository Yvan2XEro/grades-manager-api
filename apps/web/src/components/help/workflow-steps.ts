export interface WorkflowStep {
	key: string;
	route: string;
	label: { en: string; fr: string };
}

/** Linear setup workflow for administrators */
export const ADMIN_WORKFLOW: WorkflowStep[] = [
	{
		key: "institution",
		route: "/admin/settings",
		label: { en: "Institution settings", fr: "Paramètres institution" },
	},
	{
		key: "academic-years",
		route: "/admin/academic-years",
		label: { en: "Academic years", fr: "Années académiques" },
	},
	{
		key: "faculties",
		route: "/admin/faculties",
		label: { en: "Faculties", fr: "Facultés" },
	},
	{
		key: "study-cycles",
		route: "/admin/study-cycles",
		label: { en: "Study cycles", fr: "Cycles d'études" },
	},
	{
		key: "classes",
		route: "/admin/classes",
		label: { en: "Classes", fr: "Classes" },
	},
	{
		key: "teaching-units",
		route: "/admin/teaching-units",
		label: { en: "Teaching units", fr: "Unités d'enseignement" },
	},
	{
		key: "exam-types",
		route: "/admin/exam-types",
		label: { en: "Exam types", fr: "Types d'examen" },
	},
	{
		key: "students",
		route: "/admin/students",
		label: { en: "Students", fr: "Étudiants" },
	},
	{
		key: "enrollments",
		route: "/admin/enrollments",
		label: { en: "Enrollments", fr: "Inscriptions" },
	},
	{
		key: "exams",
		route: "/admin/exams",
		label: { en: "Exams", fr: "Examens" },
	},
];

/** Returns the index of the current step (-1 if the page is not in the workflow) */
export function getCurrentStepIndex(pathname: string): number {
	return ADMIN_WORKFLOW.findIndex((step) => pathname.startsWith(step.route));
}

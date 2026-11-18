import { useOpenPage } from "@/components/navigation/page-link";

/** Route of each page a dashboard card opens over the dashboard. */
const PAGES = {
	students: "/students",
	enrollments: "/classes/enrollments",
	admissions: "/admissions",
	exams: "/exams/list",
	deliberations: "/academic-results/deliberations",
	fees: "/fee-clearance/assignments",
	academicYears: "/academic-years",
} as const;

export type DashboardPage = keyof typeof PAGES;

/** Opens a page from the dashboard in a large dialog: the user stays on the dashboard. */
export function useDashboardPages() {
	const openPage = useOpenPage();
	return (key: DashboardPage) => openPage(PAGES[key]);
}

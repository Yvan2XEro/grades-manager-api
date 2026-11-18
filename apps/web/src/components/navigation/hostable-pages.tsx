import type React from "react";
import { lazy } from "react";

// Loaded on demand: these pages import PageLink themselves (no import cycle)
const AcademicYearsPage = lazy(
	() => import("@/modules/academic-years/pages/academic-years-page"),
);
const AdmissionsPage = lazy(
	() => import("@/modules/admissions/pages/admissions-page"),
);
const DeliberationsList = lazy(
	() => import("@/modules/deliberations/pages/deliberations-page"),
);
const DocumentsPage = lazy(
	() => import("@/modules/documents/pages/documents-page"),
);
const CourseEnrollmentPage = lazy(
	() => import("@/modules/enrollments/pages/course-enrollment-page"),
);
const EnrollmentsPage = lazy(
	() => import("@/modules/enrollments/pages/enrollments-page"),
);
const ExamCalendarPage = lazy(
	() => import("@/modules/exams/pages/exam-calendar-page"),
);
const ExamsPage = lazy(() => import("@/modules/exams/pages/exams-page"));
const FeeAssignmentsPage = lazy(
	() => import("@/modules/fees/pages/fee-assignments-page"),
);
const StudentFeeStatusPage = lazy(
	() => import("@/modules/fees/pages/student-fee-status-page"),
);
const NotificationsPage = lazy(
	() => import("@/modules/notifications/pages/notifications-page"),
);
const PeopleManagement = lazy(
	() => import("@/modules/people/pages/people-page"),
);
const StudentsPage = lazy(() => import("@/modules/people/pages/students-page"));

export interface HostablePage {
	page: React.ComponentType;
	/** `navigation.pages.<key>`: dialog title. */
	key: string;
	/** The page has no header of its own (tab of a hub): the dialog shows the title. */
	untitled?: boolean;
}

/**
 * Pages that can open in a `PageDialog` instead of navigating, by route.
 * Only pages without route params or nested routes belong here.
 */
export const HOSTABLE_PAGES: Record<string, HostablePage> = {
	"/users/people": { page: PeopleManagement, key: "people" },
	"/students": { page: StudentsPage, key: "students" },
	"/classes/enrollments": {
		page: EnrollmentsPage,
		key: "enrollments",
		untitled: true,
	},
	"/admissions": { page: AdmissionsPage, key: "admissions" },
	"/exams/list": { page: ExamsPage, key: "exams" },
	"/academic-results/deliberations": {
		page: DeliberationsList,
		key: "deliberations",
	},
	"/fee-clearance": { page: FeeAssignmentsPage, key: "feeAssignments" },
	"/fee-clearance/assignments": {
		page: FeeAssignmentsPage,
		key: "feeAssignments",
	},
	"/academic-years": { page: AcademicYearsPage, key: "academicYears" },
	// Student pages
	"/fees": { page: StudentFeeStatusPage, key: "myFees" },
	"/enrollments": { page: CourseEnrollmentPage, key: "courseEnrollment" },
	"/exams": { page: ExamCalendarPage, key: "examCalendar" },
	"/documents": { page: DocumentsPage, key: "documents" },
	"/notifications": { page: NotificationsPage, key: "notifications" },
};

/** The hostable page of a link target (query string and hash ignored). */
export const findHostablePage = (to: string) =>
	HOSTABLE_PAGES[to.split(/[?#]/)[0].replace(/\/$/, "") || "/"];

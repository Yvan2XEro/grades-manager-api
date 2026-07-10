import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const segmentLabels: Record<string, string> = {
	// Role roots
	admin: "navigation.breadcrumbs.admin",
	teacher: "navigation.breadcrumbs.teacher",
	dean: "navigation.breadcrumbs.dean",
	student: "navigation.breadcrumbs.student",

	// Top-level hubs
	profiles: "navigation.breadcrumbs.profiles",
	"academic-years": "navigation.sidebar.admin.academicYears",
	institution: "navigation.sidebar.admin.institution",
	programs: "navigation.sidebar.admin.programs",
	classes: "navigation.sidebar.admin.classes",
	users: "navigation.sidebar.admin.users",
	exams: "navigation.sidebar.admin.exams",
	"academic-results": "navigation.sidebar.admin.academicResults",
	"fee-clearance": "navigation.sidebar.admin.feeClearance",
	timetable: "navigation.sidebar.admin.timetable",
	configuration: "navigation.breadcrumbs.configuration",
	"batch-jobs": "navigation.sidebar.admin.batchJobs",
	monitoring: "navigation.sidebar.admin.monitoring",
	notifications: "navigation.sidebar.admin.notifications",
	centers: "navigation.sidebar.admin.centers",
	admissions: "navigation.sidebar.admin.admissions",

	// ExamsHub sub-tabs
	list: "navigation.breadcrumbs.examList",
	types: "navigation.breadcrumbs.examTypes",
	scheduler: "navigation.sidebar.admin.examScheduler",
	participation: "navigation.breadcrumbs.participation",
	export: "navigation.breadcrumbs.gradeExport",
	access: "navigation.breadcrumbs.gradeAccess",
	retakes: "navigation.breadcrumbs.retakes",
	templates: "navigation.breadcrumbs.templates",
	"class-documents": "navigation.breadcrumbs.classDocuments",

	// UsersHub sub-tabs
	accounts: "navigation.breadcrumbs.accounts",
	students: "navigation.sidebar.admin.students",
	guardians: "navigation.sidebar.admin.guardians",
	"api-keys": "navigation.breadcrumbs.apiKeys",

	// AcademicResultsHub sub-tabs
	deliberations: "navigation.breadcrumbs.deliberations",
	promotion: "navigation.breadcrumbs.promotion",
	results: "navigation.breadcrumbs.results",
	jury: "navigation.breadcrumbs.jury",
	activity: "navigation.breadcrumbs.activity",

	// ProfileHub sub-tabs
	identity: "navigation.breadcrumbs.identity",
	finances: "navigation.breadcrumbs.finances",

	// InstitutionHub sub-tabs
	overview: "navigation.breadcrumbs.overview",
	faculties: "navigation.breadcrumbs.faculties",
	cycles: "navigation.breadcrumbs.cycles",

	// ProgramsHub sub-tabs
	"teaching-units": "navigation.sidebar.admin.teachingUnits",
	courses: "navigation.sidebar.teacher.courses",

	// ClassesHub sub-tabs
	assignments: "navigation.breadcrumbs.assignments",
	enrollments: "navigation.sidebar.admin.enrollments",

	// ConfigurationHub sub-tabs
	"reg-numbers": "navigation.breadcrumbs.regNumbers",
	"grade-scale": "navigation.breadcrumbs.gradeScale",
	rules: "navigation.sidebar.admin.rules",

	// TimetableHub sub-tabs
	schedule: "navigation.breadcrumbs.schedule",
	rooms: "navigation.breadcrumbs.rooms",
	attendance: "navigation.sidebar.teacher.attendance",
	rates: "navigation.breadcrumbs.attendanceRates",

	// FeeClearanceHub sub-tabs
	structures: "navigation.breadcrumbs.feeStructures",
	gating: "navigation.breadcrumbs.feeGating",

	// Legacy / misc
	"study-cycles": "navigation.sidebar.admin.studyCycles",
	"class-courses": "navigation.sidebar.admin.courseAssignments",
	"exam-types": "navigation.sidebar.admin.examTypes",
	"exam-scheduler": "navigation.sidebar.admin.examScheduler",
	"grade-export": "navigation.sidebar.admin.gradeExport",
	"export-templates": "navigation.sidebar.admin.exportTemplates",
	"promotion-rules": "navigation.sidebar.admin.promotionRules",
	"registration-numbers": "navigation.sidebar.admin.registrationNumbers",
	"retake-eligibility": "navigation.sidebar.admin.retakeEligibility",
	workflows: "navigation.sidebar.dean.workflows",
	grades: "navigation.sidebar.teacher.grades",
};

export function useBreadcrumbs(): BreadcrumbItem[] {
	const { t } = useTranslation();
	const { pathname } = useLocation();

	const segments = pathname.split("/").filter(Boolean);
	const crumbs: BreadcrumbItem[] = [];

	// Find the last non-UUID segment index for correct "current page" detection
	let lastNonUuidIndex = segments.length - 1;
	while (lastNonUuidIndex >= 0 && UUID_REGEX.test(segments[lastNonUuidIndex])) {
		lastNonUuidIndex--;
	}

	let currentPath = "";
	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i];
		currentPath += `/${segment}`;

		// Skip UUID segments
		if (UUID_REGEX.test(segment)) continue;

		const labelKey = segmentLabels[segment];
		const isLast = i === lastNonUuidIndex;

		crumbs.push({
			label: labelKey ? t(labelKey) : segment.replace(/-/g, " "),
			href: isLast ? undefined : currentPath,
		});
	}

	return crumbs;
}

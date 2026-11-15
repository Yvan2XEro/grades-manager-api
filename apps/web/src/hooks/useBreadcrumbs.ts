import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { create } from "zustand";
import { useRoleGroup } from "@/components/navigation/RoleView";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Names of the entities shown in the URL (id → name), set by detail pages. */
const useEntityNames = create<{
	names: Record<string, string>;
	set: (id: string, name: string) => void;
}>((set) => ({
	names: {},
	set: (id, name) =>
		set((state) =>
			state.names[id] === name
				? state
				: { names: { ...state.names, [id]: name } },
		),
}));

/**
 * Called by a detail page: the breadcrumb shows `name` instead of the id of
 * the entity in the URL (e.g. "Classes › IGL-BTS1 › Étudiants").
 */
export function useBreadcrumbEntity(id?: string | null, name?: string | null) {
	const set = useEntityNames((s) => s.set);
	useEffect(() => {
		if (id && name) set(id, name);
	}, [id, name, set]);
}

/** Label key (`navigation.crumbs.*`) of a segment; `<first>/<segment>` wins over `<segment>`. */
const LABELS: Record<string, string> = {
	"academic-years": "academicYears",
	institution: "institution",
	overview: "overview",
	faculties: "faculties",
	cycles: "cycles",
	levels: "levels",
	centers: "centers",
	logos: "logos",
	authorization: "authorization",
	instances: "instances",
	contact: "contact",
	programs: "programs",
	"teaching-units": "teachingUnits",
	courses: "courses",
	options: "options",
	"programs/templates": "programTemplates",
	classes: "classes",
	"classes/assignments": "courseAssignments",
	enrollments: "enrollments",
	students: "students",
	users: "users",
	people: "people",
	guardians: "guardians",
	"api-keys": "apiKeys",
	identity: "identity",
	results: "results",
	finances: "finances",
	"profiles/access": "accountAccess",
	exams: "exams",
	list: "examList",
	types: "examTypes",
	scheduler: "examScheduler",
	participation: "participation",
	export: "gradeExport",
	"exams/access": "gradeAccess",
	retakes: "retakes",
	templates: "exportTemplates",
	"class-documents": "classDocuments",
	"academic-results": "academicResults",
	deliberations: "deliberations",
	promotion: "promotion",
	jury: "jury",
	activity: "activity",
	graduation: "graduation",
	"fee-clearance": "feeClearance",
	structures: "feeStructures",
	"fee-clearance/assignments": "feeAssignments",
	installments: "installments",
	impact: "impact",
	history: "history",
	gating: "feeGating",
	timetable: "timetable",
	schedule: "schedule",
	rooms: "rooms",
	attendance: "attendance",
	rates: "attendanceRates",
	alerts: "attendanceAlerts",
	configuration: "configuration",
	"reg-numbers": "regNumbers",
	"grade-scale": "gradeScale",
	rules: "deliberationRules",
	"batch-jobs": "batchJobs",
	monitoring: "monitoring",
	notifications: "notifications",
	center: "notificationCenter",
	admissions: "admissions",
	import: "setup",
	"import/years": "importYears",
	"foundation.cycles": "importCycles",
	"foundation.programs": "importPrograms",
	"foundation.curriculum": "importCurriculum",
	fast: "fastEntry",
	new: "new",
	settings: "settings",
	account: "account",
	profile: "profile",
	preferences: "preferences",
	statistics: "statistics",
	documents: "documents",
	"document-batch": "documentBatch",
	exports: "exports",
	fees: "myFees",
	approvals: "approvals",
	timeline: "timeline",
	workflows: "workflows",
	details: "details",
};

/**
 * Routes outside the hub they belong to: their first segment is replaced by
 * the trail of that hub, so the user can always go back to the list.
 */
const PARENTS: Record<string, { key: string; href: string }[]> = {
	profiles: [
		{ key: "users", href: "/users" },
		{ key: "people", href: "/users/people" },
	],
	promotion: [
		{ key: "academicResults", href: "/academic-results" },
		{ key: "promotion", href: "/academic-results/promotion" },
	],
	"export-templates": [
		{ key: "configuration", href: "/configuration" },
		{ key: "exportTemplates", href: "/configuration/templates" },
	],
	"registration-numbers": [
		{ key: "configuration", href: "/configuration" },
		{ key: "regNumbers", href: "/configuration/reg-numbers" },
	],
};

/** Intermediate paths that are not pages: shown without a link. */
const NOT_PAGES = new Set(["/fee-clearance/students", "/import/years"]);

export function useBreadcrumbs(): BreadcrumbItem[] {
	const { t } = useTranslation();
	const { pathname } = useLocation();
	const roleGroup = useRoleGroup();
	const names = useEntityNames((s) => s.names);

	const segments = pathname.split("/").filter(Boolean);
	if (segments.length === 0) return [];
	const crumb = (key: string) => String(t(`navigation.crumbs.${key}`));
	// The home page (`/`) is the dashboard of the user's role group
	const crumbs: BreadcrumbItem[] = [
		{ label: t(`navigation.breadcrumbs.${roleGroup ?? "admin"}`), href: "/" },
	];
	const push = (item: BreadcrumbItem) => {
		// A hub and its default tab often share a label (Classes › Classes)
		if (crumbs.at(-1)?.label === item.label) crumbs[crumbs.length - 1] = item;
		else crumbs.push(item);
	};

	const [first] = segments;
	if (PARENTS[first]) {
		for (const parent of PARENTS[first])
			push({ label: crumb(parent.key), href: parent.href });
	} else if (first === "grades") {
		// Grade entry belongs to the teacher's courses, or to the exams for staff
		const teacherSide = roleGroup === "teacher";
		push({
			label: crumb(teacherSide ? "myCourses" : "examList"),
			href: teacherSide ? "/" : "/exams/list",
		});
	}

	let path = "";
	segments.forEach((segment, index) => {
		path += `/${segment}`;
		const isLast = index === segments.length - 1;
		const href = isLast || NOT_PAGES.has(path) ? undefined : path;
		if (index === 0 && (PARENTS[first] || first === "grades")) return;
		if (UUID_REGEX.test(segment)) {
			push({ label: names[segment] ?? "…", href });
			return;
		}
		const key = LABELS[`${first}/${segment}`] ?? LABELS[segment];
		push({
			label: key ? crumb(key) : decodeURIComponent(segment).replace(/-/g, " "),
			href,
		});
	});

	return crumbs;
}

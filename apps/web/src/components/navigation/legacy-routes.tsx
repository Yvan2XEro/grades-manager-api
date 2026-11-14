import { Navigate, Route, useLocation, useParams } from "react-router";
import { RoleView } from "./RoleView";

const ROLE_PREFIX = /^\/(admin|teacher|dean|student|grade-editor)(?=\/|$)/;

/** Old admin grade pages moved into the exams hub before URLs lost their role. */
const ADMIN_GRADES: Record<string, string> = {
	"": "/exams/export",
	"/export": "/exams/export",
	"/access": "/exams/access",
	"/retake": "/exams/retakes",
	"/templates": "/exams/templates",
	"/class-documents": "/exams/class-documents",
};

/** `/admin/classes/x` → `/classes/x`, `/teacher` → `/` (URLs no longer carry the role). */
export function stripRolePrefix(pathname: string) {
	const role = pathname.match(ROLE_PREFIX)?.[1];
	const rest = pathname.replace(ROLE_PREFIX, "");
	if (role === "admin") {
		if (rest === "/notifications") return "/notifications/center";
		const grades = rest.match(/^\/grades(\/[^/]*)?\/?$/);
		if (grades) return ADMIN_GRADES[grades[1] ?? ""] ?? "/exams/export";
	}
	return rest || "/";
}

function RolePrefixRedirect() {
	const { pathname, search, hash } = useLocation();
	return (
		<Navigate to={`${stripRolePrefix(pathname)}${search}${hash}`} replace />
	);
}

function TeachingUnitLegacyRedirect() {
	const { teachingUnitId } = useParams<{ teachingUnitId: string }>();
	return (
		<Navigate
			to={`/programs/teaching-units/${teachingUnitId}/details`}
			replace
		/>
	);
}

/** Centres moved into the institution hub: `/centers/x` → `/institution/centers/x`. */
function CentersLegacyRedirect() {
	const { pathname, search } = useLocation();
	return <Navigate to={`/institution${pathname}${search}`} replace />;
}

/** Paths renamed or merged into hubs over time, kept for bookmarks. */
const RENAMED: [from: string, to: string][] = [
	["guardians", "/users/guardians"],
	["students", "/users/people"],
	["student-promotion", "/users/people"],
	["faculties", "/institution/faculties"],
	["study-cycles", "/institution/cycles"],
	["teaching-units", "/programs/teaching-units"],
	["class-courses", "/classes/assignments"],
	["api-keys", "/users/api-keys"],
	["exam-types", "/exams/types"],
	["exam-scheduler", "/exams/scheduler"],
	["retake-eligibility", "/exams/retakes"],
	["grade-export", "/exams/export"],
	["grade-access", "/exams/access"],
	["export-templates", "/exams/templates"],
	["class-document-templates", "/exams/class-documents"],
	["rules", "/configuration/rules"],
	["registration-numbers", "/configuration/reg-numbers"],
	["deliberations", "/academic-results/deliberations"],
	["promotion", "/academic-results/promotion"],
	["promotion-rules", "/promotion-legacy"],
	["promotion-rules/rules", "/promotion-legacy?tab=rules"],
	["promotion-rules/evaluate", "/promotion-legacy?tab=evaluate"],
	["promotion-rules/execute", "/promotion-legacy?tab=execute"],
	["promotion-rules/history", "/promotion-legacy?tab=history"],
];

/** Legacy paths, rendered inside the dashboard layout. */
export const legacyRoutes = (
	<>
		{RENAMED.map(([from, to]) => (
			<Route key={from} path={from} element={<Navigate to={to} replace />} />
		))}
		<Route path="centers/*" element={<CentersLegacyRedirect />} />
		<Route
			path="teaching-units/:teachingUnitId"
			element={<TeachingUnitLegacyRedirect />}
		/>
		{/* Teachers' course list is their home page; staff manage courses in programs */}
		<Route
			path="courses"
			element={
				<RoleView
					fallback={<Navigate to="/programs/courses" replace />}
					teacher={<Navigate to="/" replace />}
				/>
			}
		/>
	</>
);

/** Old role-prefixed URLs (`/admin/*`, `/teacher/*`, …). */
export const rolePrefixRoutes = (
	<>
		{["admin", "teacher", "dean", "student", "grade-editor"].map((role) => (
			<Route key={role} path={`/${role}/*`} element={<RolePrefixRedirect />} />
		))}
	</>
);

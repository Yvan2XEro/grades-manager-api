import { useEffect, useMemo, useRef } from "react";
import { Route, Routes } from "react-router";
import { academicYearsRoutes } from "@/modules/academic-years/routes";
import {
	admissionsPublicRoutes,
	admissionsRoutes,
} from "@/modules/admissions/routes";
import { attendanceRoutes } from "@/modules/attendance/routes";
import { authRoutes } from "@/modules/auth/routes";
import { batchJobsRoutes } from "@/modules/batch-jobs/routes";
import { classesRoutes } from "@/modules/classes/routes";
import { configurationRoutes } from "@/modules/configuration/routes";
import { dashboardRoutes } from "@/modules/dashboard/routes";
import { dataImportRoutes } from "@/modules/data-import/routes";
import { deliberationsRoutes } from "@/modules/deliberations/routes";
import { documentsRoutes } from "@/modules/documents/routes";
import { enrollmentsRoutes } from "@/modules/enrollments/routes";
import { examsRoutes } from "@/modules/exams/routes";
import { feesRoutes } from "@/modules/fees/routes";
import { gradesRoutes } from "@/modules/grades/routes";
import { guardiansPublicRoutes } from "@/modules/guardians/routes";
import { institutionRoutes } from "@/modules/institution/routes";
import { monitoringRoutes } from "@/modules/monitoring/routes";
import { notificationsRoutes } from "@/modules/notifications/routes";
import { peopleRoutes } from "@/modules/people/routes";
import { programsRoutes } from "@/modules/programs/routes";
import { promotionRulesRoutes } from "@/modules/promotion-rules/routes";
import { settingsRoutes } from "@/modules/settings/routes";
import { statisticsRoutes } from "@/modules/statistics/routes";
import { timetableRoutes } from "@/modules/timetable/routes";
import { workflowsRoutes } from "@/modules/workflows/routes";
import AuthLayout from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";
import {
	legacyRoutes,
	rolePrefixRoutes,
} from "./components/navigation/legacy-routes";
import { Redirector } from "./components/navigation/Redirector";
import LoadingScreen from "./components/ui/LoadingScreen";
import { authClient } from "./lib/auth-client";
import { detectOrganizationSlug } from "./lib/organization";
import type { BusinessRole } from "./store";
import { roleGuards, useStore } from "./store";

function App() {
	const {
		setUser,
		clearUser,
		setActiveOrganizationSlug,
		activeOrganizationSlug,
	} = useStore();
	const {
		data: session,
		isPending,
		refetch: refetchSession,
	} = authClient.useSession();
	const activatedSlugRef = useRef<string | null>(null);

	const memoUser = useMemo(() => {
		if (!session || !session.user) return null;
		const [firstName, ...rest] = (session.user.name || "").split(" ");
		const membershipRole = session.activeMembership?.role ?? null;
		const role = normalizeRole(membershipRole);
		return {
			profileId: session.user.id,
			email: session.user.email,
			image: session.user.image ?? null,
			role,
			firstName,
			lastName: rest.join(" "),
			domainProfiles: session.domainProfiles,
			permissions: {
				canManageCatalog: roleGuards.manageCatalog.includes(role),
				canManageStudents: roleGuards.manageStudents.includes(role),
				canGrade: roleGuards.grade.includes(role),
				canAccessAnalytics: roleGuards.viewAnalytics.includes(role),
			},
		};
	}, [session]);

	// Detect and set organization slug on mount
	useEffect(() => {
		try {
			const slug = detectOrganizationSlug();
			if (slug && slug !== activeOrganizationSlug) {
				setActiveOrganizationSlug(slug);
			}
		} catch (error) {
			console.error("Failed to detect organization slug:", error);
		}
	}, [activeOrganizationSlug, setActiveOrganizationSlug]);

	// Set active organization in Better Auth when we have both session and slug
	useEffect(() => {
		if (!session?.user) {
			activatedSlugRef.current = null;
			return;
		}
		// Skip if org was already set AND membership is populated (role resolved)
		if (
			session.session?.activeOrganizationId &&
			session.activeMembership?.role
		) {
			activatedSlugRef.current = activeOrganizationSlug;
			return;
		}
		if (session?.user && activeOrganizationSlug) {
			if (activatedSlugRef.current === activeOrganizationSlug) {
				return;
			}
			let cancelled = false;
			const activateOrganization = async () => {
				const result = await authClient.organization.setActive({
					organizationSlug: activeOrganizationSlug,
				});
				if (result.error) {
					console.error("Failed to set active organization:", result.error);
					return; // Ne pas marquer comme fait — permettre un retry
				}
				if (!cancelled) {
					activatedSlugRef.current = activeOrganizationSlug;
					// Force session refetch so activeMembership and role update immediately
					await refetchSession();
				}
			};
			void activateOrganization();
			return () => {
				cancelled = true;
			};
		}
	}, [
		session?.user?.id,
		activeOrganizationSlug,
		refetchSession,
		session?.activeMembership?.role,
		session?.session?.activeOrganizationId,
		session?.user,
	]);

	useEffect(() => {
		// Keep the persisted user while the session loads: clearing it here made
		// a reload on a deep link bounce through login and land on the home page
		if (isPending) return;
		if (memoUser) {
			setUser(memoUser);
		} else {
			clearUser();
		}
	}, [isPending, memoUser, setUser, clearUser]);

	if (isPending) {
		return <LoadingScreen />;
	}

	return (
		<Routes>
			<Route element={<AuthLayout />}>{authRoutes}</Route>
			{admissionsPublicRoutes}
			{guardiansPublicRoutes}

			{!!memoUser && (
				<>
					{/* URLs are role-free: shared paths render the view of the user's role */}
					<Route path="/" element={<DashboardLayout />}>
						{academicYearsRoutes}
						{admissionsRoutes}
						{attendanceRoutes}
						{batchJobsRoutes}
						{classesRoutes}
						{configurationRoutes}
						{dashboardRoutes}
						{dataImportRoutes}
						{deliberationsRoutes}
						{documentsRoutes}
						{enrollmentsRoutes}
						{examsRoutes}
						{feesRoutes}
						{gradesRoutes}
						{institutionRoutes}
						{monitoringRoutes}
						{notificationsRoutes}
						{peopleRoutes}
						{programsRoutes}
						{promotionRulesRoutes}
						{settingsRoutes}
						{statisticsRoutes}
						{timetableRoutes}
						{workflowsRoutes}
						{legacyRoutes}
					</Route>
					{rolePrefixRoutes}
				</>
			)}

			<Route
				path="*"
				element={<Redirector isPending={isPending} user={memoUser} />}
			/>
		</Routes>
	);
}

const allowedRoles: BusinessRole[] = [
	"guest",
	"student",
	"staff",
	"grade_editor",
	"dean",
	"teacher",
	"administrator",
	"super_admin",
	"owner",
];

function normalizeRole(role: string | null | undefined): BusinessRole {
	if (!role) return "guest";
	if (allowedRoles.includes(role as BusinessRole)) {
		return role as BusinessRole;
	}
	return "guest";
}

export default App;

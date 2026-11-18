import type { ParseKeys } from "i18next";
import {
	BarChart3,
	Bell,
	BookOpen,
	Building2,
	Calendar,
	CalendarClock,
	ClipboardList,
	CreditCard,
	FileCog,
	FileSpreadsheet,
	FileText,
	Gavel,
	GraduationCap,
	Heart,
	History,
	LayoutDashboard,
	ListChecks,
	PlayCircle,
	Rocket,
	School,
	Settings2,
	TrendingUp,
	UserCog,
	Users,
} from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { useStore } from "../../store";

export type NavBadgeType = "new" | "updated";

export type NavItem = {
	to: string;
	icon: React.ReactNode;
	labelKey: ParseKeys;
	badge?: NavBadgeType;
	/** The link is not active when the path starts with this prefix. */
	excludePrefix?: string;
};

export type NavGroup = {
	key: string;
	titleKey: ParseKeys;
	items: NavItem[];
};

export type NavMenu =
	| { type: "grouped"; groups: NavGroup[] }
	| { type: "flat"; items: NavItem[] };

/**
 * Navigation of the signed-in user's role: what the sidebar lists and what
 * the command palette (Ctrl+K) offers. One source, so search never proposes
 * a page the role cannot open.
 */
export function useNavMenu(IC = "size-[15px] shrink-0"): NavMenu {
	const { user } = useStore();

	const adminGroups = useMemo<NavGroup[]>(
		() => [
			{
				key: "overview",
				titleKey: "navigation.sidebar.groups.overview",
				items: [
					{
						to: "/",
						icon: <LayoutDashboard className={IC} />,
						labelKey: "navigation.sidebar.admin.dashboard",
					},
					{
						to: "/import",
						icon: <Rocket className={IC} />,
						labelKey: "navigation.sidebar.admin.setup",
						badge: "new",
					},
					{
						to: "/academic-years",
						icon: <Calendar className={IC} />,
						labelKey: "navigation.sidebar.admin.academicYears",
					},
				],
			},
			{
				key: "structure",
				titleKey: "navigation.sidebar.groups.structure",
				items: [
					{
						to: "/institution",
						icon: <Building2 className={IC} />,
						labelKey: "navigation.sidebar.admin.institution",
					},
					{
						to: "/programs",
						icon: <School className={IC} />,
						labelKey: "navigation.sidebar.admin.programs",
					},
					{
						to: "/classes",
						icon: <Users className={IC} />,
						labelKey: "navigation.sidebar.admin.classes",
					},
					{
						to: "/timetable",
						icon: <CalendarClock className={IC} />,
						labelKey: "navigation.sidebar.admin.timetable",
						badge: "new",
					},
				],
			},
			{
				key: "inscriptions",
				titleKey: "navigation.sidebar.groups.inscriptions",
				items: [
					{
						to: "/students",
						icon: <GraduationCap className={IC} />,
						labelKey: "navigation.sidebar.admin.students",
					},
					{
						to: "/admissions",
						icon: <ClipboardList className={IC} />,
						labelKey: "navigation.sidebar.admin.admissions",
						badge: "new",
					},
					{
						to: "/users/guardians",
						icon: <Heart className={IC} />,
						labelKey: "navigation.sidebar.admin.guardians",
					},
				],
			},
			{
				key: "people",
				titleKey: "navigation.sidebar.groups.people",
				items: [
					{
						to: "/users",
						icon: <UserCog className={IC} />,
						labelKey: "navigation.sidebar.admin.users",
					},
				],
			},
			{
				key: "assessment",
				titleKey: "navigation.sidebar.groups.assessment",
				items: [
					{
						to: "/exams",
						icon: <ClipboardList className={IC} />,
						labelKey: "navigation.sidebar.admin.exams",
					},
					{
						to: "/document-batch",
						icon: <FileText className={IC} />,
						labelKey: "navigation.sidebar.admin.documentBatch",
					},
				],
			},
			{
				key: "results",
				titleKey: "navigation.sidebar.groups.results",
				items: [
					{
						to: "/academic-results",
						icon: <Gavel className={IC} />,
						labelKey: "navigation.sidebar.admin.academicResults",
					},
				],
			},
			{
				key: "analytics",
				titleKey: "navigation.sidebar.groups.analytics",
				items: [
					{
						to: "/statistics",
						icon: <BarChart3 className={IC} />,
						labelKey: "navigation.sidebar.admin.statistics",
						badge: "new",
					},
				],
			},
			{
				key: "system",
				titleKey: "navigation.sidebar.groups.system",
				items: [
					{
						to: "/configuration",
						icon: <Settings2 className={IC} />,
						labelKey: "navigation.sidebar.admin.configuration",
					},
					{
						to: "/monitoring",
						icon: <LayoutDashboard className={IC} />,
						labelKey: "navigation.sidebar.admin.monitoring",
					},
					{
						to: "/batch-jobs",
						icon: <PlayCircle className={IC} />,
						labelKey: "navigation.sidebar.admin.batchJobs",
						badge: "new",
					},
					{
						to: "/fee-clearance",
						icon: <CreditCard className={IC} />,
						labelKey: "navigation.sidebar.admin.feeClearance",
						badge: "new",
					},
					{
						to: "/notifications/center",
						icon: <Bell className={IC} />,
						labelKey: "navigation.sidebar.admin.notifications",
					},
				],
			},
		],
		[],
	);

	const teacherLinks = useMemo<NavItem[]>(
		() => [
			{
				to: "/",
				icon: <BookOpen className={IC} />,
				labelKey: "navigation.sidebar.teacher.myCourses",
			},
			{
				to: "/timetable",
				icon: <CalendarClock className={IC} />,
				labelKey: "navigation.sidebar.teacher.timetable",
			},
			{
				to: "/attendance",
				icon: <ClipboardList className={IC} />,
				labelKey: "navigation.sidebar.teacher.attendance",
			},
			{
				to: "/attendance/rates",
				icon: <BarChart3 className={IC} />,
				labelKey: "navigation.sidebar.teacher.attendanceRates",
			},
			{
				to: "/exports",
				icon: <FileSpreadsheet className={IC} />,
				labelKey: "navigation.sidebar.teacher.exports",
			},
		],
		[],
	);

	// The dean runs academic work: approvals, results, documents, statistics;
	// institution settings, users and fees stay with the administrators.
	const deanGroups = useMemo<NavGroup[]>(
		() => [
			{
				key: "overview",
				titleKey: "navigation.sidebar.groups.overview",
				items: [
					{
						to: "/",
						icon: <LayoutDashboard className={IC} />,
						labelKey: "navigation.sidebar.dean.dashboard",
					},
					{
						to: "/approvals",
						icon: <ClipboardList className={IC} />,
						labelKey: "navigation.sidebar.dean.pendingApprovals",
					},
					{
						to: "/history",
						icon: <FileCog className={IC} />,
						labelKey: "navigation.sidebar.dean.history",
					},
				],
			},
			{
				key: "structure",
				titleKey: "navigation.sidebar.groups.structure",
				items: [
					{
						to: "/programs",
						icon: <School className={IC} />,
						labelKey: "navigation.sidebar.admin.programs",
					},
					{
						to: "/classes",
						icon: <Users className={IC} />,
						labelKey: "navigation.sidebar.admin.classes",
					},
					{
						to: "/students",
						icon: <GraduationCap className={IC} />,
						labelKey: "navigation.sidebar.admin.students",
					},
				],
			},
			{
				key: "assessment",
				titleKey: "navigation.sidebar.groups.assessment",
				items: [
					{
						to: "/exams",
						icon: <ClipboardList className={IC} />,
						labelKey: "navigation.sidebar.admin.exams",
					},
					{
						to: "/document-batch",
						icon: <FileText className={IC} />,
						labelKey: "navigation.sidebar.admin.documentBatch",
					},
				],
			},
			{
				key: "results",
				titleKey: "navigation.sidebar.groups.results",
				items: [
					{
						to: "/academic-results",
						icon: <Gavel className={IC} />,
						labelKey: "navigation.sidebar.admin.academicResults",
					},
				],
			},
			{
				key: "analytics",
				titleKey: "navigation.sidebar.groups.analytics",
				items: [
					{
						to: "/statistics",
						icon: <BarChart3 className={IC} />,
						labelKey: "navigation.sidebar.admin.statistics",
					},
					{
						to: "/monitoring",
						icon: <TrendingUp className={IC} />,
						labelKey: "navigation.sidebar.dean.monitoring",
					},
				],
			},
		],
		[],
	);

	const gradeEditorLinks = useMemo<NavItem[]>(
		() => [
			{
				to: "/",
				icon: <BookOpen className={IC} />,
				labelKey: "navigation.sidebar.teacher.myCourses",
			},
			{
				to: "/exports",
				icon: <FileSpreadsheet className={IC} />,
				labelKey: "navigation.sidebar.teacher.exports",
			},
		],
		[],
	);

	const studentLinks = useMemo<NavItem[]>(
		() => [
			{
				to: "/",
				icon: <LayoutDashboard className={IC} />,
				labelKey: "navigation.sidebar.student.dashboard",
			},
			{
				to: "/exams",
				icon: <Calendar className={IC} />,
				labelKey: "navigation.sidebar.student.exams",
			},
			{
				to: "/timetable",
				icon: <CalendarClock className={IC} />,
				labelKey: "navigation.sidebar.student.timetable",
			},
			{
				to: "/enrollments",
				icon: <ListChecks className={IC} />,
				labelKey: "navigation.sidebar.student.enrollments",
			},
			{
				to: "/documents",
				icon: <FileText className={IC} />,
				labelKey: "navigation.sidebar.student.documents",
			},
			{
				to: "/timeline",
				icon: <History className={IC} />,
				labelKey: "navigation.sidebar.student.timeline",
			},
		],
		[],
	);

	const menuContent = useMemo(() => {
		if (!user) return { type: "flat" as const, items: teacherLinks };
		switch (user.role) {
			case "administrator":
			case "super_admin":
			case "owner":
				return { type: "grouped" as const, groups: adminGroups };
			case "dean":
				return { type: "grouped" as const, groups: deanGroups };
			case "teacher":
				return { type: "flat" as const, items: teacherLinks };
			case "grade_editor":
				return { type: "flat" as const, items: gradeEditorLinks };
			case "student":
				return { type: "flat" as const, items: studentLinks };
			default:
				return { type: "flat" as const, items: teacherLinks };
		}
	}, [
		user,
		adminGroups,
		teacherLinks,
		gradeEditorLinks,
		deanGroups,
		studentLinks,
	]);

	return menuContent;
}

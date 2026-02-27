import { AnimatePresence, motion } from "framer-motion";
import {
	Bell,
	BookOpen,
	BookOpenCheck,
	Building2,
	Calendar,
	CalendarPlus,
	ChevronDown,
	ChevronRight,
	ClipboardList,
	FileCog,
	FileSpreadsheet,
	FileText,
	Gavel,
	GraduationCap,
	Hash,
	Landmark,
	Layers3,
	LayoutDashboard,
	PlayCircle,
	RefreshCw,
	School,
	TrendingUp,
	UserCog,
	Users,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router";
import logo from "/logo.png";
import { useStore } from "../../store";

const Sidebar: React.FC = () => {
	const { user, sidebarOpen } = useStore();
	const { t } = useTranslation();
	const location = useLocation();
	const [pinnedGroups, setPinnedGroups] = useState<Set<string>>(
		new Set(["overview"]),
	);
	const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
	const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const toggleGroup = (groupKey: string) => {
		setPinnedGroups((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(groupKey)) {
				newSet.delete(groupKey);
			} else {
				newSet.add(groupKey);
			}
			return newSet;
		});
	};

	const handleGroupMouseEnter = useCallback((groupKey: string) => {
		if (hoverTimerRef.current) {
			clearTimeout(hoverTimerRef.current);
			hoverTimerRef.current = null;
		}
		setHoveredGroup(groupKey);
	}, []);

	const handleGroupMouseLeave = useCallback(() => {
		hoverTimerRef.current = setTimeout(() => {
			setHoveredGroup(null);
			hoverTimerRef.current = null;
		}, 300);
	}, []);

	const isGroupExpanded = useCallback(
		(groupKey: string) =>
			pinnedGroups.has(groupKey) || hoveredGroup === groupKey,
		[pinnedGroups, hoveredGroup],
	);

	const adminMenuGroups = [
		{
			title: "navigation.sidebar.groups.overview",
			items: [
				{
					to: "/admin",
					icon: <LayoutDashboard className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.dashboard",
				},
				{
					to: "/admin/institution",
					icon: <Landmark className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.institution",
				},
				{
					to: "/admin/academic-years",
					icon: <Calendar className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.academicYears",
				},
			],
		},
		{
			title: "navigation.sidebar.groups.structure",
			items: [
				{
					to: "/admin/faculties",
					icon: <Building2 className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.faculties",
				},
				{
					to: "/admin/study-cycles",
					icon: <Layers3 className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.studyCycles",
				},
				{
					to: "/admin/programs",
					icon: <School className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.programs",
				},
				{
					to: "/admin/teaching-units",
					icon: <BookOpenCheck className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.teachingUnits",
				},
				{
					to: "/admin/classes",
					icon: <Users className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.classes",
				},
			],
		},
		{
			title: "navigation.sidebar.groups.users",
			items: [
				{
					to: "/admin/users",
					icon: <UserCog className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.users",
				},
				{
					to: "/admin/students",
					icon: <GraduationCap className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.students",
				},
			],
		},
		{
			title: "navigation.sidebar.groups.teaching",
			items: [
				{
					to: "/admin/courses",
					icon: <BookOpen className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.courses",
				},
				{
					to: "/admin/class-courses",
					icon: <BookOpenCheck className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.courseAssignments",
				},
				{
					to: "/admin/enrollments",
					icon: <Calendar className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.enrollments",
				},
			],
		},
		{
			title: "navigation.sidebar.groups.evaluation",
			items: [
				{
					to: "/admin/exams",
					icon: <ClipboardList className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.exams",
				},
				{
					to: "/admin/exam-types",
					icon: <ClipboardList className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.examTypes",
				},
				{
					to: "/admin/exam-scheduler",
					icon: <CalendarPlus className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.examScheduler",
				},
				{
					to: "/admin/retake-eligibility",
					icon: <RefreshCw className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.retakeEligibility",
				},
				{
					to: "/admin/grade-export",
					icon: <FileSpreadsheet className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.gradeExport",
				},
				{
					to: "/admin/export-templates",
					icon: <FileText className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.exportTemplates",
				},
			],
		},
		{
			title: "navigation.sidebar.groups.promotion",
			items: [
				{
					to: "/admin/deliberations",
					icon: <Gavel className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.deliberations",
				},
				{
					to: "/admin/deliberations/rules",
					icon: <TrendingUp className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.deliberationRules",
				},
				{
					to: "/admin/rules",
					icon: <FileCog className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.rules",
				},
			],
		},
		{
			title: "navigation.sidebar.groups.system",
			items: [
				{
					to: "/admin/registration-numbers",
					icon: <Hash className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.registrationNumbers",
				},
				{
					to: "/admin/monitoring",
					icon: <LayoutDashboard className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.monitoring",
				},
				{
					to: "/admin/notifications",
					icon: <Bell className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.notifications",
				},
				{
					to: "/admin/batch-jobs",
					icon: <PlayCircle className="h-[18px] w-[18px]" />,
					labelKey: "navigation.sidebar.admin.batchJobs",
				},
			],
		},
	];

	const teacherLinks = [
		{
			to: "/teacher",
			icon: <LayoutDashboard className="h-[18px] w-[18px]" />,
			labelKey: "navigation.sidebar.teacher.dashboard",
		},
		{
			to: "/teacher/courses",
			icon: <BookOpen className="h-[18px] w-[18px]" />,
			labelKey: "navigation.sidebar.teacher.courses",
		},
		{
			to: "/teacher/attendance",
			icon: <ClipboardList className="h-[18px] w-[18px]" />,
			labelKey: "navigation.sidebar.teacher.attendance",
		},
		{
			to: "/teacher/workflows",
			icon: <Bell className="h-[18px] w-[18px]" />,
			labelKey: "navigation.sidebar.teacher.workflows",
		},
	];

	const deanLinks = [
		{
			to: "/dean",
			icon: <LayoutDashboard className="h-[18px] w-[18px]" />,
			labelKey: "navigation.sidebar.dean.dashboard",
		},
		{
			to: "/dean/workflows",
			icon: <ClipboardList className="h-[18px] w-[18px]" />,
			labelKey: "navigation.sidebar.dean.workflows",
		},
	];

	const studentLinks = [
		{
			to: "/student",
			icon: <LayoutDashboard className="h-[18px] w-[18px]" />,
			labelKey: "navigation.sidebar.student.dashboard",
		},
	];

	const menuContent = (() => {
		if (!user) return { type: "flat" as const, items: [] };
		switch (user.role) {
			case "administrator":
			case "super_admin":
			case "owner":
				return { type: "grouped" as const, groups: adminMenuGroups };
			case "dean":
				return { type: "flat" as const, items: deanLinks };
			case "teacher":
				return { type: "flat" as const, items: teacherLinks };
			case "student":
				return { type: "flat" as const, items: studentLinks };
			default:
				return { type: "flat" as const, items: [] };
		}
	})();

	// Auto-pin only the group that contains the current route, unpin others
	useEffect(() => {
		if (menuContent.type !== "grouped") return;
		const pathname = location.pathname;
		let activeGroupKey: string | null = null;
		for (const group of menuContent.groups) {
			const groupKey = group.title.split(".").pop() || group.title;
			const hasActiveLink = group.items.some((link) =>
				link.to === "/admin" ||
				link.to === "/teacher" ||
				link.to === "/dean" ||
				link.to === "/student"
					? pathname === link.to
					: pathname.startsWith(link.to),
			);
			if (hasActiveLink) {
				activeGroupKey = groupKey;
				break;
			}
		}
		if (activeGroupKey) {
			setPinnedGroups(new Set([activeGroupKey]));
		}
	}, [location.pathname, menuContent]);

	const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
		`group flex items-center gap-3 rounded-r-lg border-l-[3px] px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
			isActive
				? "border-l-primary bg-primary/8 text-primary font-semibold"
				: "border-l-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
		}`;

	return (
		<AnimatePresence>
			{sidebarOpen && (
				<>
					{/* Mobile overlay */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
						onClick={() => useStore.getState().setSidebarOpen(false)}
					/>

					{/* Sidebar */}
					<motion.aside
						initial={{ x: -280 }}
						animate={{ x: 0 }}
						exit={{ x: -280 }}
						transition={{ duration: 0.25, ease: "easeOut" }}
						className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-sidebar-border border-r bg-gradient-to-b from-sidebar to-sidebar/95 md:static md:z-auto"
					>
						{/* Logo */}
						<div className="flex h-16 shrink-0 items-center border-sidebar-border border-b px-5">
							<motion.img
								src={logo}
								alt="TKAMS"
								className="h-8 w-auto"
								whileHover={{ scale: 1.04 }}
								transition={{ duration: 0.2 }}
							/>
						</div>

						{/* Navigation */}
						<nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
							{menuContent.type === "grouped"
								? menuContent.groups.map((group, groupIndex) => {
										const groupKey =
											group.title.split(".").pop() || group.title;
										const expanded = isGroupExpanded(groupKey);
										const isPinned = pinnedGroups.has(groupKey);
										return (
											<div
												key={group.title}
												className="mb-1"
												onMouseEnter={() => handleGroupMouseEnter(groupKey)}
												onMouseLeave={handleGroupMouseLeave}
											>
												{groupIndex > 0 && (
													<div className="mx-3 my-3 border-sidebar-border border-t" />
												)}
												<button
													type="button"
													onClick={() => toggleGroup(groupKey)}
													className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-widest transition-colors hover:text-sidebar-foreground"
												>
													<span className="flex items-center gap-1.5">
														<span
															className={`h-1 w-1 rounded-full ${isPinned ? "bg-primary" : "bg-primary/50"}`}
														/>
														{t(group.title, { defaultValue: group.title })}
													</span>
													{expanded ? (
														<ChevronDown className="h-3.5 w-3.5" />
													) : (
														<ChevronRight className="h-3.5 w-3.5" />
													)}
												</button>
												<AnimatePresence initial={false}>
													{expanded && (
														<motion.div
															initial={{ height: 0, opacity: 0 }}
															animate={{ height: "auto", opacity: 1 }}
															exit={{ height: 0, opacity: 0 }}
															transition={{ duration: 0.2 }}
															className="mt-1 space-y-0.5 overflow-hidden"
														>
															{group.items.map((link) => (
																<NavLink
																	key={link.to}
																	to={link.to}
																	end={
																		link.to === "/admin" ||
																		link.to === "/teacher" ||
																		link.to === "/dean" ||
																		link.to === "/student"
																	}
																	data-testid={`nav-${link.to}`}
																	className={navLinkClasses}
																>
																	<motion.span
																		className="shrink-0"
																		whileHover={{ scale: 1.2 }}
																		transition={{ duration: 0.15 }}
																	>
																		{link.icon}
																	</motion.span>
																	<span>{t(link.labelKey)}</span>
																</NavLink>
															))}
														</motion.div>
													)}
												</AnimatePresence>
											</div>
										);
									})
								: menuContent.items.map((link) => (
										<NavLink
											key={link.to}
											to={link.to}
											end={
												link.to === "/admin" ||
												link.to === "/teacher" ||
												link.to === "/dean" ||
												link.to === "/student"
											}
											data-testid={`nav-${link.to}`}
											className={navLinkClasses}
										>
											<motion.span
												className="shrink-0"
												whileHover={{ scale: 1.2 }}
												transition={{ duration: 0.15 }}
											>
												{link.icon}
											</motion.span>
											<span>{t(link.labelKey)}</span>
										</NavLink>
									))}
						</nav>

						{/* User info footer */}
						<div className="shrink-0 border-sidebar-border border-t p-4">
							<div className="flex items-center gap-3 rounded-lg bg-muted/40 p-2.5">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
									<span className="font-semibold text-primary text-sm">
										{user?.firstName?.[0]}
										{user?.lastName?.[0]}
									</span>
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-sidebar-foreground text-sm">
										{user?.firstName} {user?.lastName}
									</p>
									<span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-medium text-[10px] text-primary capitalize">
										{user?.role ? t(`navigation.roles.${user.role}`) : ""}
									</span>
								</div>
							</div>
						</div>
					</motion.aside>
				</>
			)}
		</AnimatePresence>
	);
};

export default Sidebar;

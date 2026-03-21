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
	Search,
	TrendingUp,
	UserCog,
	Users,
	X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useStore } from "../../store";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const ROOT_PATHS = new Set(["/admin", "/teacher", "/dean", "/student"]);

const Sidebar: React.FC = () => {
	const { user, sidebarOpen, sidebarCollapsed } = useStore();
	const { t } = useTranslation();
	const location = useLocation();
	const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["overview"]));
	const [search, setSearch] = useState("");

	const IC = "size-[15px] shrink-0";

	const adminGroups = useMemo(() => [
		{
			key: "overview",
			titleKey: "navigation.sidebar.groups.overview",
			items: [
				{ to: "/admin",                icon: <LayoutDashboard className={IC} />, labelKey: "navigation.sidebar.admin.dashboard" },
				{ to: "/admin/institution",    icon: <Landmark        className={IC} />, labelKey: "navigation.sidebar.admin.institution" },
				{ to: "/admin/academic-years", icon: <Calendar        className={IC} />, labelKey: "navigation.sidebar.admin.academicYears" },
			],
		},
		{
			key: "structure",
			titleKey: "navigation.sidebar.groups.structure",
			items: [
				{ to: "/admin/faculties",       icon: <Building2     className={IC} />, labelKey: "navigation.sidebar.admin.faculties" },
				{ to: "/admin/study-cycles",    icon: <Layers3       className={IC} />, labelKey: "navigation.sidebar.admin.studyCycles" },
				{ to: "/admin/programs",        icon: <School        className={IC} />, labelKey: "navigation.sidebar.admin.programs" },
				{ to: "/admin/teaching-units",  icon: <BookOpenCheck className={IC} />, labelKey: "navigation.sidebar.admin.teachingUnits" },
				{ to: "/admin/classes",         icon: <Users         className={IC} />, labelKey: "navigation.sidebar.admin.classes" },
			],
		},
		{
			key: "users",
			titleKey: "navigation.sidebar.groups.users",
			items: [
				{ to: "/admin/users",    icon: <UserCog       className={IC} />, labelKey: "navigation.sidebar.admin.users" },
				{ to: "/admin/students", icon: <GraduationCap className={IC} />, labelKey: "navigation.sidebar.admin.students" },
			],
		},
		{
			key: "teaching",
			titleKey: "navigation.sidebar.groups.teaching",
			items: [
				{ to: "/admin/courses",       icon: <BookOpen      className={IC} />, labelKey: "navigation.sidebar.admin.courses" },
				{ to: "/admin/class-courses", icon: <BookOpenCheck className={IC} />, labelKey: "navigation.sidebar.admin.courseAssignments" },
				{ to: "/admin/enrollments",   icon: <Calendar      className={IC} />, labelKey: "navigation.sidebar.admin.enrollments" },
			],
		},
		{
			key: "evaluation",
			titleKey: "navigation.sidebar.groups.evaluation",
			items: [
				{ to: "/admin/exams",              icon: <ClipboardList   className={IC} />, labelKey: "navigation.sidebar.admin.exams" },
				{ to: "/admin/exam-types",         icon: <ClipboardList   className={IC} />, labelKey: "navigation.sidebar.admin.examTypes" },
				{ to: "/admin/exam-scheduler",     icon: <CalendarPlus    className={IC} />, labelKey: "navigation.sidebar.admin.examScheduler" },
				{ to: "/admin/retake-eligibility", icon: <RefreshCw       className={IC} />, labelKey: "navigation.sidebar.admin.retakeEligibility" },
				{ to: "/admin/grade-export",       icon: <FileSpreadsheet className={IC} />, labelKey: "navigation.sidebar.admin.gradeExport" },
				{ to: "/admin/export-templates",   icon: <FileText        className={IC} />, labelKey: "navigation.sidebar.admin.exportTemplates" },
			],
		},
		{
			key: "promotion",
			titleKey: "navigation.sidebar.groups.promotion",
			items: [
				{ to: "/admin/deliberations",       icon: <Gavel     className={IC} />, labelKey: "navigation.sidebar.admin.deliberations" },
				{ to: "/admin/deliberations/rules", icon: <TrendingUp className={IC} />, labelKey: "navigation.sidebar.admin.deliberationRules" },
				{ to: "/admin/rules",               icon: <FileCog   className={IC} />, labelKey: "navigation.sidebar.admin.rules" },
			],
		},
		{
			key: "system",
			titleKey: "navigation.sidebar.groups.system",
			items: [
				{ to: "/admin/registration-numbers", icon: <Hash            className={IC} />, labelKey: "navigation.sidebar.admin.registrationNumbers" },
				{ to: "/admin/monitoring",           icon: <LayoutDashboard className={IC} />, labelKey: "navigation.sidebar.admin.monitoring" },
				{ to: "/admin/notifications",        icon: <Bell            className={IC} />, labelKey: "navigation.sidebar.admin.notifications" },
				{ to: "/admin/batch-jobs",           icon: <PlayCircle      className={IC} />, labelKey: "navigation.sidebar.admin.batchJobs" },
			],
		},
	], []);

	const teacherLinks = useMemo(() => [
		{ to: "/teacher",            icon: <LayoutDashboard className={IC} />, labelKey: "navigation.sidebar.teacher.dashboard" },
		{ to: "/teacher/courses",    icon: <BookOpen        className={IC} />, labelKey: "navigation.sidebar.teacher.courses" },
		{ to: "/teacher/attendance", icon: <ClipboardList   className={IC} />, labelKey: "navigation.sidebar.teacher.attendance" },
		{ to: "/teacher/workflows",  icon: <Bell            className={IC} />, labelKey: "navigation.sidebar.teacher.workflows" },
	], []);

	const deanLinks = useMemo(() => [
		{ to: "/dean",           icon: <LayoutDashboard className={IC} />, labelKey: "navigation.sidebar.dean.dashboard" },
		{ to: "/dean/workflows", icon: <ClipboardList   className={IC} />, labelKey: "navigation.sidebar.dean.workflows" },
	], []);

	const studentLinks = useMemo(() => [
		{ to: "/student", icon: <LayoutDashboard className={IC} />, labelKey: "navigation.sidebar.student.dashboard" },
	], []);

	const menuContent = useMemo(() => {
		if (!user) return { type: "flat" as const, items: teacherLinks };
		switch (user.role) {
			case "administrator":
			case "super_admin":
			case "owner":
				return { type: "grouped" as const, groups: adminGroups };
			case "dean":    return { type: "flat" as const, items: deanLinks };
			case "teacher": return { type: "flat" as const, items: teacherLinks };
			case "student": return { type: "flat" as const, items: studentLinks };
			default:        return { type: "flat" as const, items: teacherLinks };
		}
	}, [user, adminGroups, teacherLinks, deanLinks, studentLinks]);

	const allLinks = useMemo(() =>
		menuContent.type === "grouped"
			? menuContent.groups.flatMap((g) => g.items)
			: menuContent.items,
		[menuContent],
	);

	const toggleGroup = (key: string) =>
		setOpenGroups((prev) => {
			const next = new Set(prev);
			next.has(key) ? next.delete(key) : next.add(key);
			return next;
		});

	const isOpen = useCallback((key: string) => openGroups.has(key), [openGroups]);

	// Auto-expand active group
	useEffect(() => {
		if (menuContent.type !== "grouped") return;
		const path = location.pathname;
		for (const g of menuContent.groups) {
			if (g.items.some((l) =>
				ROOT_PATHS.has(l.to) ? path === l.to : path.startsWith(l.to),
			)) {
				setOpenGroups(new Set([g.key]));
				break;
			}
		}
	}, [location.pathname, menuContent]);

	// Expanded link style
	const expandedLinkClass = ({ isActive }: { isActive: boolean }) =>
		cn(
			"flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors duration-150",
			isActive
				? "bg-primary/10 text-primary font-semibold"
				: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
		);

	// Collapsed icon button — fixed 32×32, centered by parent flex items-center
	const iconBtnClass = ({ isActive }: { isActive: boolean }) =>
		cn(
			"flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150",
			isActive
				? "bg-primary text-primary-foreground"
				: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
		);

	const inner = (collapsed: boolean) => (
		<>
			{/* Logo */}
			<div className={cn(
				"flex h-14 shrink-0 items-center border-b border-sidebar-border",
				collapsed ? "justify-center" : "px-5",
			)}>
				{collapsed ? (
					<img src="/favicon.ico" alt="Logo" className="size-6 object-contain" />
				) : (
					<img src="/logo.png" alt="Logo" className="h-7 w-auto" />
				)}
			</div>

			{/* Search — expanded only */}
			{!collapsed && (
				<div className="shrink-0 border-b border-sidebar-border px-3 py-2">
					<div className="relative">
						<Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t("navigation.sidebar.search", { defaultValue: "Rechercher…" })}
							className="w-full rounded-md border border-border bg-muted/50 py-1.5 pl-7 pr-6 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
						/>
						{search && (
							<button
								type="button"
								onClick={() => setSearch("")}
								className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								<X className="size-3" />
							</button>
						)}
					</div>
				</div>
			)}

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto overscroll-contain py-2">
				{collapsed ? (
					/* Icon rail */
					<div className="flex flex-col py-1">
						{allLinks.map((link) => (
							<Tooltip key={link.to} delayDuration={80}>
								<TooltipTrigger asChild>
									<div className="flex w-full items-center justify-center py-0.5">
										<NavLink
											to={link.to}
											end={ROOT_PATHS.has(link.to)}
											className={iconBtnClass}
										>
											{link.icon}
										</NavLink>
									</div>
								</TooltipTrigger>
								<TooltipContent side="right" sideOffset={12}>
									{t(link.labelKey)}
								</TooltipContent>
							</Tooltip>
						))}
					</div>
				) : menuContent.type === "grouped" ? (
					/* Grouped expanded */
					(() => {
						const q = search.trim().toLowerCase();
						const visible = menuContent.groups
							.map((g) => ({
								...g,
								items: q
									? g.items.filter((l) => t(l.labelKey).toLowerCase().includes(q))
									: g.items,
							}))
							.filter((g) => g.items.length > 0);

						if (q && visible.length === 0) {
							return (
								<p className="px-3 py-6 text-center text-[12px] text-muted-foreground">
									{t("navigation.sidebar.noResults", { defaultValue: "Aucun résultat" })}
								</p>
							);
						}

						return (
							<div className="px-2 space-y-0.5">
								{visible.map((group, gi) => {
									const expanded = !!q || isOpen(group.key);
									return (
										<div key={group.key}>
											{gi > 0 && (
												<div className="my-2 border-t border-border" />
											)}
											<button
												type="button"
												onClick={() => !q && toggleGroup(group.key)}
												className="flex w-full items-center justify-between rounded px-1.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
											>
												<span>{t(group.titleKey, { defaultValue: group.key })}</span>
												{!q && (expanded
													? <ChevronDown className="size-3" />
													: <ChevronRight className="size-3" />
												)}
											</button>
											<AnimatePresence initial={false}>
												{expanded && (
													<motion.div
														initial={{ height: 0, opacity: 0 }}
														animate={{ height: "auto", opacity: 1 }}
														exit={{ height: 0, opacity: 0 }}
														transition={{ duration: 0.18 }}
														className="overflow-hidden space-y-0.5 mt-0.5"
													>
														{group.items.map((link) => (
															<NavLink
																key={link.to}
																to={link.to}
																end={ROOT_PATHS.has(link.to)}
																className={expandedLinkClass}
															>
																{link.icon}
																<span>{t(link.labelKey)}</span>
															</NavLink>
														))}
													</motion.div>
												)}
											</AnimatePresence>
										</div>
									);
								})}
							</div>
						);
					})()
				) : (
					/* Flat expanded */
					<div className="px-2 space-y-0.5">
						{menuContent.items.map((link) => (
							<NavLink
								key={link.to}
								to={link.to}
								end={ROOT_PATHS.has(link.to)}
								className={expandedLinkClass}
							>
								{link.icon}
								<span>{t(link.labelKey)}</span>
							</NavLink>
						))}
					</div>
				)}
			</nav>

			{/* User footer */}
			<div className={cn(
				"shrink-0 border-t border-sidebar-border",
				collapsed ? "flex items-center justify-center py-3" : "px-4 py-3",
			)}>
				{collapsed ? (
					<Tooltip delayDuration={80}>
						<TooltipTrigger asChild>
							<div className="flex size-8 cursor-default items-center justify-center rounded-full bg-primary/10">
								<span className="font-semibold text-primary text-xs leading-none">
									{user?.firstName?.[0]}{user?.lastName?.[0]}
								</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side="right" sideOffset={12}>
							<p className="font-semibold">{user?.firstName} {user?.lastName}</p>
							<p className="text-xs mt-0.5 opacity-70 capitalize">
								{user?.role ? t(`navigation.roles.${user.role}`) : ""}
							</p>
						</TooltipContent>
					</Tooltip>
				) : (
					<div className="flex items-center gap-2.5">
						<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
							<span className="font-semibold text-primary text-xs leading-none">
								{user?.firstName?.[0]}{user?.lastName?.[0]}
							</span>
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate font-semibold text-foreground text-[13px] leading-tight">
								{user?.firstName} {user?.lastName}
							</p>
							<p className="truncate text-[11px] text-muted-foreground capitalize mt-0.5">
								{user?.role ? t(`navigation.roles.${user.role}`) : ""}
							</p>
						</div>
					</div>
				)}
			</div>
		</>
	);

	return (
		<>
			{/* Mobile backdrop */}
			<AnimatePresence>
				{sidebarOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
						onClick={() => useStore.getState().setSidebarOpen(false)}
					/>
				)}
			</AnimatePresence>

			{/* Mobile drawer */}
			<AnimatePresence>
				{sidebarOpen && (
					<motion.aside
						initial={{ x: -280 }}
						animate={{ x: 0 }}
						exit={{ x: -280 }}
						transition={{ duration: 0.22, ease: "easeOut" }}
						className="bg-dot-pattern-subtle fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar md:hidden"
					>
						{inner(false)}
					</motion.aside>
				)}
			</AnimatePresence>

			{/* Desktop sidebar — always mounted, width animated */}
			<motion.aside
				animate={{ width: sidebarCollapsed ? 56 : 256 }}
				transition={{ duration: 0.22, ease: "easeInOut" }}
				className="bg-dot-pattern-subtle hidden md:flex flex-col shrink-0 border-r border-sidebar-border bg-sidebar overflow-hidden"
			>
				{inner(sidebarCollapsed)}
			</motion.aside>
		</>
	);
};

export default Sidebar;

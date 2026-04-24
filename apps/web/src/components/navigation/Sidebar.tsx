import { AnimatePresence, motion } from "framer-motion";
import {
	Bell,
	BookOpen,
	Building2,
	Calendar,
	ClipboardList,
	FileCog,
	FileSpreadsheet,
	Gavel,
	GraduationCap,
	LayoutDashboard,
	PlayCircle,
	School,
	Search,
	Settings2,
	TrendingUp,
	UserCog,
	Users,
	X,
} from "lucide-react";
import { useTheme } from "next-themes";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useStore } from "../../store";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const ROOT_PATHS = new Set([
	"/admin",
	"/teacher",
	"/grade-editor",
	"/dean",
	"/student",
]);

const Sidebar: React.FC = () => {
	const { user, sidebarOpen, sidebarCollapsed } = useStore();
	const { t } = useTranslation();
	const location = useLocation();
	const [search, setSearch] = useState("");

	const IC = "size-[15px] shrink-0";

	const adminGroups = useMemo(
		() => [
			{
				key: "overview",
				titleKey: "navigation.sidebar.groups.overview",
				items: [
					{
						to: "/admin",
						icon: <LayoutDashboard className={IC} />,
						labelKey: "navigation.sidebar.admin.dashboard",
					},
					{
						to: "/admin/academic-years",
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
						to: "/admin/institution",
						icon: <Building2 className={IC} />,
						labelKey: "navigation.sidebar.admin.institution",
					},
					{
						to: "/admin/programs",
						icon: <School className={IC} />,
						labelKey: "navigation.sidebar.admin.programs",
					},
					{
						to: "/admin/classes",
						icon: <Users className={IC} />,
						labelKey: "navigation.sidebar.admin.classes",
					},
				],
			},
			{
				key: "people",
				titleKey: "navigation.sidebar.groups.people",
				items: [
					{
						to: "/admin/students",
						icon: <GraduationCap className={IC} />,
						labelKey: "navigation.sidebar.admin.students",
					},
					{
						to: "/admin/users",
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
						to: "/admin/exams",
						icon: <ClipboardList className={IC} />,
						labelKey: "navigation.sidebar.admin.exams",
					},
					{
						to: "/admin/grades",
						icon: <FileSpreadsheet className={IC} />,
						labelKey: "navigation.sidebar.admin.gradeManagement",
					},
					{
						to: "/admin/deliberations",
						icon: <Gavel className={IC} />,
						labelKey: "navigation.sidebar.admin.deliberations",
						excludePrefix: "/admin/deliberations/rules",
					},
					{
						to: "/admin/promotion",
						icon: <TrendingUp className={IC} />,
						labelKey: "navigation.sidebar.admin.promotion",
					},
				],
			},
			{
				key: "system",
				titleKey: "navigation.sidebar.groups.system",
				items: [
					{
						to: "/admin/configuration",
						icon: <Settings2 className={IC} />,
						labelKey: "navigation.sidebar.admin.configuration",
					},
					{
						to: "/admin/monitoring",
						icon: <LayoutDashboard className={IC} />,
						labelKey: "navigation.sidebar.admin.monitoring",
					},
					{
						to: "/admin/batch-jobs",
						icon: <PlayCircle className={IC} />,
						labelKey: "navigation.sidebar.admin.batchJobs",
					},
					{
						to: "/admin/notifications",
						icon: <Bell className={IC} />,
						labelKey: "navigation.sidebar.admin.notifications",
					},
				],
			},
		],
		[],
	);

	const teacherLinks = useMemo(
		() => [
			{
				to: "/teacher",
				icon: <BookOpen className={IC} />,
				labelKey: "navigation.sidebar.teacher.myCourses",
			},
			{
				to: "/teacher/attendance",
				icon: <ClipboardList className={IC} />,
				labelKey: "navigation.sidebar.teacher.attendance",
			},
			{
				to: "/teacher/exports",
				icon: <FileSpreadsheet className={IC} />,
				labelKey: "navigation.sidebar.teacher.exports",
			},
		],
		[],
	);

	const deanLinks = useMemo(
		() => [
			{
				to: "/dean",
				icon: <ClipboardList className={IC} />,
				labelKey: "navigation.sidebar.dean.pendingApprovals",
			},
			{
				to: "/dean/history",
				icon: <FileCog className={IC} />,
				labelKey: "navigation.sidebar.dean.history",
			},
			{
				to: "/dean/monitoring",
				icon: <LayoutDashboard className={IC} />,
				labelKey: "navigation.sidebar.dean.monitoring",
			},
		],
		[],
	);

	const gradeEditorLinks = useMemo(
		() => [
			{
				to: "/grade-editor",
				icon: <BookOpen className={IC} />,
				labelKey: "navigation.sidebar.teacher.myCourses",
			},
			{
				to: "/grade-editor/exports",
				icon: <FileSpreadsheet className={IC} />,
				labelKey: "navigation.sidebar.teacher.exports",
			},
		],
		[],
	);

	const studentLinks = useMemo(
		() => [
			{
				to: "/student",
				icon: <LayoutDashboard className={IC} />,
				labelKey: "navigation.sidebar.student.dashboard",
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
				return { type: "flat" as const, items: deanLinks };
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
		deanLinks,
		studentLinks,
	]);

	const allLinks = useMemo(
		() =>
			menuContent.type === "grouped"
				? menuContent.groups.flatMap((g) => g.items)
				: menuContent.items,
		[menuContent],
	);

	// Expanded link style
	const expandedLinkClass = ({ isActive }: { isActive: boolean }) =>
		cn(
			"flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors duration-150",
			isActive
				? "bg-primary/10 font-semibold text-primary"
				: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
		);

	const makeLinkClass =
		(link: { excludePrefix?: string }) =>
		({ isActive }: { isActive: boolean }) => {
			const active =
				isActive &&
				!(
					link.excludePrefix && location.pathname.startsWith(link.excludePrefix)
				);
			return expandedLinkClass({ isActive: active });
		};

	// Collapsed icon button — fixed 32×32, centered by parent flex items-center
	const iconBtnClass = ({ isActive }: { isActive: boolean }) =>
		cn(
			"flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150",
			isActive
				? "bg-primary text-primary-foreground"
				: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
		);

	const { resolvedTheme } = useTheme();
	const logoSrc = resolvedTheme === "dark" ? "/logo-bg.png" : "/logo.png";
	const [logoHovered, setLogoHovered] = useState(false);
	const shimmerDone = useRef(false);

	const inner = (collapsed: boolean) => (
		<>
			{/* Logo */}
			<div
				className={cn(
					"flex h-14 shrink-0 items-center border-sidebar-border border-b",
					collapsed ? "justify-center" : "px-5",
				)}
			>
				<AnimatePresence mode="wait" initial={false}>
					{collapsed ? (
						<motion.img
							key="favicon"
							src="/favicon.ico"
							alt="Logo"
							className="size-6 object-contain"
							initial={{ opacity: 0, scale: 0.65, rotate: -15 }}
							animate={{ opacity: 1, scale: 1, rotate: 0 }}
							exit={{ opacity: 0, scale: 0.65, rotate: 15 }}
							transition={{ duration: 0.22, ease: "easeOut" }}
							whileHover={{ scale: 1.18, rotate: 8 }}
							whileTap={{ scale: 0.88 }}
						/>
					) : (
						<motion.div
							key="full-logo"
							className="relative cursor-default overflow-hidden"
							initial={{ opacity: 0, x: -14 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -14 }}
							transition={{ duration: 0.22, ease: "easeOut" }}
							whileHover={{ scale: 1.04 }}
							whileTap={{ scale: 0.96 }}
							onHoverStart={() => {
								shimmerDone.current = false;
								setLogoHovered(true);
							}}
							onHoverEnd={() => setLogoHovered(false)}
						>
							{/* Floating logo */}
							<motion.img
								src={logoSrc}
								alt="Logo"
								className="h-7 w-auto"
								animate={{ y: [0, -2, 0] }}
								transition={{
									duration: 5,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								}}
							/>
							{/* Shimmer sweep on hover */}
							<AnimatePresence>
								{logoHovered && (
									<motion.span
										key="shimmer"
										className="pointer-events-none absolute inset-0"
										initial={{ x: "-80%" }}
										animate={{ x: "180%" }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.55, ease: "easeInOut" }}
										style={{
											background:
												"linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%)",
											width: "60%",
										}}
									/>
								)}
							</AnimatePresence>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Search — expanded only */}
			{!collapsed && (
				<div className="shrink-0 border-sidebar-border border-b px-3 py-2.5">
					<div className="group relative">
						<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 size-3 text-muted-foreground/60 transition-colors duration-150 group-focus-within:text-primary" />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t("navigation.sidebar.search")}
							className="w-full rounded-lg border border-border bg-background/70 py-1.5 pr-6 pl-7 text-[12px] text-foreground shadow-sm outline-none transition-all duration-150 placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-background focus:shadow-md focus:shadow-primary/8 focus:ring-2 focus:ring-primary/10"
						/>
						{search && (
							<button
								type="button"
								onClick={() => setSearch("")}
								className="-translate-y-1/2 absolute top-1/2 right-2 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
											data-testid={`nav-${link.to}`}
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
									? g.items.filter((l) =>
											t(l.labelKey).toLowerCase().includes(q),
										)
									: g.items,
							}))
							.filter((g) => g.items.length > 0);

						if (q && visible.length === 0) {
							return (
								<p className="px-3 py-6 text-center text-[12px] text-muted-foreground">
									{t("navigation.sidebar.noResults", {
										defaultValue: "Aucun résultat",
									})}
								</p>
							);
						}

						return (
							<div className="space-y-0.5 px-2">
								{visible.map((group, gi) => {
									return (
										<div key={group.key}>
											{gi > 0 && (
												<div className="my-2 border-border border-t" />
											)}
											<p className="px-1.5 py-1 font-semibold text-[10px] text-muted-foreground uppercase tracking-widest">
												{t(group.titleKey, { defaultValue: group.key })}
											</p>
											<div className="mt-0.5 space-y-0.5">
												{group.items.map((link) => (
													<NavLink
														key={link.to}
														to={link.to}
														end={ROOT_PATHS.has(link.to)}
														className={makeLinkClass(link)}
														data-testid={`nav-${link.to}`}
													>
														{link.icon}
														<span>{t(link.labelKey)}</span>
													</NavLink>
												))}
											</div>
										</div>
									);
								})}
							</div>
						);
					})()
				) : (
					/* Flat expanded */
					<div className="space-y-0.5 px-2">
						{menuContent.items.map((link) => (
							<NavLink
								key={link.to}
								to={link.to}
								end={ROOT_PATHS.has(link.to)}
								className={makeLinkClass(link)}
								data-testid={`nav-${link.to}`}
							>
								{link.icon}
								<span>{t(link.labelKey)}</span>
							</NavLink>
						))}
					</div>
				)}
			</nav>

			{/* User footer */}
			<div
				className={cn(
					"shrink-0 border-sidebar-border border-t",
					collapsed ? "flex items-center justify-center py-3" : "px-4 py-3",
				)}
			>
				{collapsed ? (
					<Tooltip delayDuration={80}>
						<TooltipTrigger asChild>
							<div className="flex size-8 cursor-default items-center justify-center rounded-full bg-primary/10">
								<span className="font-semibold text-primary text-xs leading-none">
									{user?.firstName?.[0]}
									{user?.lastName?.[0]}
								</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side="right" sideOffset={12}>
							<p className="font-semibold">
								{user?.firstName} {user?.lastName}
							</p>
							<p className="mt-0.5 text-xs capitalize opacity-70">
								{user?.role ? t(`navigation.roles.${user.role}`) : ""}
							</p>
						</TooltipContent>
					</Tooltip>
				) : (
					<div className="flex items-center gap-2.5">
						<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
							<span className="font-semibold text-primary text-xs leading-none">
								{user?.firstName?.[0]}
								{user?.lastName?.[0]}
							</span>
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate font-semibold text-[13px] text-foreground leading-tight">
								{user?.firstName} {user?.lastName}
							</p>
							<p className="mt-0.5 truncate text-[11px] text-muted-foreground capitalize">
								{user?.role ? t(`navigation.roles.${user.role}`) : ""}
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Copyright */}
			{!collapsed && (
				<div className="border-sidebar-border/50 border-t px-4 pt-2 pb-3">
					<p className="text-center text-[10px] text-muted-foreground/50 leading-relaxed">
						© {new Date().getFullYear()} OverBrand
					</p>
					<p className="text-center text-[10px] text-muted-foreground/40">
						Cédric TEFOYE · Kana Yvan
					</p>
				</div>
			)}
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
						className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-sidebar-border border-r bg-dot-pattern-subtle bg-sidebar md:hidden"
					>
						{inner(false)}
					</motion.aside>
				)}
			</AnimatePresence>

			{/* Desktop sidebar — always mounted, width animated */}
			<motion.aside
				animate={{ width: sidebarCollapsed ? 56 : 256 }}
				transition={{ duration: 0.22, ease: "easeInOut" }}
				className="hidden shrink-0 flex-col overflow-hidden border-sidebar-border border-r bg-dot-pattern-subtle bg-sidebar md:flex"
			>
				{inner(sidebarCollapsed)}
			</motion.aside>
		</>
	);
};

export default Sidebar;

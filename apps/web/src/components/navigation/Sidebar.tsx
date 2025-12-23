import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowUpRight,
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
	GraduationCap,
	Hash,
	Landmark,
	Layers3,
	LayoutDashboard,
	School,
	TrendingUp,
	UserCog,
	Users,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { useStore } from "../../store";

const Sidebar: React.FC = () => {
	const { user, sidebarOpen } = useStore();
	const { t } = useTranslation();
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
		new Set(["overview"]),
	);

	const toggleGroup = (groupTitle: string) => {
		setExpandedGroups((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(groupTitle)) {
				newSet.delete(groupTitle);
			} else {
				newSet.add(groupTitle);
			}
			return newSet;
		});
	};

	const adminMenuGroups = [
		{
			title: "navigation.sidebar.groups.overview",
			items: [
				{
					to: "/admin",
					icon: <LayoutDashboard className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.dashboard",
				},
				{
					to: "/admin/institution",
					icon: <Landmark className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.institution",
				},
				{
					to: "/admin/academic-years",
					icon: <Calendar className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.academicYears",
				},
			],
		},
		{
			title: "navigation.sidebar.groups.structure",
			items: [
				{
					to: "/admin/study-cycles",
					icon: <Layers3 className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.studyCycles",
				},
				{
					to: "/admin/programs",
					icon: <School className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.programs",
				},
				{
					to: "/admin/teaching-units",
					icon: <BookOpenCheck className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.teachingUnits",
				},
				{
					to: "/admin/classes",
					icon: <Users className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.classes",
				},
			],
		},
		{
			title: "navigation.sidebar.groups.users",
			items: [
				{
					to: "/admin/users",
					icon: <UserCog className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.users",
				},
				{
					to: "/admin/students",
					icon: <GraduationCap className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.students",
				},
			],
		},
		{
			title: "navigation.sidebar.groups.teaching",
			items: [
				{
					to: "/admin/courses",
					icon: <BookOpen className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.courses",
				},
				{
					to: "/admin/class-courses",
					icon: <BookOpenCheck className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.courseAssignments",
				},
				{
					to: "/admin/enrollments",
					icon: <Calendar className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.enrollments",
				},
			],
		},
		{
			title: "navigation.sidebar.groups.evaluation",
			items: [
				{
					to: "/admin/exams",
					icon: <ClipboardList className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.exams",
				},
				{
					to: "/admin/exam-types",
					icon: <ClipboardList className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.examTypes",
				},
				{
					to: "/admin/exam-scheduler",
					icon: <CalendarPlus className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.examScheduler",
				},
				{
					to: "/admin/grade-export",
					icon: <FileSpreadsheet className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.gradeExport",
				},
				{
					to: "/admin/export-templates",
					icon: <FileText className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.exportTemplates",
				},
			],
		},
		{
			title: "navigation.sidebar.groups.promotion",
			items: [
				{
					to: "/admin/promotion-rules",
					icon: <TrendingUp className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.promotionRules",
				},
				// {
				// 	to: "/admin/student-promotion",
				// 	icon: <ArrowUpRight className="h-5 w-5" />,
				// 	labelKey: "navigation.sidebar.admin.studentPromotion",
				// },
				{
					to: "/admin/rules",
					icon: <FileCog className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.rules",
				},
			],
		},
		{
			title: "navigation.sidebar.groups.system",
			items: [
				{
					to: "/admin/registration-numbers",
					icon: <Hash className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.registrationNumbers",
				},
				{
					to: "/admin/monitoring",
					icon: <LayoutDashboard className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.monitoring",
				},
				{
					to: "/admin/notifications",
					icon: <Bell className="h-5 w-5" />,
					labelKey: "navigation.sidebar.admin.notifications",
				},
			],
		},
	];

	const teacherLinks = [
		{
			to: "/teacher",
			icon: <LayoutDashboard className="h-5 w-5" />,
			labelKey: "navigation.sidebar.teacher.dashboard",
		},
		{
			to: "/teacher/courses",
			icon: <BookOpen className="h-5 w-5" />,
			labelKey: "navigation.sidebar.teacher.courses",
		},
		{
			to: "/teacher/attendance",
			icon: <ClipboardList className="h-5 w-5" />,
			labelKey: "navigation.sidebar.teacher.attendance",
		},
		{
			to: "/teacher/workflows",
			icon: <Bell className="h-5 w-5" />,
			labelKey: "navigation.sidebar.teacher.workflows",
		},
	];

	const deanLinks = [
		{
			to: "/dean",
			icon: <LayoutDashboard className="h-5 w-5" />,
			labelKey: "navigation.sidebar.dean.dashboard",
		},
		{
			to: "/dean/workflows",
			icon: <ClipboardList className="h-5 w-5" />,
			labelKey: "navigation.sidebar.dean.workflows",
		},
	];

	const studentLinks = [
		{
			to: "/student",
			icon: <LayoutDashboard className="h-5 w-5" />,
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

	return (
		<AnimatePresence>
			{sidebarOpen && (
				<>
					{/* Mobile overlay */}
					<div
						className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
						onClick={() => useStore.getState().setSidebarOpen(false)}
					/>

					{/* Sidebar */}
					<motion.aside
						initial={{ x: -280 }}
						animate={{ x: 0 }}
						exit={{ x: -280 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="fixed inset-y-0 left-0 z-50 w-64 border-gray-200 border-r bg-white md:static md:z-auto"
					>
						<div className="flex h-full flex-col">
							{/* Logo */}
							<div className="flex h-16 items-center justify-start border-gray-200 border-b px-4 py-5">
								<img src="/logo.png" className="w-28" />
							</div>

							{/* Navigation */}
							<nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
								{menuContent.type === "grouped"
									? menuContent.groups.map((group, groupIndex) => {
											const groupKey =
												group.title.split(".").pop() || group.title;
											const isExpanded = expandedGroups.has(groupKey);
											return (
												<div key={group.title} className="mb-2">
													{groupIndex > 0 && (
														<div className="my-3 border-gray-200 border-t" />
													)}
													<button
														type="button"
														onClick={() => toggleGroup(groupKey)}
														className="flex w-full items-center justify-between rounded-lg px-4 py-2 font-semibold text-gray-700 text-xs uppercase tracking-wider transition-colors hover:bg-gray-100"
													>
														<span>
															{t(group.title, { defaultValue: group.title })}
														</span>
														{isExpanded ? (
															<ChevronDown className="h-4 w-4" />
														) : (
															<ChevronRight className="h-4 w-4" />
														)}
													</button>
													{isExpanded && (
														<div className="mt-1 space-y-0.5">
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
																	className={({ isActive }) =>
																		`flex items-center rounded-lg px-4 py-2.5 font-medium text-sm transition-colors ${
																			isActive
																				? "bg-primary-50 text-primary-800"
																				: "text-gray-700 hover:bg-gray-100"
																		}`
																	}
																>
																	{link.icon}
																	<span className="ml-3">
																		{t(link.labelKey)}
																	</span>
																</NavLink>
															))}
														</div>
													)}
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
												className={({ isActive }) =>
													`flex items-center rounded-lg px-4 py-3 font-medium text-sm transition-colors ${
														isActive
															? "bg-primary-50 text-primary-800"
															: "text-gray-700 hover:bg-gray-100"
													}`
												}
											>
												{link.icon}
												<span className="ml-3">{t(link.labelKey)}</span>
											</NavLink>
										))}
							</nav>

							{/* User info (mobile only) */}
							<div className="border-gray-200 border-t p-4 md:hidden">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
											<span className="font-medium text-primary-800 text-sm">
												{user?.firstName?.[0]}
												{user?.lastName?.[0]}
											</span>
										</div>
									</div>
									<div className="ml-3">
										<p className="font-medium text-gray-700 text-sm">
											{user?.firstName} {user?.lastName}
										</p>
										<p className="text-gray-500 text-xs capitalize">
											{user?.role ? t(`navigation.roles.${user.role}`) : ""}
										</p>
									</div>
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

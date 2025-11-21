import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowUpRight,
	BookOpen,
	BookOpenCheck,
	Building2,
	Calendar,
ClipboardList,
FileSpreadsheet,
GraduationCap,
LayoutDashboard,
Bell,
School,
UserCog,
Users,
} from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useStore } from "../../store";

const Sidebar: React.FC = () => {
	const { user, sidebarOpen } = useStore();
	const { t } = useTranslation();

        const adminLinks = [
                {
                        to: "/admin",
                        icon: <LayoutDashboard className="h-5 w-5" />,
			labelKey: "navigation.sidebar.admin.dashboard",
		},
		{
			to: "/admin/academic-years",
			icon: <Calendar className="h-5 w-5" />,
			labelKey: "navigation.sidebar.admin.academicYears",
		},
		{
			to: "/admin/faculties",
			icon: <Building2 className="h-5 w-5" />,
			labelKey: "navigation.sidebar.admin.faculties",
		},
		{
			to: "/admin/programs",
			icon: <School className="h-5 w-5" />,
			labelKey: "navigation.sidebar.admin.programs",
		},
		{
			to: "/admin/users",
			icon: <UserCog className="h-5 w-5" />,
			labelKey: "navigation.sidebar.admin.users",
		},
		{
			to: "/admin/courses",
			icon: <BookOpen className="h-5 w-5" />,
			labelKey: "navigation.sidebar.admin.courses",
		},
		{
			to: "/admin/classes",
			icon: <Users className="h-5 w-5" />,
			labelKey: "navigation.sidebar.admin.classes",
		},
		{
			to: "/admin/students",
			icon: <GraduationCap className="h-5 w-5" />,
			labelKey: "navigation.sidebar.admin.students",
		},
		{
			to: "/admin/class-courses",
			icon: <BookOpenCheck className="h-5 w-5" />,
			labelKey: "navigation.sidebar.admin.courseAssignments",
		},
		{
			to: "/admin/exams",
			icon: <ClipboardList className="h-5 w-5" />,
			labelKey: "navigation.sidebar.admin.exams",
		},
		{
			to: "/admin/student-promotion",
			icon: <ArrowUpRight className="h-5 w-5" />,
			labelKey: "navigation.sidebar.admin.studentPromotion",
		},
                {
                        to: "/admin/grade-export",
                        icon: <FileSpreadsheet className="h-5 w-5" />,
                        labelKey: "navigation.sidebar.admin.gradeExport",
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

        const links = (() => {
                if (!user) return [];
                switch (user.role) {
                        case "administrator":
                        case "super_admin":
                                return adminLinks;
                        case "dean":
                                return deanLinks;
                        case "teacher":
                                return teacherLinks;
                        case "student":
                                return studentLinks;
                        default:
                                return [];
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
							<div className="flex h-16 items-center justify-center border-gray-200 border-b px-4 py-5">
								<GraduationCap className="h-8 w-8 text-primary-700" />
								<h1 className="ml-2 font-bold text-primary-900 text-xl">
									AcademiSys
								</h1>
							</div>

							{/* Navigation */}
							<nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
								{links.map((link) => (
									<NavLink
										key={link.to}
										to={link.to}
										end={link.to === "/admin" || link.to === "/teacher"}
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

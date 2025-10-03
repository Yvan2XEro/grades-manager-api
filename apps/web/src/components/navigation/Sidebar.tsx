import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "../../store";
import {
  LayoutDashboard,
  BookOpen,
  Building2,
  GraduationCap,
  Calendar,
  Users,
  UserCog,
  ClipboardList,
  School,
  BookOpenCheck,
  FileSpreadsheet,
  ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  ];

  const links = user?.role === "admin" ? adminLinks : teacherLinks;

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Mobile overlay */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => useStore.getState().setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 md:static md:z-auto"
          >
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex items-center justify-center h-16 px-4 py-5 border-b border-gray-200">
                <GraduationCap className="h-8 w-8 text-primary-700" />
                <h1 className="ml-2 text-xl font-bold text-primary-900">
                  AcademiSys
                </h1>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === "/admin" || link.to === "/teacher"}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
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
              <div className="p-4 border-t border-gray-200 md:hidden">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-800 font-medium text-sm">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
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

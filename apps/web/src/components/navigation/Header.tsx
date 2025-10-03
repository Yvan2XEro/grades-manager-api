import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, X, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStore } from "../../store";
import { authClient } from "../../lib/auth-client";
import { toast } from "sonner";

const Header: React.FC = () => {
  const { user, sidebarOpen, toggleSidebar, clearUser } = useStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      clearUser();
      navigate("/auth/login");
      toast.success(t("auth.logout.success"));
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error(t("auth.logout.error"));
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 mr-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={t("navigation.header.toggleSidebarAria")}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-primary-900">
              {user?.role === "admin"
                ? t("navigation.header.adminDashboard")
                : t("navigation.header.teacherDashboard")}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={i18n.language}
            onChange={(e) => {
              i18n.changeLanguage(e.target.value);
              localStorage.setItem("lng", e.target.value);
            }}
            className="select"
          >
            <option value="en">En</option>
            <option value="fr">Fr</option>
          </select>
          <details className="dropdown">
            <summary className=" btn bg-transparent m-1">
              <div className="avatar">
                <div className="ring-primary ring-offset-base-100 w-8 rounded-full ring-2 ring-offset-2">
                  <img src="https://img.daisyui.com/images/profile/demo/spiderperson@192.webp" />
                </div>
              </div>
            </summary>
            <ul className="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
              <li>
                <a>
                  {user?.firstName} {user?.lastName}
                </a>
              </li>
              <li>
                <a onClick={handleLogout}>
                  <LogOut className="w-5 h-5" />
                  {t("auth.logout.aria")}
                </a>
              </li>
            </ul>
          </details>

          <button
            className="p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={t("navigation.header.notificationsAria")}
          >
            <Bell className="w-5 h-5" />
          </button>
          {/* <div className="hidden md:flex items-center"> */}
          {/*   <div className="ml-3 mr-4"> */}
          {/*     <p className="text-sm font-medium text-gray-700"> */}
          {/*       {user?.firstName} {user?.lastName} */}
          {/*     </p> */}
          {/*     <p className="text-xs text-gray-500 capitalize"> */}
          {/*       {user?.role ? t(`navigation.roles.${user.role}`) : ""} */}
          {/*     </p> */}
          {/*   </div> */}
          {/* </div> */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={t("auth.logout.aria")}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

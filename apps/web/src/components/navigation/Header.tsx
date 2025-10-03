import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, X, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { authClient } from '../../lib/auth-client';
import { toast } from 'sonner';

const Header: React.FC = () => {
  const { user, sidebarOpen, toggleSidebar, clearUser } = useStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      clearUser();
      navigate('/auth/login');
      toast.success(t('auth.logout.success'));
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error(t('auth.logout.error'));
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 mr-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={t('navigation.header.toggleSidebarAria')}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-primary-900">
              {user?.role === 'admin'
                ? t('navigation.header.adminDashboard')
                : t('navigation.header.teacherDashboard')}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label={t('navigation.header.notificationsAria')}>
            <Bell className="w-5 h-5" />
          </button>
          <div className="hidden md:flex items-center">
            <div className="ml-3 mr-4">
              <p className="text-sm font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role ? t(`navigation.roles.${user.role}`) : ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={t('auth.logout.aria')}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

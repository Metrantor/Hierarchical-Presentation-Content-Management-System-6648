import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMenu, FiSun, FiMoon, FiUser, FiLogOut, FiSettings } = FiIcons;

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { currentUser, logout } = useAuth();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/content')) return 'Inhalte';
    if (path.includes('/kanban')) return 'Kanban Board';
    if (path.includes('/editor')) return 'Editor';
    if (path.includes('/users')) return 'Benutzerverwaltung';
    return 'Präsentations-CMS';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-dark-700">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 lg:hidden"
          >
            <SafeIcon icon={FiMenu} className="w-6 h-6" />
          </button>
          
          <div className="ml-4 lg:ml-0">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
            title={isDarkMode ? 'Heller Modus' : 'Dunkler Modus'}
          >
            <SafeIcon icon={isDarkMode ? FiSun : FiMoon} className="w-5 h-5" />
          </button>

          <div className="relative group">
            <button className="flex items-center space-x-2 p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
              <SafeIcon icon={FiUser} className="w-5 h-5" />
              <span className="hidden md:block text-sm font-medium">
                {currentUser?.name}
              </span>
            </button>

            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-md shadow-lg border border-gray-200 dark:border-dark-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-1">
                <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-dark-700">
                  <div className="font-medium">{currentUser?.name}</div>
                  <div className="text-gray-500">{currentUser?.email}</div>
                  <div className="text-xs text-gray-400 capitalize">{currentUser?.role}</div>
                </div>
                
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => navigate('/users')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                  >
                    <SafeIcon icon={FiSettings} className="w-4 h-4 mr-2" />
                    Benutzerverwaltung
                  </button>
                )}
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <SafeIcon icon={FiLogOut} className="w-4 h-4 mr-2" />
                  Abmelden
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
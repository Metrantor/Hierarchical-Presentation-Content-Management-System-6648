import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiHome, FiFolder, FiTrello, FiEdit, FiUsers, FiBookOpen } = FiIcons;

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const navigationItems = [
    { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/content', icon: FiFolder, label: 'Inhalte' },
    { to: '/kanban', icon: FiTrello, label: 'Kanban Board' },
    { to: '/editor/subject', icon: FiEdit, label: 'Neuer Inhalt' },
  ];

  if (currentUser?.role === 'admin') {
    navigationItems.push({ to: '/users', icon: FiUsers, label: 'Benutzer' });
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center">
            <SafeIcon icon={FiBookOpen} className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
              CMS
            </span>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 lg:hidden"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                  }
                `}
              >
                <SafeIcon icon={item.icon} className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-dark-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Präsentations-CMS v1.0
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
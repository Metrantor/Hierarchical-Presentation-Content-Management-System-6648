import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiFolder, FiBookOpen, FiFileText, FiPlay, FiPlus, FiTrendingUp, FiClock, FiCheck } = FiIcons;

const Dashboard = () => {
  const navigate = useNavigate();
  const { data } = useData();

  const stats = [
    {
      name: 'Fachgebiete',
      value: data.subjects.length,
      icon: FiFolder,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      name: 'Trainings',
      value: data.trainings.length,
      icon: FiBookOpen,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      name: 'Themen',
      value: data.topics.length,
      icon: FiFileText,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      name: 'Einheiten',
      value: data.units.length,
      icon: FiPlay,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  const statusStats = [
    {
      name: 'Backlog',
      value: getAllItems().filter(item => item.status === 'backlog').length,
      icon: FiClock,
      color: 'text-gray-600 dark:text-gray-400'
    },
    {
      name: 'Entwurf',
      value: getAllItems().filter(item => item.status === 'draft').length,
      icon: FiTrendingUp,
      color: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      name: 'Bereit',
      value: getAllItems().filter(item => item.status === 'ready').length,
      icon: FiCheck,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      name: 'Veröffentlicht',
      value: getAllItems().filter(item => item.status === 'published').length,
      icon: FiCheck,
      color: 'text-blue-600 dark:text-blue-400'
    }
  ];

  function getAllItems() {
    return [
      ...data.subjects,
      ...data.trainings,
      ...data.topics,
      ...data.units
    ];
  }

  const quickActions = [
    {
      name: 'Neues Fachgebiet',
      description: 'Erstellen Sie ein neues Fachgebiet',
      action: () => navigate('/editor/subject'),
      icon: FiFolder,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Neues Training',
      description: 'Fügen Sie ein neues Training hinzu',
      action: () => navigate('/editor/training'),
      icon: FiBookOpen,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      name: 'Kanban Board',
      description: 'Verwalten Sie den Status Ihrer Inhalte',
      action: () => navigate('/kanban'),
      icon: FiTrendingUp,
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      name: 'Alle Inhalte',
      description: 'Durchsuchen Sie alle Inhalte',
      action: () => navigate('/content'),
      icon: FiFileText,
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ];

  const recentItems = getAllItems()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-dark-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Willkommen im Präsentations-CMS
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Verwalten Sie Ihre Präsentationsinhalte strukturiert und effizient.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-dark-700"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-md ${stat.bg}`}>
                <SafeIcon icon={stat.icon} className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Overview */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-dark-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Status-Übersicht
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusStats.map((stat) => (
            <div key={stat.name} className="text-center">
              <div className="flex justify-center mb-2">
                <SafeIcon icon={stat.icon} className={`w-8 h-8 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-dark-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Schnellaktionen
          </h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <button
                key={action.name}
                onClick={action.action}
                className="w-full flex items-center p-3 rounded-lg border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                <div className={`p-2 rounded-md ${action.color} text-white`}>
                  <SafeIcon icon={action.icon} className="w-5 h-5" />
                </div>
                <div className="ml-3 text-left">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {action.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Items */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-dark-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Zuletzt bearbeitet
          </h2>
          <div className="space-y-3">
            {recentItems.length > 0 ? (
              recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors cursor-pointer"
                  onClick={() => {
                    const type = data.subjects.includes(item) ? 'subject' :
                                data.trainings.includes(item) ? 'training' :
                                data.topics.includes(item) ? 'topic' : 'unit';
                    navigate(`/editor/${type}/${item.id}`);
                  }}
                >
                  <div className={`status-badge status-${item.status}`}>
                    {item.status}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(item.updatedAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Noch keine Inhalte vorhanden
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
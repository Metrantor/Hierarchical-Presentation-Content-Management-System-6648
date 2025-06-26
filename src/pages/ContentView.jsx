import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiGrid, FiList, FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiFolder, FiBookOpen, FiFileText, FiPlay, FiEye } = FiIcons;

const ContentView = () => {
  const navigate = useNavigate();
  const { type: urlType, id: urlId } = useParams();
  const { data, deleteItem } = useData();

  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPath, setCurrentPath] = useState({
    type: urlType || 'subject',
    id: urlId || null
  });

  const typeConfig = {
    subject: {
      name: 'Fachgebiet',
      plural: 'Fachgebiete',
      icon: FiFolder,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      children: 'training'
    },
    training: {
      name: 'Training',
      plural: 'Trainings',
      icon: FiBookOpen,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/20',
      children: 'topic'
    },
    topic: {
      name: 'Thema',
      plural: 'Themen',
      icon: FiFileText,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      children: 'unit'
    },
    unit: {
      name: 'Einheit',
      plural: 'Einheiten',
      icon: FiPlay,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/20',
      children: null
    }
  };

  const currentItems = useMemo(() => {
    let items = [];
    const { type, id } = currentPath;

    if (type === 'subject') {
      items = data.subjects;
    } else if (type === 'training') {
      if (id) {
        // Show trainings for specific subject
        items = data.trainings.filter(t => t.subjectId === id);
      } else {
        // Show all trainings
        items = data.trainings;
      }
    } else if (type === 'topic') {
      if (id) {
        // Show topics for specific training
        items = data.topics.filter(t => t.trainingId === id);
      } else {
        // Show all topics
        items = data.topics;
      }
    } else if (type === 'unit') {
      if (id) {
        // Show units for specific topic
        items = data.units.filter(u => u.topicId === id);
      } else {
        // Show all units
        items = data.units;
      }
    }

    // Apply search filter
    if (searchTerm) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      items = items.filter(item => item.status === filterStatus);
    }

    return items;
  }, [data, currentPath, searchTerm, filterStatus]);

  const breadcrumbs = useMemo(() => {
    const crumbs = [{ name: 'Alle Inhalte', type: 'subject', id: null }];
    
    if (currentPath.type === 'training' && currentPath.id) {
      const subject = data.subjects.find(s => s.id === currentPath.id);
      if (subject) {
        crumbs.push({ name: subject.name, type: 'training', id: subject.id, parentId: subject.id });
      }
    } else if (currentPath.type === 'topic' && currentPath.id) {
      const training = data.trainings.find(t => t.id === currentPath.id);
      if (training) {
        const subject = data.subjects.find(s => s.id === training.subjectId);
        if (subject) {
          crumbs.push({ name: subject.name, type: 'training', id: subject.id, parentId: subject.id });
        }
        crumbs.push({ name: training.name, type: 'topic', id: training.id, parentId: training.id });
      }
    } else if (currentPath.type === 'unit' && currentPath.id) {
      const topic = data.topics.find(t => t.id === currentPath.id);
      if (topic) {
        const training = data.trainings.find(t => t.id === topic.trainingId);
        if (training) {
          const subject = data.subjects.find(s => s.id === training.subjectId);
          if (subject) {
            crumbs.push({ name: subject.name, type: 'training', id: subject.id, parentId: subject.id });
          }
          crumbs.push({ name: training.name, type: 'topic', id: training.id, parentId: training.id });
        }
        crumbs.push({ name: topic.name, type: 'unit', id: topic.id, parentId: topic.id });
      }
    }

    return crumbs;
  }, [currentPath, data]);

  const handleItemClick = (item) => {
    const config = typeConfig[currentPath.type];
    if (config.children) {
      // Navigate to children view
      setCurrentPath({ type: config.children, id: item.id });
    } else {
      // Edit the item (for units)
      navigate(`/editor/${currentPath.type}/${item.id}`);
    }
  };

  const handleEdit = (item, e) => {
    e.stopPropagation();
    navigate(`/editor/${currentPath.type}/${item.id}`);
  };

  const handleDelete = (item, e) => {
    e.stopPropagation();
    if (window.confirm(`Möchten Sie "${item.name}" wirklich löschen?`)) {
      const pluralType = currentPath.type === 'training' ? 'trainings' :
                        currentPath.type === 'topic' ? 'topics' :
                        currentPath.type === 'unit' ? 'units' : 'subjects';
      deleteItem(pluralType, item.id);
    }
  };

  const handleBreadcrumbClick = (crumb) => {
    if (crumb.parentId) {
      setCurrentPath({ type: crumb.type, id: crumb.parentId });
    } else {
      setCurrentPath({ type: crumb.type, id: crumb.id });
    }
  };

  const config = typeConfig[currentPath.type];

  // Helper function to get parent name for display
  const getParentInfo = (item) => {
    if (currentPath.type === 'training' && item.subjectId) {
      const subject = data.subjects.find(s => s.id === item.subjectId);
      return subject ? `${subject.name}` : '';
    } else if (currentPath.type === 'topic' && item.trainingId) {
      const training = data.trainings.find(t => t.id === item.trainingId);
      return training ? `${training.name}` : '';
    } else if (currentPath.type === 'unit' && item.topicId) {
      const topic = data.topics.find(t => t.id === item.topicId);
      return topic ? `${topic.name}` : '';
    }
    return '';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          {breadcrumbs.map((crumb, index) => (
            <li key={index}>
              <div className="flex items-center">
                {index > 0 && (
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400 mr-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <button
                  onClick={() => handleBreadcrumbClick(crumb)}
                  className={`text-sm font-medium ${
                    index === breadcrumbs.length - 1
                      ? 'text-gray-500 dark:text-gray-400'
                      : 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300'
                  }`}
                >
                  {crumb.name}
                </button>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {config.plural}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {currentItems.length} {currentItems.length === 1 ? config.name : config.plural}
            {currentPath.id && ` in ${breadcrumbs[breadcrumbs.length - 1]?.name}`}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => navigate(`/editor/${currentPath.type}`)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
            Neues {config.name}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-dark-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Alle Status</option>
              <option value="backlog">Backlog</option>
              <option value="draft">Entwurf</option>
              <option value="ready">Bereit</option>
              <option value="published">Veröffentlicht</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid'
                  ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
            >
              <SafeIcon icon={FiGrid} className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${
                viewMode === 'list'
                  ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
            >
              <SafeIcon icon={FiList} className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12">
          <SafeIcon icon={config.icon} className={`w-12 h-12 mx-auto mb-4 ${config.color}`} />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine {config.plural} gefunden
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Keine Einträge entsprechen Ihren Suchkriterien.'
              : `Erstellen Sie Ihr erstes ${config.name}.`
            }
          </p>
          <button
            onClick={() => navigate(`/editor/${currentPath.type}`)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
            Neues {config.name}
          </button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {currentItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`
                bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 hover:shadow-md transition-shadow cursor-pointer
                ${viewMode === 'grid' ? 'p-6' : 'p-4 flex items-center'}
              `}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-md ${config.bg}`}>
                      <SafeIcon icon={config.icon} className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div className={`status-badge status-${item.status}`}>
                      {item.status}
                    </div>
                  </div>
                  
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-32 object-cover rounded-md mb-4"
                    />
                  )}
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.name}
                  </h3>
                  
                  {getParentInfo(item) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {getParentInfo(item)}
                    </p>
                  )}
                  
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.updatedAt).toLocaleDateString('de-DE')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => handleEdit(item, e)}
                        className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        title="Bearbeiten"
                      >
                        <SafeIcon icon={FiEdit} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(item, e)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Löschen"
                      >
                        <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={`p-3 rounded-md ${config.bg} mr-4`}>
                    <SafeIcon icon={config.icon} className={`w-6 h-6 ${config.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {item.name}
                      </h3>
                      <div className={`status-badge status-${item.status} ml-4`}>
                        {item.status}
                      </div>
                    </div>
                    
                    {getParentInfo(item) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {getParentInfo(item)}
                      </p>
                    )}
                    
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.updatedAt).toLocaleDateString('de-DE')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => handleEdit(item, e)}
                          className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                          title="Bearbeiten"
                        >
                          <SafeIcon icon={FiEdit} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item, e)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Löschen"
                        >
                          <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentView;
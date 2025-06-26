import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit, FiFolder, FiBookOpen, FiFileText, FiPlay, FiFilter } = FiIcons;

const KanbanBoard = () => {
  const navigate = useNavigate();
  const { data, updateItemStatus, createItem } = useData();
  const [filterType, setFilterType] = useState('all');
  const [showNewItemForm, setShowNewItemForm] = useState({ status: null, type: null });
  const [newItemName, setNewItemName] = useState('');
  const [newItemParents, setNewItemParents] = useState({ subjectId: '', trainingId: '', topicId: '' });

  const statusColumns = [
    { id: 'backlog', name: 'Backlog', color: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'draft', name: 'Entwurf', color: 'bg-yellow-100 dark:bg-yellow-900/20' },
    { id: 'ready', name: 'Bereit', color: 'bg-green-100 dark:bg-green-900/20' },
    { id: 'published', name: 'Veröffentlicht', color: 'bg-blue-100 dark:bg-blue-900/20' }
  ];

  const typeConfig = {
    subject: { name: 'Fachgebiet', icon: FiFolder, color: 'text-blue-600' },
    training: { name: 'Training', icon: FiBookOpen, color: 'text-green-600' },
    topic: { name: 'Thema', icon: FiFileText, color: 'text-purple-600' },
    unit: { name: 'Einheit', icon: FiPlay, color: 'text-orange-600' }
  };

  const allItems = useMemo(() => {
    const items = [];
    
    data.subjects.forEach(item => items.push({ ...item, type: 'subject' }));
    data.trainings.forEach(item => items.push({ ...item, type: 'training' }));
    data.topics.forEach(item => items.push({ ...item, type: 'topic' }));
    data.units.forEach(item => items.push({ ...item, type: 'unit' }));

    return filterType === 'all' ? items : items.filter(item => item.type === filterType);
  }, [data, filterType]);

  const itemsByStatus = useMemo(() => {
    const grouped = {};
    statusColumns.forEach(column => {
      grouped[column.id] = allItems.filter(item => item.status === column.id);
    });
    return grouped;
  }, [allItems]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const item = allItems.find(item => item.id === draggableId);
    if (!item) return;

    const pluralType = item.type === 'subject' ? 'subjects' :
                      item.type === 'training' ? 'trainings' :
                      item.type === 'topic' ? 'topics' : 'units';

    updateItemStatus(pluralType, item.id, destination.droppableId);
  };

  const handleCreateNewItem = (status, type) => {
    if (!newItemName.trim()) return;

    const pluralType = type === 'subject' ? 'subjects' :
                      type === 'training' ? 'trainings' :
                      type === 'topic' ? 'topics' : 'units';

    const newItem = {
      name: newItemName,
      description: '',
      notes: '',
      urls: [],
      image: null,
      status: status
    };

    // Add parent relationships for hierarchical structure
    if (type === 'training' && newItemParents.subjectId) {
      newItem.subjectId = newItemParents.subjectId;
    } else if (type === 'topic' && newItemParents.subjectId && newItemParents.trainingId) {
      newItem.subjectId = newItemParents.subjectId;
      newItem.trainingId = newItemParents.trainingId;
    } else if (type === 'unit' && newItemParents.subjectId && newItemParents.trainingId && newItemParents.topicId) {
      newItem.subjectId = newItemParents.subjectId;
      newItem.trainingId = newItemParents.trainingId;
      newItem.topicId = newItemParents.topicId;
    }

    createItem(pluralType, newItem);
    setNewItemName('');
    setNewItemParents({ subjectId: '', trainingId: '', topicId: '' });
    setShowNewItemForm({ status: null, type: null });
  };

  const handleEditItem = (item) => {
    navigate(`/editor/${item.type}/${item.id}`);
  };

  const getItemHierarchyInfo = (item) => {
    let info = '';
    
    if (item.type === 'training' && item.subjectId) {
      const subject = data.subjects.find(s => s.id === item.subjectId);
      info = subject ? subject.name : '';
    } else if (item.type === 'topic' && item.trainingId) {
      const training = data.trainings.find(t => t.id === item.trainingId);
      if (training) {
        const subject = data.subjects.find(s => s.id === training.subjectId);
        info = subject ? `${subject.name} > ${training.name}` : training.name;
      }
    } else if (item.type === 'unit' && item.topicId) {
      const topic = data.topics.find(t => t.id === item.topicId);
      if (topic) {
        const training = data.trainings.find(t => t.id === topic.trainingId);
        if (training) {
          const subject = data.subjects.find(s => s.id === training.subjectId);
          info = subject ? `${subject.name} > ${training.name} > ${topic.name}` : `${training.name} > ${topic.name}`;
        } else {
          info = topic.name;
        }
      }
    }
    
    return info;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kanban Board
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Verwalten Sie den Status Ihrer Inhalte per Drag & Drop
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Alle Typen</option>
            <option value="subject">Fachgebiete</option>
            <option value="training">Trainings</option>
            <option value="topic">Themen</option>
            <option value="unit">Einheiten</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statusColumns.map((column) => (
            <div key={column.id} className="flex flex-col">
              <div className={`${column.color} rounded-lg p-4 mb-4`}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {column.name}
                  </h2>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {itemsByStatus[column.id].length}
                  </span>
                </div>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver 
                        ? 'bg-primary-50 dark:bg-primary-900/10 border-2 border-dashed border-primary-300 dark:border-primary-600' 
                        : ''
                    }`}
                  >
                    {itemsByStatus[column.id].map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`kanban-card bg-white dark:bg-dark-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-dark-700 ${
                              snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center">
                                <SafeIcon 
                                  icon={typeConfig[item.type].icon} 
                                  className={`w-4 h-4 mr-2 ${typeConfig[item.type].color}`} 
                                />
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                  {typeConfig[item.type].name}
                                </span>
                              </div>
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                                title="Bearbeiten"
                              >
                                <SafeIcon icon={FiEdit} className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                              {item.name}
                            </h3>
                            
                            {getItemHierarchyInfo(item) && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                                {getItemHierarchyInfo(item)}
                              </p>
                            )}
                            
                            {item.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            
                            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                              {new Date(item.updatedAt).toLocaleDateString('de-DE')}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    
                    {provided.placeholder}
                    
                    {/* Add new item button */}
                    <div className="mt-4">
                      {showNewItemForm.status === column.id ? (
                        <div className="bg-white dark:bg-dark-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-dark-700">
                          <select
                            value={showNewItemForm.type || ''}
                            onChange={(e) => {
                              const type = e.target.value;
                              setShowNewItemForm({ ...showNewItemForm, type });
                              // Reset parent selections when type changes
                              setNewItemParents({ subjectId: '', trainingId: '', topicId: '' });
                            }}
                            className="w-full mb-2 border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="">Typ auswählen</option>
                            <option value="subject">Fachgebiet</option>
                            <option value="training">Training</option>
                            <option value="topic">Thema</option>
                            <option value="unit">Einheit</option>
                          </select>

                          {/* Parent selection dropdowns */}
                          {showNewItemForm.type === 'training' && (
                            <select
                              value={newItemParents.subjectId}
                              onChange={(e) => setNewItemParents({ ...newItemParents, subjectId: e.target.value })}
                              className="w-full mb-2 border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                            >
                              <option value="">Fachgebiet auswählen</option>
                              {data.subjects.map(subject => (
                                <option key={subject.id} value={subject.id}>{subject.name}</option>
                              ))}
                            </select>
                          )}

                          {showNewItemForm.type === 'topic' && (
                            <>
                              <select
                                value={newItemParents.subjectId}
                                onChange={(e) => {
                                  const subjectId = e.target.value;
                                  setNewItemParents({ ...newItemParents, subjectId, trainingId: '' });
                                }}
                                className="w-full mb-2 border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                              >
                                <option value="">Fachgebiet auswählen</option>
                                {data.subjects.map(subject => (
                                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                                ))}
                              </select>
                              <select
                                value={newItemParents.trainingId}
                                onChange={(e) => setNewItemParents({ ...newItemParents, trainingId: e.target.value })}
                                className="w-full mb-2 border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                                disabled={!newItemParents.subjectId}
                              >
                                <option value="">Training auswählen</option>
                                {data.trainings.filter(training => training.subjectId === newItemParents.subjectId).map(training => (
                                  <option key={training.id} value={training.id}>{training.name}</option>
                                ))}
                              </select>
                            </>
                          )}

                          {showNewItemForm.type === 'unit' && (
                            <>
                              <select
                                value={newItemParents.subjectId}
                                onChange={(e) => {
                                  const subjectId = e.target.value;
                                  setNewItemParents({ ...newItemParents, subjectId, trainingId: '', topicId: '' });
                                }}
                                className="w-full mb-2 border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                              >
                                <option value="">Fachgebiet auswählen</option>
                                {data.subjects.map(subject => (
                                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                                ))}
                              </select>
                              <select
                                value={newItemParents.trainingId}
                                onChange={(e) => {
                                  const trainingId = e.target.value;
                                  setNewItemParents({ ...newItemParents, trainingId, topicId: '' });
                                }}
                                className="w-full mb-2 border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                                disabled={!newItemParents.subjectId}
                              >
                                <option value="">Training auswählen</option>
                                {data.trainings.filter(training => training.subjectId === newItemParents.subjectId).map(training => (
                                  <option key={training.id} value={training.id}>{training.name}</option>
                                ))}
                              </select>
                              <select
                                value={newItemParents.topicId}
                                onChange={(e) => setNewItemParents({ ...newItemParents, topicId: e.target.value })}
                                className="w-full mb-2 border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                                disabled={!newItemParents.trainingId}
                              >
                                <option value="">Thema auswählen</option>
                                {data.topics.filter(topic => topic.trainingId === newItemParents.trainingId).map(topic => (
                                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                                ))}
                              </select>
                            </>
                          )}
                          
                          <input
                            type="text"
                            placeholder="Name eingeben..."
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="w-full mb-2 border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && showNewItemForm.type && newItemName.trim()) {
                                const canCreate = showNewItemForm.type === 'subject' || 
                                                (showNewItemForm.type === 'training' && newItemParents.subjectId) ||
                                                (showNewItemForm.type === 'topic' && newItemParents.subjectId && newItemParents.trainingId) ||
                                                (showNewItemForm.type === 'unit' && newItemParents.subjectId && newItemParents.trainingId && newItemParents.topicId);
                                
                                if (canCreate) {
                                  handleCreateNewItem(column.id, showNewItemForm.type);
                                }
                              }
                            }}
                          />
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleCreateNewItem(column.id, showNewItemForm.type)}
                              disabled={!newItemName.trim() || !showNewItemForm.type || 
                                (showNewItemForm.type === 'training' && !newItemParents.subjectId) ||
                                (showNewItemForm.type === 'topic' && (!newItemParents.subjectId || !newItemParents.trainingId)) ||
                                (showNewItemForm.type === 'unit' && (!newItemParents.subjectId || !newItemParents.trainingId || !newItemParents.topicId))
                              }
                              className="flex-1 px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Hinzufügen
                            </button>
                            <button
                              onClick={() => {
                                setShowNewItemForm({ status: null, type: null });
                                setNewItemName('');
                                setNewItemParents({ subjectId: '', trainingId: '', topicId: '' });
                              }}
                              className="flex-1 px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowNewItemForm({ status: column.id, type: null })}
                          className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
                          Hinzufügen
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const STORAGE_KEY = 'presentation_cms_data';

const initialData = {
  subjects: [],
  trainings: [],
  topics: [],
  units: [],
  users: [
    { id: '1', name: 'Demo User', email: 'demo@example.com', role: 'author', avatar: null },
    { id: '2', name: 'Admin User', email: 'admin@example.com', role: 'admin', avatar: null }
  ]
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialData;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const saveData = (newData) => {
    setData(newData);
  };

  const createItem = (type, item) => {
    const newItem = {
      ...item,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: item.status || 'backlog'
    };

    setData(prev => ({
      ...prev,
      [type]: [...prev[type], newItem]
    }));

    return newItem;
  };

  const updateItem = (type, id, updates) => {
    setData(prev => ({
      ...prev,
      [type]: prev[type].map(item => 
        item.id === id 
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      )
    }));
  };

  const deleteItem = (type, id) => {
    setData(prev => {
      const newData = { ...prev };
      
      // Remove the item
      newData[type] = prev[type].filter(item => item.id !== id);
      
      // Also remove dependent items in hierarchical structure
      if (type === 'subjects') {
        // Remove trainings that belong to this subject
        newData.trainings = prev.trainings.filter(training => training.subjectId !== id);
        // Remove topics that belong to trainings of this subject
        const trainingIds = prev.trainings.filter(training => training.subjectId === id).map(t => t.id);
        newData.topics = prev.topics.filter(topic => !trainingIds.includes(topic.trainingId));
        // Remove units that belong to topics of trainings of this subject
        const topicIds = prev.topics.filter(topic => trainingIds.includes(topic.trainingId)).map(t => t.id);
        newData.units = prev.units.filter(unit => !topicIds.includes(unit.topicId));
      } else if (type === 'trainings') {
        // Remove topics that belong to this training
        newData.topics = prev.topics.filter(topic => topic.trainingId !== id);
        // Remove units that belong to topics of this training
        const topicIds = prev.topics.filter(topic => topic.trainingId === id).map(t => t.id);
        newData.units = prev.units.filter(unit => !topicIds.includes(unit.topicId));
      } else if (type === 'topics') {
        // Remove units that belong to this topic
        newData.units = prev.units.filter(unit => unit.topicId !== id);
      }
      
      return newData;
    });
  };

  const getItemsByParent = (type, parentId, parentType) => {
    return data[type].filter(item => item[parentType] === parentId);
  };

  const getItemById = (type, id) => {
    return data[type].find(item => item.id === id);
  };

  const updateItemStatus = (type, id, status) => {
    updateItem(type, id, { status });
  };

  const addComment = (type, id, comment) => {
    const item = getItemById(type, id);
    if (item) {
      const newComment = {
        id: uuidv4(),
        text: comment.text,
        author: comment.author,
        createdAt: new Date().toISOString(),
        rating: comment.rating || 0
      };
      
      updateItem(type, id, {
        comments: [...(item.comments || []), newComment]
      });
    }
  };

  const exportData = (type, format = 'json') => {
    const items = data[type];
    if (format === 'json') {
      return JSON.stringify(items, null, 2);
    }
    
    if (format === 'markdown') {
      return items.map(item => {
        let md = `# ${item.name}\n\n`;
        if (item.description) md += `${item.description}\n\n`;
        if (item.explanationText) md += `${item.explanationText}\n\n`;
        if (item.speechTexts) {
          md += `## Sprechtexte\n\n`;
          item.speechTexts.forEach((text, index) => {
            md += `${index + 1}. ${text.text}\n`;
          });
        }
        return md;
      }).join('\n---\n\n');
    }
    
    if (format === 'text') {
      return items.map(item => {
        let text = `${item.name}\n`;
        if (item.description) text += `${item.description}\n`;
        if (item.explanationText) text += `${item.explanationText}\n`;
        if (item.speechTexts) {
          item.speechTexts.forEach((speechText, index) => {
            text += `${index + 1}. ${speechText.text}\n`;
          });
        }
        return text;
      }).join('\n\n');
    }
  };

  const value = {
    data,
    saveData,
    createItem,
    updateItem,
    deleteItem,
    getItemsByParent,
    getItemById,
    updateItemStatus,
    addComment,
    exportData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { saveAs } from 'file-saver';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSave, FiArrowLeft, FiPlus, FiTrash2, FiMove, FiImage, FiLink, FiDownload, FiMessageSquare, FiThumbsUp, FiEye, FiEdit, FiCopy } = FiIcons;

const ContentEditor = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { data, createItem, updateItem, getItemById, addComment } = useData();
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);

  const [item, setItem] = useState({
    name: '',
    description: '',
    notes: '',
    urls: [''],
    image: null,
    status: 'backlog',
    speechTexts: [],
    explanationText: '',
    comments: [],
    // Hierarchical parent relationships
    subjectId: null,
    trainingId: null,
    topicId: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentRating, setCommentRating] = useState(0);
  const [draggedSpeechIndex, setDraggedSpeechIndex] = useState(null);

  useEffect(() => {
    if (id) {
      const pluralType = type === 'subject' ? 'subjects' :
                        type === 'training' ? 'trainings' :
                        type === 'topic' ? 'topics' : 'units';
      
      const existingItem = getItemById(pluralType, id);
      if (existingItem) {
        setItem({
          ...existingItem,
          urls: existingItem.urls || [''],
          speechTexts: existingItem.speechTexts || [],
          explanationText: existingItem.explanationText || '',
          comments: existingItem.comments || []
        });
        setIsEditing(true);
      }
    }
  }, [id, type, getItemById]);

  const handleSave = () => {
    const pluralType = type === 'subject' ? 'subjects' :
                      type === 'training' ? 'trainings' :
                      type === 'topic' ? 'topics' : 'units';

    const itemToSave = {
      ...item,
      urls: item.urls.filter(url => url.trim() !== '')
    };

    if (isEditing) {
      updateItem(pluralType, id, itemToSave);
    } else {
      createItem(pluralType, itemToSave);
    }

    navigate('/content');
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setItem({ ...item, image: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (index, value) => {
    const newUrls = [...item.urls];
    newUrls[index] = value;
    setItem({ ...item, urls: newUrls });
  };

  const addUrl = () => {
    if (item.urls.length < 5) {
      setItem({ ...item, urls: [...item.urls, ''] });
    }
  };

  const removeUrl = (index) => {
    const newUrls = item.urls.filter((_, i) => i !== index);
    setItem({ ...item, urls: newUrls });
  };

  const addSpeechText = () => {
    setItem({
      ...item,
      speechTexts: [...item.speechTexts, { text: '', image: null }]
    });
  };

  const updateSpeechText = (index, field, value) => {
    const newSpeechTexts = [...item.speechTexts];
    newSpeechTexts[index] = { ...newSpeechTexts[index], [field]: value };
    setItem({ ...item, speechTexts: newSpeechTexts });
  };

  const removeSpeechText = (index) => {
    const newSpeechTexts = item.speechTexts.filter((_, i) => i !== index);
    setItem({ ...item, speechTexts: newSpeechTexts });
  };

  const handleSpeechDragStart = (index) => {
    setDraggedSpeechIndex(index);
  };

  const handleSpeechDragOver = (e) => {
    e.preventDefault();
  };

  const handleSpeechDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedSpeechIndex !== null && draggedSpeechIndex !== targetIndex) {
      const newSpeechTexts = [...item.speechTexts];
      const draggedItem = newSpeechTexts[draggedSpeechIndex];
      newSpeechTexts.splice(draggedSpeechIndex, 1);
      newSpeechTexts.splice(targetIndex, 0, draggedItem);
      setItem({ ...item, speechTexts: newSpeechTexts });
    }
    setDraggedSpeechIndex(null);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      text: newComment,
      author: currentUser.name,
      rating: commentRating
    };

    const pluralType = type === 'subject' ? 'subjects' :
                      type === 'training' ? 'trainings' :
                      type === 'topic' ? 'topics' : 'units';

    if (isEditing) {
      addComment(pluralType, id, comment);
      setItem({
        ...item,
        comments: [...(item.comments || []), {
          id: Date.now().toString(),
          ...comment,
          createdAt: new Date().toISOString()
        }]
      });
    }

    setNewComment('');
    setCommentRating(0);
  };

  const handleExport = (format) => {
    let content = '';
    let filename = `${item.name || 'content'}.${format}`;

    if (format === 'txt') {
      content = `${item.name}\n\n`;
      if (item.description) content += `${item.description}\n\n`;
      if (item.explanationText) content += `${item.explanationText}\n\n`;
      if (item.speechTexts.length > 0) {
        content += 'Sprechtexte:\n';
        item.speechTexts.forEach((speech, index) => {
          content += `${index + 1}. ${speech.text}\n`;
        });
      }
    } else if (format === 'md') {
      content = `# ${item.name}\n\n`;
      if (item.description) content += `${item.description}\n\n`;
      if (item.explanationText) content += `${item.explanationText}\n\n`;
      if (item.speechTexts.length > 0) {
        content += '## Sprechtexte\n\n';
        item.speechTexts.forEach((speech, index) => {
          content += `${index + 1}. ${speech.text}\n\n`;
        });
      }
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, filename);
  };

  const processWithAI = async (text) => {
    // Simulate AI processing - in real app, this would call Dialogflow REST API
    try {
      const response = await new Promise(resolve => {
        setTimeout(() => {
          resolve({
            processedText: `[KI-überarbeitet] ${text} - Verbesserte Struktur und Klarheit.`
          });
        }, 1000);
      });
      
      return response.processedText;
    } catch (error) {
      console.error('AI processing failed:', error);
      return text;
    }
  };

  const handleAIProcess = async (index) => {
    const currentText = item.speechTexts[index].text;
    if (!currentText.trim()) return;

    const processedText = await processWithAI(currentText);
    updateSpeechText(index, 'text', processedText);
  };

  // Clipboard functionality
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show success feedback
      const button = event.target.closest('button');
      const originalIcon = button.innerHTML;
      button.innerHTML = '<span class="text-green-500">✓ Kopiert</span>';
      setTimeout(() => {
        button.innerHTML = originalIcon;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Kopieren fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
  };

  const copyExplanationText = () => {
    if (item.explanationText) {
      copyToClipboard(item.explanationText);
    }
  };

  const copySpeechText = (speechText) => {
    if (speechText) {
      copyToClipboard(speechText);
    }
  };

  const typeConfig = {
    subject: { name: 'Fachgebiet', icon: FiImage },
    training: { name: 'Training', icon: FiImage },
    topic: { name: 'Thema', icon: FiImage },
    unit: { name: 'Einheit', icon: FiImage }
  };

  const config = typeConfig[type];

  // Parent selection dropdowns
  const getParentSelectOptions = () => {
    const options = {};
    
    if (type === 'training') {
      options.subjects = data.subjects;
    } else if (type === 'topic') {
      options.subjects = data.subjects;
      options.trainings = data.trainings;
    } else if (type === 'unit') {
      options.subjects = data.subjects;
      options.trainings = data.trainings;
      options.topics = data.topics;
    }
    
    return options;
  };

  const parentOptions = getParentSelectOptions();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/content')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <SafeIcon icon={FiArrowLeft} className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? `${config.name} bearbeiten` : `Neues ${config.name}`}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {type === 'unit' && (
            <>
              <button
                onClick={() => handleExport('txt')}
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
              >
                <SafeIcon icon={FiDownload} className="w-4 h-4 mr-2" />
                TXT
              </button>
              <button
                onClick={() => handleExport('md')}
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
              >
                <SafeIcon icon={FiDownload} className="w-4 h-4 mr-2" />
                MD
              </button>
            </>
          )}
          
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
          >
            <SafeIcon icon={FiSave} className="w-4 h-4 mr-2" />
            Speichern
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-dark-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Grundinformationen
        </h2>
        
        <div className="space-y-4">
          {/* Parent Selection */}
          {type === 'training' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fachgebiet *
              </label>
              <select
                value={item.subjectId || ''}
                onChange={(e) => setItem({ ...item, subjectId: e.target.value })}
                className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Fachgebiet auswählen</option>
                {parentOptions.subjects?.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
          )}

          {type === 'topic' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fachgebiet *
                </label>
                <select
                  value={item.subjectId || ''}
                  onChange={(e) => {
                    const subjectId = e.target.value;
                    setItem({ ...item, subjectId, trainingId: null });
                  }}
                  className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Fachgebiet auswählen</option>
                  {parentOptions.subjects?.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Training *
                </label>
                <select
                  value={item.trainingId || ''}
                  onChange={(e) => setItem({ ...item, trainingId: e.target.value })}
                  className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                  disabled={!item.subjectId}
                >
                  <option value="">Training auswählen</option>
                  {parentOptions.trainings?.filter(training => training.subjectId === item.subjectId).map(training => (
                    <option key={training.id} value={training.id}>{training.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {type === 'unit' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fachgebiet *
                </label>
                <select
                  value={item.subjectId || ''}
                  onChange={(e) => {
                    const subjectId = e.target.value;
                    setItem({ ...item, subjectId, trainingId: null, topicId: null });
                  }}
                  className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Fachgebiet auswählen</option>
                  {parentOptions.subjects?.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Training *
                </label>
                <select
                  value={item.trainingId || ''}
                  onChange={(e) => {
                    const trainingId = e.target.value;
                    setItem({ ...item, trainingId, topicId: null });
                  }}
                  className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                  disabled={!item.subjectId}
                >
                  <option value="">Training auswählen</option>
                  {parentOptions.trainings?.filter(training => training.subjectId === item.subjectId).map(training => (
                    <option key={training.id} value={training.id}>{training.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thema *
                </label>
                <select
                  value={item.topicId || ''}
                  onChange={(e) => setItem({ ...item, topicId: e.target.value })}
                  className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                  disabled={!item.trainingId}
                >
                  <option value="">Thema auswählen</option>
                  {parentOptions.topics?.filter(topic => topic.trainingId === item.trainingId).map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => setItem({ ...item, name: e.target.value })}
              className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder={`${config.name} Name`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Beschreibung
            </label>
            <textarea
              value={item.description}
              onChange={(e) => setItem({ ...item, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Beschreibung eingeben..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notizen
            </label>
            <textarea
              value={item.notes}
              onChange={(e) => setItem({ ...item, notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Interne Notizen..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={item.status}
              onChange={(e) => setItem({ ...item, status: e.target.value })}
              className="border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="backlog">Backlog</option>
              <option value="draft">Entwurf</option>
              <option value="ready">Bereit für Produktion</option>
              <option value="published">Veröffentlicht</option>
            </select>
          </div>
        </div>
      </div>

      {/* Image Upload */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-dark-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Bild/Icon
        </h2>
        
        <div className="space-y-4">
          {item.image ? (
            <div className="relative">
              <img
                src={item.image}
                alt="Uploaded"
                className="w-full max-w-md h-48 object-cover rounded-lg"
              />
              <button
                onClick={() => setItem({ ...item, image: null })}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                <SafeIcon icon={FiTrash2} className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="image-upload-area"
            >
              <SafeIcon icon={FiImage} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Klicken Sie hier, um ein Bild hochzuladen
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                PNG, JPG, GIF bis zu 10MB
              </p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* URLs */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            URLs (max. 5)
          </h2>
          <button
            onClick={addUrl}
            disabled={item.urls.length >= 5}
            className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
          >
            <SafeIcon icon={FiPlus} className="w-4 h-4 mr-1" />
            URL hinzufügen
          </button>
        </div>
        
        <div className="space-y-3">
          {item.urls.map((url, index) => (
            <div key={index} className="flex items-center space-x-2">
              <SafeIcon icon={FiLink} className="w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                className="flex-1 border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://example.com"
              />
              <button
                onClick={() => removeUrl(index)}
                className="p-2 text-red-600 hover:text-red-700"
              >
                <SafeIcon icon={FiTrash2} className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Unit-specific fields */}
      {type === 'unit' && (
        <>
          {/* Speech Texts */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sprechtexte
              </h2>
              <button
                onClick={addSpeechText}
                className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center text-sm"
              >
                <SafeIcon icon={FiPlus} className="w-4 h-4 mr-1" />
                Sprechtext hinzufügen
              </button>
            </div>
            
            <div className="space-y-4">
              {item.speechTexts.map((speech, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleSpeechDragStart(index)}
                  onDragOver={handleSpeechDragOver}
                  onDrop={(e) => handleSpeechDrop(e, index)}
                  className="border border-gray-200 dark:border-dark-600 rounded-lg p-4 bg-gray-50 dark:bg-dark-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiMove} className="w-4 h-4 text-gray-400 cursor-move" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sprechtext {index + 1}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copySpeechText(speech.text)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center"
                        title="In Zwischenablage kopieren"
                        disabled={!speech.text.trim()}
                      >
                        <SafeIcon icon={FiCopy} className="w-3 h-3 mr-1" />
                        Kopieren
                      </button>
                      <button
                        onClick={() => handleAIProcess(index)}
                        className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                        title="Mit KI überarbeiten"
                      >
                        KI
                      </button>
                      <button
                        onClick={() => removeSpeechText(index)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <textarea
                    value={speech.text}
                    onChange={(e) => updateSpeechText(index, 'text', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Sprechtext eingeben..."
                  />
                  
                  {speech.image && (
                    <div className="mt-3">
                      <img
                        src={speech.image}
                        alt={`Speech ${index + 1}`}
                        className="w-full max-w-sm h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Explanation Text */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Erklärtext (Markdown)
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={copyExplanationText}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
                  title="Erklärtext in Zwischenablage kopieren"
                  disabled={!item.explanationText.trim()}
                >
                  <SafeIcon icon={FiCopy} className="w-4 h-4 mr-1" />
                  Kopieren
                </button>
                <button
                  onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center text-sm"
                >
                  <SafeIcon icon={showMarkdownPreview ? FiEdit : FiEye} className="w-4 h-4 mr-1" />
                  {showMarkdownPreview ? 'Bearbeiten' : 'Vorschau'}
                </button>
              </div>
            </div>
            
            {showMarkdownPreview ? (
              <div className="markdown-preview border border-gray-200 dark:border-dark-600 rounded-md p-4 bg-gray-50 dark:bg-dark-700 min-h-[200px]">
                <ReactMarkdown>{item.explanationText || '*Keine Inhalte vorhanden*'}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={item.explanationText}
                onChange={(e) => setItem({ ...item, explanationText: e.target.value })}
                rows={8}
                className="markdown-editor w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Markdown-Text eingeben..."
              />
            )}
          </div>

          {/* Comments and Ratings */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-dark-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Kommentare und Bewertungen
            </h2>
            
            {/* Add Comment */}
            <div className="border border-gray-200 dark:border-dark-600 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Neuer Kommentar
                </span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setCommentRating(star)}
                      className={`w-5 h-5 ${
                        star <= commentRating
                          ? 'text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      <SafeIcon icon={FiThumbsUp} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
              
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-3"
                placeholder="Kommentar eingeben..."
              />
              
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || !isEditing}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
              >
                <SafeIcon icon={FiMessageSquare} className="w-4 h-4 mr-2" />
                Kommentar hinzufügen
              </button>
            </div>
            
            {/* Comments List */}
            <div className="space-y-3">
              {item.comments.map((comment) => (
                <div key={comment.id} className="border border-gray-200 dark:border-dark-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {comment.author}
                    </span>
                    <div className="flex items-center space-x-2">
                      {comment.rating > 0 && (
                        <div className="flex items-center">
                          {Array.from({ length: comment.rating }).map((_, i) => (
                            <SafeIcon key={i} icon={FiThumbsUp} className="w-4 h-4 text-yellow-400" />
                          ))}
                        </div>
                      )}
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {comment.text}
                  </p>
                </div>
              ))}
              
              {item.comments.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Noch keine Kommentare vorhanden
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContentEditor;
import React, { useState, useEffect } from 'react';
import { tabService } from '../services/tabService';
import { workspaceService } from '../services/workspaceService';
import { Workspace, Tab } from '../types/workspace';
import { IconPicker } from './IconPicker';
import { ColorPicker, COLORS } from './ColorPicker';
import { ICON_NAMES } from '../utils/iconMap';
import { ArrowLeft } from 'lucide-react';

interface CreateWorkspaceProps {
  seedTab?: Tab;
  onCancel: () => void;
  onCreated: (workspace: Workspace) => void;
}

export function CreateWorkspace({ seedTab, onCancel, onCreated }: CreateWorkspaceProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [icon, setIcon] = useState<string>(ICON_NAMES[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    workspaceService.getAllWorkspaces().then(workspaces => {
      const cats = new Set<string>();
      workspaces.forEach(w => {
        if (w.category) cats.add(w.category);
      });
      setExistingCategories(Array.from(cats).sort());
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSaving(true);
    try {
      const tabsToSave = seedTab ? [seedTab] : await tabService.getCurrentWindowTabs();
      const newWorkspace = await workspaceService.createWorkspace(trimmedName, icon, color, tabsToSave, category.trim());
      onCreated(newWorkspace);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors animate-in slide-in-from-right-4 duration-200">
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-10 transition-colors flex items-center gap-3">
        <button 
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors -ml-2"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Create Workspace</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4 overflow-y-auto">
        <div className="mb-4">
          <label htmlFor="name" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full font-semibold text-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm"
            placeholder="e.g. Research, Travel..."
            autoFocus
          />
        </div>

        <div className="mb-6">
          <label htmlFor="category" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Group / Category (Optional)
          </label>
          <input
            id="category"
            type="text"
            list="categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full font-medium text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm"
            placeholder="e.g. Work, Clients..."
          />
          <datalist id="categories">
            {existingCategories.map(cat => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Icon
          </label>
          <IconPicker selectedIcon={icon} onSelect={setIcon} />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Color
          </label>
          <ColorPicker selectedColor={color} onSelect={setColor} />
        </div>

        <div className="mt-auto pt-6 pb-4">
          <button
            type="submit"
            disabled={!name.trim() || isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:shadow-none disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 flex justify-center items-center gap-2"
          >
            {isSaving && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            {isSaving ? 'Creating...' : (seedTab ? 'Create & Save Tab' : 'Create & Save All Tabs')}
          </button>
        </div>
      </form>
    </div>
  );
}

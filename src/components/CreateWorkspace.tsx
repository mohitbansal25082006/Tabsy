import React, { useState } from 'react';
import { tabService } from '../services/tabService';
import { workspaceService } from '../services/workspaceService';
import { Workspace, Tab } from '../types/workspace';
import { IconPicker, ICONS } from './IconPicker';
import { ColorPicker, COLORS } from './ColorPicker';

interface CreateWorkspaceProps {
  seedTab?: Tab;
  onCancel: () => void;
  onCreated: (workspace: Workspace) => void;
}

export function CreateWorkspace({ seedTab, onCancel, onCreated }: CreateWorkspaceProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSaving(true);
    try {
      const tabsToSave = seedTab ? [seedTab] : await tabService.getCurrentWindowTabs();
      const newWorkspace = await workspaceService.createWorkspace(trimmedName, icon, color, tabsToSave);
      onCreated(newWorkspace);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 flex flex-col h-full bg-white dark:bg-gray-900 transition-colors">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Back"
        >
          &larr;
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Workspace</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="mb-5">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Work, Research, Travel"
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            autoFocus
            required
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Icon
          </label>
          <IconPicker selectedIcon={icon} onSelect={setIcon} />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <ColorPicker selectedColor={color} onSelect={setColor} />
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors flex justify-center items-center"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Create & Save Tabs'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
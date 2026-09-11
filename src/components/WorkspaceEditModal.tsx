import React, { useState, useEffect } from 'react';
import { Workspace } from '../types/workspace';
import { workspaceService } from '../services/workspaceService';
import { IconPicker } from './IconPicker';
import { ColorPicker } from './ColorPicker';
import { ICON_NAMES } from '../utils/iconMap';
import { COLORS } from './ColorPicker';

interface WorkspaceEditModalProps {
  workspace: Workspace;
  onClose: () => void;
  onUpdate: (workspace: Workspace) => void;
}

export function WorkspaceEditModal({ workspace, onClose, onUpdate }: WorkspaceEditModalProps) {
  const [name, setName] = useState(workspace.name);
  const [category, setCategory] = useState(workspace.category || '');
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [icon, setIcon] = useState(workspace.icon && ICON_NAMES.includes(workspace.icon as any) ? workspace.icon : ICON_NAMES[0]);
  const [color, setColor] = useState(workspace.color || COLORS[0]);
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

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSaving(true);
    try {
      const trimmedCategory = category.trim();
      await workspaceService.updateWorkspaceMetadata(workspace.id, trimmedName, icon, color, trimmedCategory);
      onUpdate({ ...workspace, name: trimmedName, icon, color, category: trimmedCategory === '' ? undefined : trimmedCategory, updatedAt: Date.now() });
      onClose();
    } catch (error) {
      console.error('Failed to update workspace:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-gray-900/40 dark:bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-gray-700">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Workspace</h2>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full font-semibold bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="modal-category" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Group / Category (Optional)
            </label>
            <input
              id="modal-category"
              type="text"
              list="modal-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full font-medium text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm"
              placeholder="e.g. Work, Clients..."
            />
            <datalist id="modal-categories">
              {existingCategories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Icon</label>
            <IconPicker selectedIcon={icon} onSelect={setIcon} />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Color</label>
            <ColorPicker selectedColor={color} onSelect={setColor} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

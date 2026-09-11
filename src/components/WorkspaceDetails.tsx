import React, { useState } from 'react';
import { Workspace } from '../types/workspace';
import { tabService } from '../services/tabService';
import { workspaceService } from '../services/workspaceService';
import { TabItem } from './TabItem';
import { IconPicker } from './IconPicker';
import { ColorPicker } from './ColorPicker';
import { getIconComponent } from '../utils/iconMap';
import { ArrowLeft, MoreVertical, RefreshCw, Edit2, Trash2 } from 'lucide-react';

interface WorkspaceDetailsProps {
  workspace: Workspace;
  onBack: () => void;
  onUpdate: (workspace: Workspace) => void;
  onDeleteRequest: (workspace: Workspace) => void;
}

export function WorkspaceDetails({ workspace, onBack, onUpdate, onDeleteRequest }: WorkspaceDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(workspace.name);
  const [newIcon, setNewIcon] = useState(workspace.icon);
  const [newColor, setNewColor] = useState(workspace.color);
  
  const [showMenu, setShowMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);

  const handleEditSubmit = async () => {
    const trimmed = newName.trim();
    if (trimmed && (trimmed !== workspace.name || newIcon !== workspace.icon || newColor !== workspace.color)) {
      await workspaceService.updateWorkspaceMetadata(workspace.id, trimmed, newIcon, newColor);
      onUpdate({ ...workspace, name: trimmed, icon: newIcon, color: newColor, updatedAt: Date.now() });
    } else {
      setNewName(workspace.name);
      setNewIcon(workspace.icon);
      setNewColor(workspace.color);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setNewName(workspace.name);
      setNewIcon(workspace.icon);
      setNewColor(workspace.color);
      setIsEditing(false);
    }
  };

  const handleUpdateTabs = async () => {
    setShowMenu(false);
    setIsUpdating(true);
    try {
      const tabsToSave = await tabService.getCurrentWindowTabs();
      await workspaceService.updateWorkspaceTabs(workspace.id, tabsToSave);
      onUpdate({ ...workspace, tabs: tabsToSave, updatedAt: Date.now() });
    } catch (error) {
      console.error('Failed to update tabs:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const { skipped } = await workspaceService.restoreWorkspace(workspace.id);
      if (skipped > 0) {
        setRestoreFeedback(`Restored (skipped ${skipped} duplicate${skipped === 1 ? '' : 's'})`);
      } else {
        setRestoreFeedback("Restored!");
      }
      setTimeout(() => setRestoreFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to restore workspace:', error);
      setRestoreFeedback("Failed to restore");
      setTimeout(() => setRestoreFeedback(null), 3000);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleOpenTab = async (url: string) => {
    try {
      await tabService.openMultipleTabs([url]);
    } catch (error) {
      console.error('Failed to open tab:', error);
    }
  };

  const handleRemoveTab = async (tabId: string) => {
    try {
      await workspaceService.removeTabFromWorkspace(workspace.id, tabId);
      const updatedTabs = workspace.tabs.filter(t => t.id !== tabId);
      onUpdate({ ...workspace, tabs: updatedTabs, updatedAt: Date.now() });
    } catch (error) {
      console.error('Failed to remove tab:', error);
    }
  };

  return (
    <div className="flex flex-col h-full relative font-sans animate-in slide-in-from-right-4 duration-200">
      
      {restoreFeedback && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-gray-800 text-white text-xs font-medium px-3 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          {restoreFeedback}
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-10 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors -ml-2"
          >
            <ArrowLeft size={20} />
          </button>
          
          {!isEditing && (
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <MoreVertical size={20} />
              </button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={handleUpdateTabs}
                      disabled={isUpdating}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                      {isUpdating ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span> : <RefreshCw size={16} />}
                      Update with open tabs
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsEditing(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium flex items-center gap-2 transition-colors"
                    >
                      <Edit2 size={16} />
                      Edit Workspace
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDeleteRequest(workspace);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete Workspace
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full font-bold text-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 transition-colors"
              placeholder="Workspace name"
              autoFocus
            />
            
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Icon</label>
              <IconPicker selectedIcon={newIcon} onSelect={setNewIcon} />
            </div>
            
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Color</label>
              <ColorPicker selectedColor={newColor} onSelect={setNewColor} />
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button 
                onClick={() => {
                  setNewName(workspace.name);
                  setNewIcon(workspace.icon);
                  setNewColor(workspace.color);
                  setIsEditing(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditSubmit}
                disabled={!newName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 rounded-lg transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 group">
            <div 
              className="flex items-center justify-center w-14 h-14 rounded-2xl text-2xl flex-shrink-0 cursor-pointer hover:scale-105 transition-transform shadow-sm"
              style={{ backgroundColor: `${workspace.color}15`, color: workspace.color }}
              onClick={() => setIsEditing(true)}
              title="Click to edit workspace"
            >
              {getIconComponent(workspace.icon, 28)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => setIsEditing(true)}>
                {workspace.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                {workspace.tabs.length} {workspace.tabs.length === 1 ? 'tab' : 'tabs'}
              </p>
            </div>
            
            <button
              onClick={handleRestore}
              disabled={isRestoring || workspace.tabs.length === 0}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm hover:shadow-md disabled:shadow-none hover:-translate-y-0.5 disabled:translate-y-0 flex items-center gap-2"
            >
              {isRestoring && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              Restore
            </button>
          </div>
        )}
      </div>

      {/* Tabs List */}
      <div className="flex-1 overflow-y-auto p-2">
        {workspace.tabs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4 animate-in fade-in duration-300">
            <div className="text-4xl mb-4 text-gray-300 dark:text-gray-700 opacity-50">📭</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">This workspace is empty.</p>
            <button
              onClick={handleUpdateTabs}
              disabled={isUpdating}
              className="text-blue-600 dark:text-blue-400 font-medium text-sm hover:underline disabled:opacity-50"
            >
              Save Current Tabs Here
            </button>
          </div>
        ) : (
          <ul className="space-y-1 pb-4">
            {workspace.tabs.map((tab) => (
              <TabItem 
                key={tab.id} 
                tab={tab} 
                onOpen={handleOpenTab} 
                onRemove={handleRemoveTab} 
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

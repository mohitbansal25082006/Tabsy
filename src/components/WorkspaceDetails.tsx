import React, { useState, useEffect } from 'react';
import { Workspace, Tab } from '../types/workspace';
import { tabService } from '../services/tabService';
import { workspaceService } from '../services/workspaceService';
import { syncService } from '../services/syncService';
import { TabItem } from './TabItem';
import { IconPicker } from './IconPicker';
import { ColorPicker } from './ColorPicker';
import { getIconComponent } from '../utils/iconMap';
import { ArrowLeft, MoreVertical, RefreshCw, Edit2, Trash2, Copy, Power, CheckSquare, X, ExternalLink } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface WorkspaceDetailsProps {
  workspace: Workspace;
  onBack: () => void;
  onUpdate: (workspace: Workspace) => void;
  onDuplicateRequest: (workspace: Workspace) => void;
  onDeleteRequest: (workspace: Workspace) => void;
}

export function WorkspaceDetails({ workspace, onBack, onUpdate, onDuplicateRequest, onDeleteRequest }: WorkspaceDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(workspace.name);
  const [newIcon, setNewIcon] = useState(workspace.icon);
  const [newColor, setNewColor] = useState(workspace.color);
  
  const [showMenu, setShowMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    chrome.windows.getCurrent().then(win => {
      if (win.id !== undefined) {
        setCurrentWindowId(win.id);
        syncService.getWorkspaceForWindow(win.id).then(syncedWsId => {
          setIsSyncing(syncedWsId === workspace.id);
        });
      }
    });
  }, [workspace.id]);

  const toggleSync = async () => {
    if (!currentWindowId) return;
    if (isSyncing) {
      await syncService.stopSyncForWindow(currentWindowId);
      setIsSyncing(false);
      chrome.action.setBadgeText({ text: '' });
    } else {
      await syncService.setSync(currentWindowId, workspace.id);
      setIsSyncing(true);
      const tabsToSave = await tabService.getCurrentWindowTabs();
      await workspaceService.updateWorkspaceTabs(workspace.id, tabsToSave);
      onUpdate({ ...workspace, tabs: tabsToSave, updatedAt: Date.now() });
      chrome.action.setBadgeText({ text: String(tabsToSave.length) });
      chrome.action.setBadgeBackgroundColor({ color: workspace.color });
    }
  };

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
        setRestoreFeedback(`Restored (skipped ${skipped})`);
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

  const handleOpenTab = async (url: string, pinned?: boolean) => {
    try {
      await tabService.openMultipleTabs([{ url, pinned }]);
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = workspace.tabs.findIndex(t => t.id === active.id);
      const newIndex = workspace.tabs.findIndex(t => t.id === over.id);
      const newTabs = arrayMove(workspace.tabs, oldIndex, newIndex);
      await workspaceService.updateWorkspaceTabs(workspace.id, newTabs);
      onUpdate({ ...workspace, tabs: newTabs, updatedAt: Date.now() });
    }
  };

  const toggleTabSelection = (tabId: string) => {
    const newSelected = new Set(selectedTabs);
    if (newSelected.has(tabId)) {
      newSelected.delete(tabId);
    } else {
      newSelected.add(tabId);
    }
    setSelectedTabs(newSelected);
  };

  const handleDeleteSelected = async () => {
    const newTabs = workspace.tabs.filter(t => !selectedTabs.has(t.id));
    await workspaceService.updateWorkspaceTabs(workspace.id, newTabs);
    onUpdate({ ...workspace, tabs: newTabs, updatedAt: Date.now() });
    setSelectionMode(false);
    setSelectedTabs(new Set());
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 absolute inset-0 z-10 animate-in slide-in-from-right-4 duration-300 shadow-xl overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm relative z-10 flex-shrink-0">
        <button 
          onClick={() => {
            if (isEditing) {
              setNewName(workspace.name);
              setNewIcon(workspace.icon);
              setNewColor(workspace.color);
              setIsEditing(false);
            } else {
              onBack();
            }
          }}
          className="w-8 h-8 flex flex-shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors -ml-1"
          aria-label="Back to workspaces"
        >
          <ArrowLeft size={18} />
        </button>
        
        <div className="flex-1 min-w-0 pr-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate flex items-center gap-2 leading-tight">
            <span className="flex-shrink-0" style={{ color: workspace.color }}>{getIconComponent(workspace.icon, 18)}</span>
            <span className="truncate">{workspace.name}</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 truncate flex items-center gap-1">
            {workspace.tabs.length} {workspace.tabs.length === 1 ? 'tab' : 'tabs'}
            {restoreFeedback && (
              <span className="text-green-600 dark:text-green-400 animate-in fade-in zoom-in slide-in-from-left-2 truncate">
                • {restoreFeedback}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={toggleSync}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm border ${
              isSyncing 
                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                : 'bg-white text-gray-400 border-gray-200 hover:text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 dark:hover:bg-gray-700'
            }`}
            title="Sync current window"
          >
            <Power size={16} />
          </button>
          
          <button
            onClick={handleRestore}
            disabled={isRestoring || workspace.tabs.length === 0}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-200 dark:disabled:bg-gray-700/50 disabled:text-gray-400 dark:disabled:text-gray-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center min-w-[70px]"
          >
            {isRestoring ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Restore'}
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors ml-0.5"
              aria-label="Workspace options"
            >
              <MoreVertical size={18} />
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-30 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={handleUpdateTabs}
                    disabled={isUpdating}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
                  >
                    <RefreshCw size={14} className={isUpdating ? "animate-spin" : ""} />
                    Update with open tabs
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setSelectionMode(!selectionMode);
                      setSelectedTabs(new Set());
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium flex items-center gap-2 transition-colors"
                  >
                    <CheckSquare size={14} />
                    {selectionMode ? 'Cancel Selection' : 'Select Tabs'}
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setIsEditing(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium flex items-center gap-2 transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit Workspace
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDuplicateRequest(workspace);
                      onBack();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium flex items-center gap-2 transition-colors"
                  >
                    <Copy size={14} />
                    Duplicate Workspace
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDeleteRequest(workspace);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete Workspace
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {isEditing ? (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 flex-1 overflow-y-auto">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full font-bold text-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm mb-4"
            autoFocus
          />
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Icon</label>
              <IconPicker selectedIcon={newIcon} onSelect={setNewIcon} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Color</label>
              <ColorPicker selectedColor={newColor} onSelect={setNewColor} />
            </div>
          </div>
          <div className="flex gap-2">
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
              Save Changes
            </button>
          </div>
        </div>
      ) : null}

      {!isEditing && (
        <>
          {/* Bulk Actions Bar */}
          {selectionMode && (
            <div className="px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex justify-between items-center shadow-sm flex-shrink-0">
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                {selectedTabs.size} selected
              </span>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => {
                    if (selectedTabs.size === workspace.tabs.length) {
                      setSelectedTabs(new Set());
                    } else {
                      setSelectedTabs(new Set(workspace.tabs.map(t => t.id)));
                    }
                  }}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedTabs.size === 0}
                  className="px-2.5 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60 rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
                <button
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedTabs(new Set());
                  }}
                  className="px-1.5 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Tabs List */}
          <div className="flex-1 overflow-y-auto p-2">
            {workspace.tabs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4 animate-in fade-in duration-300">
                <div className="text-4xl mb-4 text-gray-300 dark:text-gray-700 opacity-50">dY"</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">This workspace is empty.</p>
                <button
                  onClick={handleUpdateTabs}
                  disabled={isUpdating}
                  className="text-blue-600 dark:text-blue-400 font-medium text-sm hover:underline disabled:opacity-50"
                >
                  Update with current tabs
                </button>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={workspace.tabs} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-1 pb-4">
                    {workspace.tabs.map((tab) => (
                      <TabItem 
                        key={tab.id} 
                        tab={tab} 
                        onOpen={handleOpenTab} 
                        onRemove={handleRemoveTab} 
                        selectionMode={selectionMode}
                        isSelected={selectedTabs.has(tab.id)}
                        onToggleSelect={toggleTabSelection}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </>
      )}
    </div>
  );
}

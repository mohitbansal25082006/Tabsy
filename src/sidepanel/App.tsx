import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import { Workspace } from '../types/workspace';
import { workspaceService } from '../services/workspaceService';
import { WorkspaceList } from '../components/WorkspaceList';
import { SearchResults } from '../components/SearchResults';
import { tabService } from '../services/tabService';
import { WorkspaceDetails } from '../components/WorkspaceDetails';
import { CreateWorkspace } from '../components/CreateWorkspace';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchBar } from '../components/SearchBar';
import { SettingsView } from '../components/Settings';
import { filterWorkspaces } from '../utils/helpers';
import { SettingsProvider, useSettings } from '../hooks/useSettings';
import { WorkspaceEditModal } from '../components/WorkspaceEditModal';
import { Settings as SettingsIcon } from 'lucide-react';

type ViewState = 'list' | 'details' | 'create' | 'settings';

function AppContent() {
  const { settings } = useSettings();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [view, setView] = useState<ViewState>('list');
  const [previousView, setPreviousView] = useState<ViewState | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [seedTab, setSeedTab] = useState<any>(undefined);
  
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(null);
  const [undoToast, setUndoToast] = useState<{ id: string, name: string } | null>(null);

  const loadWorkspaces = async () => {
    setIsLoading(true);
    try {
      const data = await workspaceService.getAllWorkspaces();
      data.sort((a, b) => b.updatedAt - a.updatedAt);
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();

    const checkPendingTriggers = async () => {
      const data = await chrome.storage.local.get(['_tabsy_trigger_create', '_tabsy_seed_tab']);
      if (data._tabsy_trigger_create) {
        setSeedTab(data._tabsy_seed_tab);
        setView('create');
        await chrome.storage.local.remove(['_tabsy_trigger_create', '_tabsy_seed_tab']);
      }
    };
    checkPendingTriggers();

    const handleMessage = (message: any) => {
      if (message.type === 'TABSY_TRIGGER_CREATE_WORKSPACE') {
        if (message.seedTab !== undefined) {
          setSeedTab(message.seedTab);
        } else {
          setSeedTab(undefined);
        }
        setView('create');
      }
    };

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes['tabsy_workspaces']) {
        loadWorkspaces();
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    chrome.storage.onChanged.addListener(handleStorageChange);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const focusable = Array.from(document.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.hasAttribute('disabled') && el.offsetWidth > 0 && el.offsetHeight > 0);
        
        if (focusable.length === 0) return;
        
        const index = focusable.indexOf(document.activeElement as HTMLElement);
        let nextIndex = 0;
        if (e.key === 'ArrowDown') {
          nextIndex = index === -1 ? 0 : (index + 1) % focusable.length;
        } else {
          nextIndex = index === -1 ? focusable.length - 1 : (index - 1 + focusable.length) % focusable.length;
        }
        
        e.preventDefault();
        focusable[nextIndex].focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      chrome.storage.onChanged.removeListener(handleStorageChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleWorkspaceSelect = (id: string) => {
    setActiveWorkspaceId(id);
    setView('details');
  };

  const handleCreateNew = () => {
    setSeedTab(undefined);
    setView('create');
  };

  const handleWorkspaceCreated = (workspace: Workspace) => {
    setWorkspaces([workspace, ...workspaces]);
    setActiveWorkspaceId(workspace.id);
    setView('details');
  };

  const handleWorkspaceUpdate = (updatedWorkspace: Workspace) => {
    setWorkspaces(workspaces.map(w => w.id === updatedWorkspace.id ? updatedWorkspace : w));
  };

  const handleWorkspaceDelete = async (id: string) => {
    try {
      const wsToDelete = workspaces.find(w => w.id === id);
      await workspaceService.deleteWorkspace(id);
      setWorkspaces(workspaces.filter(w => w.id !== id));
      setWorkspaceToDelete(null);
      if (activeWorkspaceId === id) {
        setView('list');
        setActiveWorkspaceId(null);
      }
      if (wsToDelete) {
        setUndoToast({ id, name: wsToDelete.name });
        setTimeout(() => setUndoToast(null), 8000); // 8 seconds to undo
      }
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  };

  const handleUndoDelete = async () => {
    if (!undoToast) return;
    try {
      await workspaceService.restoreFromTrash(undoToast.id);
      setUndoToast(null);
      loadWorkspaces();
    } catch (error) {
      console.error('Failed to undo:', error);
    }
  };

  const handleWorkspaceDuplicate = async (workspace: Workspace) => {
    try {
      const newWorkspace = await workspaceService.duplicateWorkspace(workspace.id);
      if (newWorkspace) {
        setWorkspaces([newWorkspace, ...workspaces]);
      }
    } catch (error) {
      console.error('Failed to duplicate workspace:', error);
    }
  };

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const filteredWorkspaces = React.useMemo(() => filterWorkspaces(workspaces, searchQuery), [workspaces, searchQuery]);

  return (
    <div className="w-full h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col overflow-hidden transition-colors font-sans">
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            setView('list');
            setActiveWorkspaceId(null);
          }}
        >
          <img src="/icons/icon32.png" alt="Tabsy Logo" className="w-8 h-8 shadow-sm rounded-lg" />
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Tabsy</h1>
        </div>
        
        {view !== 'settings' && (
          <button
            onClick={() => {
              setPreviousView(view);
              setView('settings');
            }}
            className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
            aria-label="Settings"
          >
            <SettingsIcon size={20} />
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {view === 'list' && (
              <>
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
                                {searchQuery.trim() ? (
                  <SearchResults 
                    workspaces={workspaces}
                    searchQuery={searchQuery}
                    onWorkspaceSelect={handleWorkspaceSelect}
                    onEditRequest={setWorkspaceToEdit}
                    onDuplicateRequest={handleWorkspaceDuplicate}
                    onDeleteRequest={(ws) => {
                      if (settings.confirmBeforeDeleting) {
                        setWorkspaceToDelete(ws);
                      } else {
                        handleWorkspaceDelete(ws.id);
                      }
                    }}
                    onOpenTab={(url, pinned) => tabService.openTab(url, pinned)}
                  />
                ) : (
                  <WorkspaceList 
                    workspaces={workspaces} 
                    searchQuery={searchQuery}
                    onWorkspaceSelect={handleWorkspaceSelect}
                    onCreateNew={handleCreateNew}
                    onEditRequest={setWorkspaceToEdit}
                    onDuplicateRequest={handleWorkspaceDuplicate}
                    onDeleteRequest={(ws) => {
                      if (settings.confirmBeforeDeleting) {
                        setWorkspaceToDelete(ws);
                      } else {
                        handleWorkspaceDelete(ws.id);
                      }
                    }}
                  />
                )}
              </>
            )}

            {view === 'details' && activeWorkspace && (
              <WorkspaceDetails 
                workspace={activeWorkspace} 
                onBack={() => setView('list')} 
                onUpdate={handleWorkspaceUpdate}
                onDuplicateRequest={handleWorkspaceDuplicate}
                onDeleteRequest={(ws) => {
                  if (settings.confirmBeforeDeleting) {
                    setWorkspaceToDelete(ws);
                  } else {
                    handleWorkspaceDelete(ws.id);
                  }
                }}
              />
            )}

            {view === 'create' && (
              <CreateWorkspace 
                seedTab={seedTab}
                onCancel={() => setView('list')} 
                onCreated={handleWorkspaceCreated} 
              />
            )}

            {view === 'settings' && (
              <SettingsView 
                onBack={() => {
                  setView(previousView || 'list');
                  setPreviousView(null);
                }}
                onImportSuccess={loadWorkspaces}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {workspaceToDelete && (
        <ConfirmDialog
          title="Delete Workspace"
          message={`Are you sure you want to delete "${workspaceToDelete.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => handleWorkspaceDelete(workspaceToDelete.id)}
          onCancel={() => setWorkspaceToDelete(null)}
          isDestructive={true}
        />
      )}

      {workspaceToEdit && (
        <WorkspaceEditModal
          workspace={workspaceToEdit}
          onClose={() => setWorkspaceToEdit(null)}
          onUpdate={handleWorkspaceUpdate}
        />
      )}

      {undoToast && (
        <div className="absolute bottom-4 left-4 right-4 bg-gray-900 dark:bg-gray-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between z-50 animate-in slide-in-from-bottom-6 fade-in duration-300 border border-gray-700">
          <span className="text-sm font-medium truncate pr-4 text-gray-200">
            Deleted <span className="font-bold text-white">"{undoToast.name}"</span>
          </span>
          <button 
            onClick={handleUndoDelete}
            className="text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}


import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import { Workspace } from '../types/workspace';
import { workspaceService } from '../services/workspaceService';
import { WorkspaceList } from '../components/WorkspaceList';
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
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [seedTab, setSeedTab] = useState<any>(undefined);
  
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(null);

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

    const handleMessage = (message: any) => {
      if (message.type === 'TABSY_TRIGGER_CREATE_WORKSPACE') {
        if (message.seedTab) {
          setSeedTab(message.seedTab);
        } else {
          setSeedTab(undefined);
        }
        setView('create');
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
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
      await workspaceService.deleteWorkspace(id);
      setWorkspaces(workspaces.filter(w => w.id !== id));
      setWorkspaceToDelete(null);
      if (activeWorkspaceId === id) {
        setView('list');
        setActiveWorkspaceId(null);
      }
    } catch (error) {
      console.error('Failed to delete workspace:', error);
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
            onClick={() => setView('settings')}
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
                <WorkspaceList 
                  workspaces={filteredWorkspaces} 
                  searchQuery={searchQuery}
                  onWorkspaceSelect={handleWorkspaceSelect}
                  onCreateNew={handleCreateNew}
                  onEditRequest={setWorkspaceToEdit}
                  onDeleteRequest={(ws) => {
                    if (settings.confirmBeforeDeleting) {
                      setWorkspaceToDelete(ws);
                    } else {
                      handleWorkspaceDelete(ws.id);
                    }
                  }}
                />
              </>
            )}

            {view === 'details' && activeWorkspace && (
              <WorkspaceDetails 
                workspace={activeWorkspace} 
                onBack={() => setView('list')} 
                onUpdate={handleWorkspaceUpdate}
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
                onBack={() => setView('list')} 
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

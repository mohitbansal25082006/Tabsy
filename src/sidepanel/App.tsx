import React, { useState, useEffect, useMemo } from 'react';
import '../styles/globals.css';
import { Workspace } from '../types/workspace';
import { workspaceService } from '../services/workspaceService';
import { WorkspaceList } from '../components/WorkspaceList';
import { WorkspaceDetails } from '../components/WorkspaceDetails';
import { CreateWorkspace } from '../components/CreateWorkspace';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchBar } from '../components/SearchBar';
import { filterWorkspaces } from '../utils/helpers';
import { SettingsProvider, useSettings } from '../hooks/useSettings';
import { SettingsView } from '../components/Settings';

type ViewState = 'list' | 'details' | 'create' | 'settings';

function AppContent() {
  const { settings } = useSettings();
  const [view, setView] = useState<ViewState>('list');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [seedTab, setSeedTab] = useState<any>(undefined);
  
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);

  const loadWorkspaces = async () => {
    setIsLoading(true);
    try {
      const data = await workspaceService.getAllWorkspaces();
      // Sort by updatedAt descending (newest first)
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
  }, []);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'TABSY_TRIGGER_CREATE_WORKSPACE') {
        setSeedTab(message.seedTab);
        setView('create');
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const filteredWorkspaces = useMemo(() => {
    return filterWorkspaces(workspaces, searchQuery);
  }, [workspaces, searchQuery]);

  const handleCreateNew = () => {
    setSeedTab(undefined);
    setView('create');
  };

  const handleWorkspaceCreated = (workspace: Workspace) => {
    setWorkspaces([workspace, ...workspaces.filter(w => w.id !== workspace.id)]);
    setActiveWorkspaceId(workspace.id);
    setView('details');
  };

  const handleWorkspaceSelect = (id: string) => {
    setActiveWorkspaceId(id);
    setView('details');
  };

  const handleWorkspaceUpdate = (updatedWorkspace: Workspace) => {
    setWorkspaces(workspaces.map(w => 
      w.id === updatedWorkspace.id ? updatedWorkspace : w
    ).sort((a, b) => b.updatedAt - a.updatedAt));
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

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors">
      {/* Global Header */}
      {view === 'list' && (
        <header className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10 transition-colors">
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Tabsy</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">Your tabs. Your worlds. Zero chaos.</span>
          </div>
          <button
            onClick={() => setView('settings')}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            title="Settings"
          >
            &#9881;
          </button>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {isLoading && workspaces.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
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
                />
              </>
            )}
            
            {view === 'create' && (
              <CreateWorkspace 
                seedTab={seedTab}
                onCancel={() => setView('list')}
                onCreated={handleWorkspaceCreated}
              />
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

            {view === 'settings' && (
              <SettingsView 
                onBack={() => setView('list')} 
                onImportSuccess={loadWorkspaces}
              />
            )}
          </>
        )}
      </main>

      {/* Dialogs */}
      {workspaceToDelete && (
        <ConfirmDialog
          title="Delete Workspace"
          message={`Are you sure you want to delete "${workspaceToDelete.name}"? This will not close any currently open tabs, but the saved workspace will be gone forever.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => handleWorkspaceDelete(workspaceToDelete.id)}
          onCancel={() => setWorkspaceToDelete(null)}
          isDestructive={true}
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

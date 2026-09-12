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
import { Settings as SettingsIcon, Cloud, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Insights } from '../components/Insights';
import { Onboarding } from '../components/Onboarding';

type ViewState = 'list' | 'details' | 'create' | 'settings' | 'insights';

function AppContent() {
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings();
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

  const [user, setUser] = useState<any>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  type GlobalOverlayState = 'none' | 'import_loading' | 'import_success' | 'import_error' | 'sign_in_loading';
  const [globalOverlay, setGlobalOverlay] = useState<GlobalOverlayState>('none');
  const [overlayMessage, setOverlayMessage] = useState('');

  const handleImportShare = async (shareId: string) => {
    setGlobalOverlay('import_loading');
    setOverlayMessage('Fetching data securely...');
    try {
      const { cloudSyncService } = await import('../services/cloudSyncService');
      const ws = await cloudSyncService.importSharedWorkspace(shareId);
      if (ws) {
        const importedWs = { ...ws, id: crypto.randomUUID(), name: `${ws.name} (Shared)` };
        await workspaceService.saveWorkspace(importedWs);
        
        setTimeout(() => {
          setGlobalOverlay('import_success');
          setView('list'); 
          setActiveWorkspaceId(null);
          loadWorkspaces();
          setTimeout(() => setGlobalOverlay('none'), 2000);
        }, 800);
      } else {
        setGlobalOverlay('import_error');
        setOverlayMessage('Workspace not found or link has expired.');
        setTimeout(() => setGlobalOverlay('none'), 3000);
      }
    } catch (e: any) {
      setGlobalOverlay('import_error');
      setOverlayMessage(e.message || "Failed to import workspace.");
      setTimeout(() => setGlobalOverlay('none'), 3000);
    }
  };

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
    // Listen for auth state
    import('../config/firebase').then(({ auth, hasFirebaseConfig }) => {
      if (hasFirebaseConfig && auth) {
        import('firebase/auth').then(({ onAuthStateChanged }) => {
          onAuthStateChanged(auth, (currentUser: any) => {
            setUser(currentUser);
          });
        });
      }
    });

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
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Real-time Cloud Sync Effect
  useEffect(() => {
    let unsubscribe = () => {};
    if (user) {
      setIsCloudSyncing(true);
      import('../services/cloudSyncService').then(({ cloudSyncService }) => {
        
        // Push any strictly local ones to cloud first
        workspaceService.getAllWorkspaces().then(localWs => {
          cloudSyncService.performInitialSync(localWs);
        });

        unsubscribe = cloudSyncService.startRealtimeSync(async (snapshot) => {
          setIsCloudSyncing(true);
          let hasChanges = false;
          
          for (const change of snapshot.docChanges()) {
            if (change.type === 'added' || change.type === 'modified') {
              await workspaceService.saveWorkspace(change.doc.data() as Workspace);
              hasChanges = true;
            }
            if (change.type === 'removed') {
              await workspaceService.deleteWorkspace(change.doc.id);
              hasChanges = true;
            }
          }
          
          if (hasChanges) {
            loadWorkspaces();
          }
          
          // Reset spinning animation
          setTimeout(() => setIsCloudSyncing(false), 1000);
        });
      });
    } else {
      setIsCloudSyncing(false);
    }
    return () => unsubscribe();
  }, [user]);

  const handleWorkspaceSelect = (id: string) => {
    setActiveWorkspaceId(id);
    setView('details');
  };

  const handleCreateNew = () => {
    setSeedTab(undefined);
    setView('create');
  };

  const handleWorkspaceCreated = (workspace: Workspace) => {
    if (user) {
      import('../services/cloudSyncService').then(({ cloudSyncService }) => {
        cloudSyncService.syncWorkspace(workspace);
      });
    }
    setWorkspaces([workspace, ...workspaces]);
    setActiveWorkspaceId(workspace.id);
    setView('details');
  };

  const handleWorkspaceUpdate = async (updatedWorkspace: Workspace) => {
    await workspaceService.saveWorkspace(updatedWorkspace);
    if (user) {
      import('../services/cloudSyncService').then(({ cloudSyncService }) => {
        cloudSyncService.syncWorkspace(updatedWorkspace);
      });
    }
    setWorkspaces(workspaces.map(w => w.id === updatedWorkspace.id ? updatedWorkspace : w));
  };

  const handleWorkspaceDelete = async (id: string) => {
    try {
      const wsToDelete = workspaces.find(w => w.id === id);
      await workspaceService.deleteWorkspace(id);
      if (user) {
        import('../services/cloudSyncService').then(({ cloudSyncService }) => {
          cloudSyncService.deleteWorkspace(id);
        });
      }
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
      const restoredWs = await workspaceService.restoreFromTrash(undoToast.id);
      if (restoredWs && user) {
        import('../services/cloudSyncService').then(({ cloudSyncService }) => {
          cloudSyncService.syncWorkspace(restoredWs);
        });
      }
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
        if (user) {
          import('../services/cloudSyncService').then(({ cloudSyncService }) => {
            cloudSyncService.syncWorkspace(newWorkspace);
          });
        }
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
        <div className="flex items-center gap-1">
          {view !== 'settings' && (
            <button
              onClick={() => {
                if (user) {
                  // Maybe force a sync or just visual feedback?
                } else {
                  setPreviousView(view);
                  setView('settings');
                }
              }}
              className={`p-2 rounded-full transition-all flex items-center justify-center ${
                user 
                  ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30' 
                  : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={user ? (isCloudSyncing ? "Syncing..." : "Cloud Sync Active") : "Cloud Sync (Disconnected)"}
            >
              <Cloud size={18} className={isCloudSyncing ? "animate-pulse" : ""} />
            </button>
          )}
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
        </div>
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
                onViewInsights={() => {
                  setPreviousView(view);
                  setView('insights');
                }}
                onImportShare={handleImportShare}
              />
            )}

            {view === 'insights' && (
              <Insights
                onBack={() => {
                  setView('settings');
                }}
                workspaces={workspaces}
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
        <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-2xl flex items-center justify-between z-50 animate-in slide-in-from-bottom-6 fade-in duration-300 border border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium truncate pr-4 text-gray-600 dark:text-gray-200">
            Deleted <span className="font-bold text-gray-900 dark:text-white">"{undoToast.name}"</span>
          </span>
          <button 
            onClick={handleUndoDelete}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors border border-blue-100 dark:border-transparent"
          >
            Undo
          </button>
        </div>
      )}

      {!settingsLoading && !settings.hasCompletedOnboarding && (
        <Onboarding 
          onComplete={() => updateSettings({ hasCompletedOnboarding: true })} 
        />
      )}

      {/* Global Overlays */}
      {globalOverlay === 'import_loading' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="flex flex-col items-center gap-4 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <Loader2 size={40} className="text-blue-500 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Importing Workspace</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{overlayMessage}</p>
          </div>
        </div>
      )}

      {globalOverlay === 'import_success' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="flex flex-col items-center text-center max-w-sm w-full gap-4 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 dark:text-green-400 rounded-full flex items-center justify-center mb-2">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Import Successful!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">The shared workspace has been added.</p>
          </div>
        </div>
      )}

      {globalOverlay === 'import_error' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="flex flex-col items-center text-center max-w-sm w-full gap-4 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-2">
              <XCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Import Failed</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{overlayMessage}</p>
          </div>
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


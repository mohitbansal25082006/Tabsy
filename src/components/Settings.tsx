import React, { useRef, useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { Theme, Workspace } from '../types/workspace';
import { workspaceService } from '../services/workspaceService';
import { ConfirmDialog } from './ConfirmDialog';
import { ArrowLeft, Download, Upload, CheckSquare, Square, X, Layers } from 'lucide-react';
import { DuplicateManager } from './DuplicateManager';
import { getIconComponent } from '../utils/iconMap';

interface SettingsProps {
  onBack: () => void;
  onImportSuccess?: () => void; // Tell App to reload workspaces
}

export function SettingsView({ onBack, onImportSuccess }: SettingsProps) {
  const { settings, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeView, setActiveView] = useState<'main' | 'duplicates'>('main');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [selectedExportIds, setSelectedExportIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    workspaceService.getAllWorkspaces().then(ws => {
      setAllWorkspaces(ws);
      setSelectedExportIds(new Set(ws.map(w => w.id)));
    });
  }, []);

  const openExportModal = () => {
    setShowExportModal(true);
  };

  const handleExport = async () => {
    if (selectedExportIds.size === 0) return;
    setIsExporting(true);
    try {
      const data = await workspaceService.exportWorkspaces(Array.from(selectedExportIds));
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedExportIds.size === allWorkspaces.length 
        ? `tabsy-full-backup.json` 
        : `tabsy-partial-backup.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setImportData(json); // Stage for confirmation
      } catch (err) {
        setImportError("Invalid JSON file. Please select a valid Tabsy backup.");
      }
    };
    reader.onerror = () => {
      setImportError("Failed to read file.");
    };
    reader.readAsText(file);
    
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (!importData) return;
    
    setIsImporting(true);
    try {
      await workspaceService.importWorkspaces(importData);
      setImportData(null);
      setToastMessage("Import successful!");
      setTimeout(() => setToastMessage(null), 3000);
      if (onImportSuccess) onImportSuccess();
    } catch (err: any) {
      setImportError(err.message || "Failed to import workspaces. The file might be corrupted or in an old format.");
      setImportData(null);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative animate-in slide-in-from-right-4 duration-200 bg-gray-50/50 dark:bg-gray-900/50">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 dark:bg-white/90 backdrop-blur-sm text-white dark:text-gray-900 text-xs font-semibold px-4 py-2 rounded-full shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 border border-white/10 dark:border-black/10">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3 sticky top-0 z-10 flex items-center gap-3 transition-colors shadow-sm">
        <button 
          onClick={activeView === 'main' ? onBack : () => setActiveView('main')}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors -ml-2"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent tracking-tight">
          {activeView === 'main' ? 'Settings' : 'Duplicate Tabs Manager'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {activeView === 'duplicates' ? (
          <div className="animate-in fade-in zoom-in-95 duration-200 h-full flex flex-col pb-4">
            <div className="flex-1 min-h-[300px]">
              <DuplicateManager />
            </div>
          </div>
        ) : (
          <>
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75 fill-mode-both">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                Appearance
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 overflow-hidden divide-y divide-gray-100/80 dark:divide-gray-700/80 transition-shadow hover:shadow-md">
                {(['system', 'light', 'dark'] as Theme[]).map((theme) => (
                  <label key={theme} className="flex items-center px-4 py-3.5 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700 transition-colors group">
                    <input 
                      type="radio" 
                      name="theme" 
                      value={theme}
                      checked={settings.theme === theme}
                      onChange={() => updateSettings({ theme })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 transition-transform group-hover:scale-110"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200 capitalize">{theme}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100 fill-mode-both">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                Workspace Behavior
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 overflow-hidden divide-y divide-gray-100/80 dark:divide-gray-700/80 transition-shadow hover:shadow-md">
                <label className="flex items-center px-4 py-3.5 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700 transition-colors group">
                  <input 
                    type="checkbox"
                    checked={settings.confirmBeforeDeleting}
                    onChange={(e) => updateSettings({ confirmBeforeDeleting: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 transition-transform group-hover:scale-110"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">Confirm before deleting</span>
                </label>
                <label className="flex items-center px-4 py-3.5 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700 transition-colors group">
                  <input 
                    type="checkbox"
                    checked={settings.checkForDuplicateTabs}
                    onChange={(e) => updateSettings({ checkForDuplicateTabs: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 transition-transform group-hover:scale-110"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">Check for duplicate tabs on restore</span>
                </label>
                <button
                  onClick={() => setActiveView('duplicates')}
                  className="w-full text-left px-4 py-3.5 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors flex items-center justify-between group"
                >
                  <span className="flex items-center gap-2">
                    <span className="p-1 bg-blue-100 dark:bg-blue-900/40 rounded-md group-hover:scale-110 transition-transform">
                      <Layers size={14} />
                    </span>
                    Manage Cross-Workspace Duplicates
                  </span>
                  <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
                </button>
              </div>
            </section>

            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150 fill-mode-both">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                Data Management
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 p-4 space-y-3 transition-shadow hover:shadow-md">
                <button 
                  onClick={openExportModal}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 border border-blue-200/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 group"
                >
                  <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                  Select & Export Workspaces
                </button>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center font-medium">
                  Downloads a secure <span className="font-mono text-gray-500">tabsy-backup.json</span>
                </p>
                
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent my-3"></div>

                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 group"
                >
                  <Upload size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                  {isImporting ? 'Reading...' : 'Import Workspaces'}
                </button>
              </div>
            </section>

            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200 fill-mode-both">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                Advanced
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 overflow-hidden transition-shadow hover:shadow-md">
                <button 
                  onClick={() => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })}
                  className="w-full text-left px-4 py-3.5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50/80 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
                >
                  <span>Manage Chrome shortcuts</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
                </button>
              </div>
            </section>

            <div className="flex items-center justify-between px-2 pt-4 pb-8 animate-in fade-in duration-500 delay-300">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                100% Local Privacy
              </p>
              <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-default">
                <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  Tabsy v1.3.0
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {importError && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex justify-between items-center z-50">
          <span className="text-sm">{importError}</span>
          <button onClick={() => setImportError(null)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
        </div>
      )}

      {toastMessage && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4">
          {toastMessage}
        </div>
      )}

      {importData && (
        <ConfirmDialog
          title="Import Workspaces"
          message={`This will add ${importData.workspaces.length} workspace(s) from the backup file. Existing workspaces won't be affected.`}
          confirmText="Import"
          cancelText="Cancel"
          onConfirm={confirmImport}
          onCancel={() => setImportData(null)}
        />
      )}

      {showExportModal && (
        <>
          <div className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm z-40 animate-in fade-in" onClick={() => setShowExportModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm max-h-[80vh] flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Download size={18} className="text-blue-600 dark:text-blue-400" />
                Select Workspaces
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between">
              <button 
                onClick={() => setSelectedExportIds(new Set(allWorkspaces.map(w => w.id)))}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline px-2 py-1"
              >
                Select All
              </button>
              <button 
                onClick={() => setSelectedExportIds(new Set())}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:underline px-2 py-1"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {allWorkspaces.map(ws => {
                const isSelected = selectedExportIds.has(ws.id);
                return (
                  <label 
                    key={ws.id} 
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors border ${
                      isSelected 
                        ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50' 
                        : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-300 dark:text-gray-600" />}
                    </div>
                    <div className="flex-shrink-0" style={{ color: ws.color }}>
                      {getIconComponent(ws.icon, 16)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {ws.name}
                      </p>
                    </div>
                    <div className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      {ws.tabs.length}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={isSelected}
                      onChange={() => {
                        const newSet = new Set(selectedExportIds);
                        if (newSet.has(ws.id)) newSet.delete(ws.id);
                        else newSet.add(ws.id);
                        setSelectedExportIds(newSet);
                      }}
                    />
                  </label>
                );
              })}
              {allWorkspaces.length === 0 && (
                <p className="text-sm text-gray-500 text-center p-4">No workspaces found.</p>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
              <button 
                onClick={handleExport}
                disabled={selectedExportIds.size === 0 || isExporting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm"
              >
                {isExporting ? 'Exporting...' : `Export ${selectedExportIds.size} ${selectedExportIds.size === 1 ? 'Workspace' : 'Workspaces'}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

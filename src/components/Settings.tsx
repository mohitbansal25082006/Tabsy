import React, { useRef, useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { Theme } from '../types/workspace';
import { workspaceService } from '../services/workspaceService';
import { ConfirmDialog } from './ConfirmDialog';

interface SettingsProps {
  onBack: () => void;
  onImportSuccess?: () => void; // Tell App to reload workspaces
}

export function SettingsView({ onBack, onImportSuccess }: SettingsProps) {
  const { settings, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await workspaceService.exportWorkspaces();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tabsy-backup.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Export successful');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      // Preliminary check before showing dialog
      if (json.version !== 1 || !Array.isArray(json.workspaces)) {
        throw new Error("This file doesn't look like a valid Tabsy backup.");
      }
      
      if (json.workspaces.length === 0) {
        showToast("No workspaces found in that file.");
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setImportData(json);
    } catch (error: any) {
      setImportError(error.message || "Invalid backup file");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (!importData) return;
    setIsImporting(true);
    try {
      const { imported } = await workspaceService.importWorkspaces(importData);
      showToast(`Imported ${imported} workspace(s).`);
      if (onImportSuccess) onImportSuccess();
    } catch (error: any) {
      setImportError(error.message || "Import failed");
    } finally {
      setIsImporting(false);
      setImportData(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors -ml-2"
        >
          &larr;
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        
        <section>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Appearance
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            {(['system', 'light', 'dark'] as Theme[]).map((theme) => (
              <label key={theme} className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <input 
                  type="radio" 
                  name="theme" 
                  value={theme}
                  checked={settings.theme === theme}
                  onChange={() => updateSettings({ theme })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="ml-3 text-gray-700 dark:text-gray-200 capitalize">{theme}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Workspace behavior
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            <label className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
              <input 
                type="checkbox"
                checked={settings.confirmBeforeDeleting}
                onChange={(e) => updateSettings({ confirmBeforeDeleting: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-3 text-gray-700 dark:text-gray-200">Confirm before deleting</span>
            </label>
            <label className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
              <input 
                type="checkbox"
                checked={settings.checkForDuplicateTabs}
                onChange={(e) => updateSettings({ checkForDuplicateTabs: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-3 text-gray-700 dark:text-gray-200">Check for duplicate tabs</span>
            </label>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Import / Export
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex items-center justify-between disabled:opacity-50"
            >
              <span>Export Workspaces</span>
              <span>&darr;</span>
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex items-center justify-between disabled:opacity-50"
            >
              <span>Import Workspaces</span>
              <span>&uarr;</span>
            </button>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImportFile}
            />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Shortcuts
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button 
              onClick={() => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })}
              className="w-full text-left px-4 py-3 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex items-center justify-between"
            >
              <span>Manage Chrome shortcuts</span>
              <span>&rarr;</span>
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Privacy
          </h3>
          <p className="px-1 text-sm text-gray-600 dark:text-gray-400">
            Your data is stored locally.
          </p>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            About
          </h3>
          <p className="px-1 text-sm text-gray-600 dark:text-gray-400">
            Tabsy v1.0.0
          </p>
        </section>

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
    </div>
  );
}

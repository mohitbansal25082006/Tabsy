import React, { useEffect, useState } from 'react';
import { workspaceService } from '../services/workspaceService';
import { Tab, Workspace } from '../types/workspace';
import { Trash2, ExternalLink, Layers, Search, Filter, Info } from 'lucide-react';
import { getIconComponent } from '../utils/iconMap';

export function DuplicateManager() {
  const [duplicates, setDuplicates] = useState<{ url: string; workspaces: Workspace[]; tab: Tab }[]>([]);
  const [loading, setLoading] = useState(true);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [filterWorkspaceId, setFilterWorkspaceId] = useState<string>('all');

  useEffect(() => {
    loadDuplicates();
    workspaceService.getAllWorkspaces().then(setAllWorkspaces);
  }, []);

  const loadDuplicates = async () => {
    setLoading(true);
    const dupesMap = await workspaceService.getDuplicateTabsAcrossWorkspaces();
    const arr = Array.from(dupesMap.entries()).map(([url, data]) => ({
      url,
      workspaces: data.workspaces,
      tab: data.tab
    }));
    setDuplicates(arr);
    setLoading(false);
  };

  const handleRemoveFromWorkspace = async (workspaceId: string, url: string) => {
    const ws = await workspaceService.getWorkspaceById(workspaceId);
    if (ws) {
      const tabToRemove = ws.tabs.find(t => t.url && t.url.includes(url) || url.includes(t.url));
      if (tabToRemove) {
        await workspaceService.removeTabFromWorkspace(workspaceId, tabToRemove.id);
        await loadDuplicates();
      }
    }
  };

  const filteredDuplicates = duplicates.filter(dupe => 
    filterWorkspaceId === 'all' || dupe.workspaces.some(ws => ws.id === filterWorkspaceId)
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-inner overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
      
      {/* Filter Controls */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 p-3 sticky top-0 z-10 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 group relative">
          <Layers size={16} className="drop-shadow-sm" />
          <span className="font-semibold text-xs tracking-wide uppercase hidden sm:inline">Identical Tabs</span>
          <div className="relative">
            <Info size={14} className="text-gray-400 hover:text-blue-500 cursor-help" />
            <div className="absolute left-[-10px] top-full mt-2 w-56 sm:w-64 bg-gray-900 dark:bg-gray-700 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
              This feature scans all your workspaces for identical URLs. Review and safely remove redundant entries here to keep your workspaces clean.
              <div className="absolute -top-1 left-[14px] w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
            </div>
          </div>
          <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-inner ml-1">
            {filteredDuplicates.length}
          </span>
        </div>

        <div className="relative group flex-1 max-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Filter size={12} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <select
            value={filterWorkspaceId}
            onChange={(e) => setFilterWorkspaceId(e.target.value)}
            className="block w-full pl-7 pr-8 py-1.5 text-xs bg-gray-50/50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-gray-700 dark:text-gray-200 appearance-none transition-all hover:bg-white dark:hover:bg-gray-800 shadow-sm cursor-pointer"
          >
            <option value="all">All Workspaces</option>
            {allWorkspaces.map(ws => (
              <option key={ws.id} value={ws.id}>
                {ws.name} ({ws.tabs.length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Duplicate List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-32 text-blue-500 animate-pulse gap-2">
            <Search size={24} />
            <span className="text-sm font-medium">Scanning workspaces...</span>
          </div>
        ) : filteredDuplicates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-center px-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 shadow-inner">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-sm font-medium">Your workspaces are beautifully organized.</p>
            <p className="text-xs mt-1 opacity-75">No duplicates found in this view.</p>
          </div>
        ) : (
          filteredDuplicates.map((dupe, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200/75 dark:border-gray-700/75 hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-500 rounded-l-xl opacity-50"></div>
              
              <div className="flex items-start gap-3 mb-3 ml-2">
                <div className="w-8 h-8 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner flex-shrink-0">
                  {dupe.tab.favicon ? (
                    <img src={dupe.tab.favicon} className="w-4 h-4" alt="favicon" />
                  ) : (
                    <span className="text-xs">🌐</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate pr-6 leading-tight">
                    {dupe.tab.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5 max-w-[90%] font-medium">
                    {dupe.url}
                  </p>
                </div>
                <a href={dupe.url} target="_blank" rel="noreferrer" className="absolute right-4 top-4 text-gray-400 hover:text-blue-500 transition-colors p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <ExternalLink size={14} />
                </a>
              </div>
              
              <div className="ml-2 space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                {dupe.workspaces.map(ws => (
                  <div key={ws.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <span className="flex-shrink-0" style={{ color: ws.color }}>{getIconComponent(ws.icon, 14)}</span> 
                      <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{ws.name}</span>
                      {filterWorkspaceId === ws.id && (
                        <span className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase ml-1 flex-shrink-0">Selected</span>
                      )}
                    </div>
                    <button 
                      onClick={() => handleRemoveFromWorkspace(ws.id, dupe.url)}
                      className="text-red-500 hover:text-red-600 bg-red-50/50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 p-1.5 rounded-md transition-all flex items-center gap-1 ml-2"
                      title={`Remove from ${ws.name}`}
                    >
                      <Trash2 size={12} />
                      <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

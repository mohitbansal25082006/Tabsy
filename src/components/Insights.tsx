import React, { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, HardDrive, Trash2, Info, RefreshCw } from 'lucide-react';
import { Workspace } from '../types/workspace';
import { storageService } from '../services/storageService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface InsightsProps {
  onBack: () => void;
  workspaces: Workspace[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    if (payload[0].name === 'Empty') return null;
    
    const isPie = payload[0].name === 'Workspaces' || payload[0].name === 'Trash Queue';
    const displayLabel = isPie ? payload[0].name : label;
    const displayValue = isPie ? payload[0].value : payload[0].name === 'restores' ? `Restores: ${payload[0].value}` : `Saved: ${payload[0].value}`;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2 shadow-sm rounded-lg text-xs z-50">
        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{displayLabel}</p>
        <p className="text-blue-500 dark:text-blue-400 font-medium">
          {isPie ? `Count: ${displayValue}` : displayValue}
        </p>
      </div>
    );
  }
  return null;
};

export function Insights({ onBack, workspaces }: InsightsProps) {
  const [bytesInUse, setBytesInUse] = useState<number>(0);
  const [trashWorkspaces, setTrashWorkspaces] = useState<import('../types/workspace').DeletedWorkspace[]>([]);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  
  // Storage Quota for chrome.storage.local is roughly 5MB by default, though with unlimitedStorage it's infinite.
  // We'll assume a 5MB soft limit for visualization if unlimitedStorage isn't requested, but let's use 5MB as a scale.
  const QUOTA_BYTES = 5 * 1024 * 1024; // 5MB

  const refreshData = () => {
    chrome.storage.local.getBytesInUse(null, (bytes) => {
      setBytesInUse(bytes);
    });
    
    storageService.getTrash().then(trash => {
      setTrashWorkspaces(trash);
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const totalTabs = workspaces.reduce((acc, ws) => acc + (ws.tabs?.length || 0), 0);
  
  const mostUsedWorkspaces = [...workspaces]
    .sort((a, b) => (b.restoredCount || 0) - (a.restoredCount || 0))
    .slice(0, 5)
    .map(ws => ({
      name: ws.name,
      restores: ws.restoredCount || 0
    }));

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercent = Math.min((bytesInUse / QUOTA_BYTES) * 100, 100);

  // Tab Save timeline (Last 7 days)
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now - (6 - i) * ONE_DAY);
    return {
      date: d.toLocaleDateString(undefined, { weekday: 'short' }),
      timestamp: d.setHours(0,0,0,0)
    };
  });

  const timelineData = last7Days.map(day => {
    let saved = 0;
    workspaces.forEach(ws => {
      (ws.tabs || []).forEach(tab => {
        const t = tab.createdAt || ws.createdAt;
        const d = new Date(t).setHours(0,0,0,0);
        if (d === day.timestamp) saved++;
      });
    });
    return { name: day.date, saved };
  });

  const hasStorageData = workspaces.length > 0 || trashWorkspaces.length > 0;
  const pieData = hasStorageData ? [
    { name: 'Workspaces', value: workspaces.length },
    { name: 'Trash Queue', value: trashWorkspaces.length }
  ] : [{ name: 'Empty', value: 1 }];
  
  const PIE_COLORS = hasStorageData ? ['#3B82F6', '#EF4444'] : ['#E5E7EB'];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors animate-in slide-in-from-right-4 duration-200">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors -ml-2"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-500" />
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Insights & Storage</h2>
        </div>
      </div>

      <div className="p-4 overflow-y-auto custom-scrollbar flex flex-col gap-6">
        
        {/* At a glance */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">{workspaces.length}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mt-1">Workspaces</span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-blue-500 dark:text-blue-400">{totalTabs}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mt-1">Total Tabs</span>
          </div>
        </div>

        {/* Most Used Workspaces */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            Most Used Workspaces
          </h3>
          {mostUsedWorkspaces.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {mostUsedWorkspaces.map((ws, i) => {
                const maxRestores = Math.max(...mostUsedWorkspaces.map(w => w.restores)) || 1;
                const widthPercent = Math.max((ws.restores / maxRestores) * 100, 2); // min width 2%
                return (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-700 dark:text-gray-300 font-medium truncate pr-3" title={ws.name}>
                        {ws.name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap font-medium">
                        {ws.restores}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${widthPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500 italic">
              No workspaces created yet.
            </div>
          )}
        </div>

        {/* Tabs Saved Timeline */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            Tabs Saved (Last 7 Days)
          </h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} allowDecimals={false} />
                <Tooltip 
                    cursor={{fill: 'rgba(107, 114, 128, 0.1)'}}
                    content={<CustomTooltip />}
                />
                <Bar dataKey="saved" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <HardDrive size={14} className="text-purple-500" />
            Storage Usage
            <div className="group relative ml-auto cursor-help">
              <Info size={14} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
              <div className="absolute right-0 top-6 w-48 p-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                Chrome provides ~5MB of local storage. This is shared between your saved workspaces and the Trash Queue (recently deleted workspaces kept for Undo).
              </div>
            </div>
          </h3>
          
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>{formatBytes(bytesInUse)} used</span>
              <span>{formatBytes(QUOTA_BYTES)}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-yellow-500' : 'bg-purple-500'}`}
                style={{ width: `${usagePercent}%` }}
              ></div>
            </div>
            {usagePercent > 80 && (
              <p className="text-[10px] text-red-500 mt-2 font-medium">Storage limit approaching. Try emptying the trash.</p>
            )}
          </div>

          <div className="h-32 flex items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={40}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                {hasStorageData && <Tooltip content={<CustomTooltip />} />}
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 flex flex-col gap-2 justify-center pl-2">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                Workspaces ({workspaces.length})
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                Trash Queue ({trashWorkspaces.length})
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-2">
            <button 
              onClick={() => setShowRecoverModal(true)}
              disabled={trashWorkspaces.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={12} />
              <span className="font-semibold text-xs">Recover Workspace</span>
            </button>
            <button 
              onClick={async () => {
                await chrome.storage.local.remove('tabsy_trash');
                setTrashWorkspaces([]);
                chrome.storage.local.getBytesInUse(null, setBytesInUse);
              }}
              disabled={trashWorkspaces.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
            >
              <Trash2 size={12} />
              <span className="font-semibold text-xs">Empty Trash</span>
            </button>
          </div>
        </div>
        
        <div className="h-4"></div>
      </div>

      {showRecoverModal && (
        <div className="fixed inset-0 bg-gray-900/40 dark:bg-gray-900/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Recover Workspace</h3>
              <button 
                onClick={() => setShowRecoverModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <Trash2 size={16} className="hidden" /> {/* just to import properly if needed */}
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            
            <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
              {trashWorkspaces.map(ws => (
                <div key={ws.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg group transition-colors">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{ws.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{(ws.tabs || []).length} tabs • Deleted {new Date(ws.deletedAt).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={async () => {
                      await storageService.restoreFromTrash(ws.id);
                      refreshData();
                      if (trashWorkspaces.length <= 1) {
                        setShowRecoverModal(false);
                      }
                    }}
                    className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Recover"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Workspace, Tab } from '../types/workspace';
import { WorkspaceCard } from './WorkspaceCard';
import { ExternalLink } from 'lucide-react';

interface SearchResultsProps {
  workspaces: Workspace[];
  searchQuery: string;
  onWorkspaceSelect: (id: string) => void;
  onEditRequest: (workspace: Workspace) => void;
  onDuplicateRequest: (workspace: Workspace) => void;
  onDeleteRequest: (workspace: Workspace) => void;
  onOpenTab: (url: string, pinned?: boolean) => void;
}

export function SearchResults({
  workspaces,
  searchQuery,
  onWorkspaceSelect,
  onEditRequest,
  onDuplicateRequest,
  onDeleteRequest,
  onOpenTab
}: SearchResultsProps) {
  const query = searchQuery.toLowerCase().trim();

  const matchingWorkspaces = workspaces.filter(w => 
    w.name.toLowerCase().includes(query) || (w.category && w.category.toLowerCase().includes(query))
  );

  const matchingTabs: { tab: Tab, workspace: Workspace }[] = [];
  workspaces.forEach(workspace => {
    workspace.tabs.forEach(tab => {
      if (tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query)) {
        matchingTabs.push({ tab, workspace });
      }
    });
  });

  if (matchingWorkspaces.length === 0 && matchingTabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-5xl mb-6 opacity-80">🔍</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No results found</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-[250px]">
          We couldn't find any workspaces or tabs matching "{searchQuery}".
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-6 pb-24 h-full">
      
      {matchingWorkspaces.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Matching Workspaces
          </h3>
          <div className="flex flex-col gap-3">
            {matchingWorkspaces.map(workspace => (
              <WorkspaceCard 
                key={workspace.id} 
                workspace={workspace} 
                onClick={() => onWorkspaceSelect(workspace.id)}
                onEdit={onEditRequest}
                onDuplicate={onDuplicateRequest}
                onDelete={onDeleteRequest}
              />
            ))}
          </div>
        </div>
      )}

      {matchingTabs.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Matching Tabs
          </h3>
          <ul className="flex flex-col gap-2">
            {matchingTabs.map(({ tab, workspace }) => (
              <li key={`${workspace.id}-${tab.id}`} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors group cursor-pointer" onClick={() => onOpenTab(tab.url, tab.pinned)}>
                <img 
                  src={tab.favicon || ''} 
                  alt="" 
                  className="w-5 h-5 flex-shrink-0 bg-white rounded-sm object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0xMiAyYTE0LjUgMTQuNSAwIDAgMCAwIDIwIDE0LjUgMTQuNSAwIDAgMCAwLTIwIi8+PHBhdGggZD0iTTIgMTJoMjAiLz48L3N2Zz4=';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tab.title}
                    </p>
                    {tab.pinned && (
                      <span className="flex-shrink-0 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Pinned
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap" style={{ backgroundColor: `${workspace.color}20`, color: workspace.color }}>
                      {workspace.name}
                    </span>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate font-medium">
                      {new URL(tab.url).hostname.replace('www.', '')}
                    </p>
                  </div>
                </div>
                <button 
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  aria-label="Open tab"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTab(tab.url, tab.pinned);
                  }}
                >
                  <ExternalLink size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}



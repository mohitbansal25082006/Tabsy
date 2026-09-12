import React, { useState } from 'react';
import { Workspace } from '../types/workspace';
import { WorkspaceCard } from './WorkspaceCard';
import { Plus, ChevronDown, ChevronRight, Folder } from 'lucide-react';

interface WorkspaceListProps {
  workspaces: Workspace[];
  searchQuery: string;
  onWorkspaceSelect: (id: string) => void;
  onCreateNew: () => void;
  onEditRequest: (workspace: Workspace) => void;
  onDuplicateRequest: (workspace: Workspace) => void;
  onDeleteRequest: (workspace: Workspace) => void;
}

export function WorkspaceList({ 
  workspaces, 
  searchQuery,
  onWorkspaceSelect, 
  onCreateNew,
  onEditRequest,
  onDuplicateRequest,
  onDeleteRequest
}: WorkspaceListProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    const next = new Set(collapsedCategories);
    if (next.has(category)) {
      next.delete(category);
    } else {
      next.add(category);
    }
    setCollapsedCategories(next);
  };

  if (workspaces.length === 0) {
    if (searchQuery.trim().length > 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-5xl mb-6 opacity-80">🔍</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No results found</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-[250px]">
            Try another search query to find your workspaces or tabs.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-5xl mb-6">👋</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Welcome to Tabsy</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-[260px] leading-relaxed">
          Your tabs. Your worlds. Zero chaos.<br/><br/>
          Save your current tabs into a workspace to pick up right where you left off later.
        </p>
        <button 
          onClick={onCreateNew}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Plus size={20} />
          Create First Workspace
        </button>
      </div>
    );
  }

  // Group workspaces by category
  const groupedWorkspaces = workspaces.reduce((acc, ws) => {
    const cat = ws.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ws);
    return acc;
  }, {} as Record<string, Workspace[]>);

  const categories = Object.keys(groupedWorkspaces).sort((a, b) => {
    if (a === 'Uncategorized') return -1;
    if (b === 'Uncategorized') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="p-4">
      <div className="flex flex-col gap-4 pb-24">
        {categories.map(category => {
          const catWorkspaces = groupedWorkspaces[category];
          const isCollapsed = collapsedCategories.has(category);
          const isUncategorized = category === 'Uncategorized';

          return (
            <div key={category} className="flex flex-col gap-2">
              {!isUncategorized && (
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-2 w-full text-left py-1.5 px-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors group"
                >
                  <div className="text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </div>
                  <div className="text-blue-500 opacity-80">
                    <Folder size={16} />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200 tracking-wide">
                    {category}
                  </span>
                  <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-md font-medium ml-auto">
                    {catWorkspaces.length}
                  </span>
                </button>
              )}
              
              {(!isCollapsed || isUncategorized) && (
                <div className={`flex flex-col gap-3 ${!isUncategorized ? 'pl-2 border-l-2 border-gray-100 dark:border-gray-800 ml-3 mt-1' : ''}`}>
                  {catWorkspaces.map(workspace => (
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
              )}
            </div>
          );
        })}
        
        {/* New Workspace Button/Card */}
        <button 
          onClick={onCreateNew}
          className="bg-transparent hover:bg-blue-50 dark:hover:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px] transition-all text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 group cursor-pointer shadow-sm hover:shadow-md mt-2"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 flex items-center justify-center mb-2 transition-colors">
            <Plus size={24} />
          </div>
          <span className="font-semibold text-sm">Create Workspace</span>
        </button>
      </div>
    </div>
  );
}


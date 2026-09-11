import React from 'react';
import { Workspace } from '../types/workspace';
import { WorkspaceCard } from './WorkspaceCard';

interface WorkspaceListProps {
  workspaces: Workspace[];
  searchQuery: string;
  onWorkspaceSelect: (id: string) => void;
  onCreateNew: () => void;
}

export function WorkspaceList({ workspaces, searchQuery, onWorkspaceSelect, onCreateNew }: WorkspaceListProps) {
  if (workspaces.length === 0) {
    if (searchQuery.trim().length > 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No workspaces found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-[250px]">
            Try another search or clear the search query to see all workspaces.
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
          <span className="text-lg">+</span>
          Create First Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {workspaces.map(workspace => (
          <WorkspaceCard 
            key={workspace.id} 
            workspace={workspace} 
            onClick={() => onWorkspaceSelect(workspace.id)} 
          />
        ))}
        
        {/* New Workspace Button/Card */}
        <button 
          onClick={onCreateNew}
          className="bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center h-full min-h-[120px] transition-colors text-gray-500 hover:text-gray-700 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 group-hover:bg-gray-300 flex items-center justify-center mb-2 transition-colors">
            <span className="text-lg leading-none mb-0.5">+</span>
          </div>
          <span className="text-sm font-medium">New Workspace</span>
        </button>
      </div>
    </div>
  );
}

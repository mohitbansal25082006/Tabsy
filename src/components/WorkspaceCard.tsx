import React from 'react';
import { Workspace } from '../types/workspace';
import { formatRelativeTime } from '../utils/helpers';

interface WorkspaceCardProps {
  workspace: Workspace;
  onClick: (id: string) => void;
}

export function WorkspaceCard({ workspace, onClick }: WorkspaceCardProps) {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all group flex items-start gap-4 overflow-hidden relative"
      onClick={() => onClick(workspace.id)}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: workspace.color }}
      />
      
      <div 
        className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl flex-shrink-0"
        style={{ backgroundColor: `${workspace.color}15`, color: workspace.color }}
      >
        {workspace.icon}
      </div>
      
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {workspace.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
          <span>{workspace.tabs.length} {workspace.tabs.length === 1 ? 'tab' : 'tabs'}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span>{formatRelativeTime(workspace.updatedAt)}</span>
        </p>
      </div>
    </div>
  );
}

import React from 'react';
import { Workspace } from '../types/workspace';
import { formatRelativeTime } from '../utils/helpers';
import { getIconComponent } from '../utils/iconMap';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface WorkspaceCardProps {
  workspace: Workspace;
  onClick: (id: string) => void;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
}

export function WorkspaceCard({ workspace, onClick, onEdit, onDelete }: WorkspaceCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 p-4 cursor-pointer transition-all group flex items-start gap-4 overflow-visible relative"
      onClick={() => onClick(workspace.id)}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl"
        style={{ backgroundColor: workspace.color }}
      />
      
      <div 
        className="flex items-center justify-center w-12 h-12 rounded-2xl text-2xl flex-shrink-0 mt-0.5"
        style={{ backgroundColor: `${workspace.color}15`, color: workspace.color }}
      >
        {getIconComponent(workspace.icon, 24)}
      </div>
      
      <div className="flex-1 min-w-0 py-0.5 pr-6">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-[1.05rem]">
          {workspace.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 font-medium">
          <span>{workspace.tabs.length} {workspace.tabs.length === 1 ? 'tab' : 'tabs'}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span>{formatRelativeTime(workspace.updatedAt)}</span>
        </p>
      </div>

      {/* Quick Actions (Hover + Menu) */}
      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <MoreVertical size={16} />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}></div>
            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onEdit(workspace);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit2 size={14} />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete(workspace);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

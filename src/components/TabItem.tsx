import React, { useState } from 'react';
import { Tab } from '../types/workspace';
import { MoreVertical, Trash2, ExternalLink } from 'lucide-react';

interface TabItemProps {
  tab: Tab;
  onOpen: (url: string) => void;
  onRemove: (tabId: string) => void;
}

export function TabItem({ tab, onOpen, onRemove }: TabItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleOpen = () => {
    onOpen(tab.url);
  };

  return (
    <li className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl group transition-all relative border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
      <div 
        className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer" 
        onClick={handleOpen}
        title={`Open ${tab.title}`}
      >
        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden shadow-sm">
          {tab.favicon ? (
            <img src={tab.favicon} alt="" className="w-4 h-4" />
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">?</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {tab.title}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5 font-medium">
            {new URL(tab.url).hostname.replace('www.', '')}
          </p>
        </div>
      </div>
      
      <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Tab options"
        >
          <MoreVertical size={16} />
        </button>
        
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
            ></div>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-20 py-1 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  handleOpen();
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
              >
                <ExternalLink size={14} />
                Open tab
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onRemove(tab.id);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

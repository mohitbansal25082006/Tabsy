import React, { useState } from 'react';
import { Tab } from '../types/workspace';

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
    <li className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg group transition-colors relative">
      <div 
        className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer" 
        onClick={handleOpen}
        title={`Open ${tab.title}`}
      >
        <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
          {tab.favicon ? (
            <img src={tab.favicon} alt="" className="w-4 h-4" />
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">?</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {tab.title}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {tab.url}
          </p>
        </div>
      </div>
      
      <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors font-bold pb-1"
          aria-label="Tab options"
        >
          &#8942;
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
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onRemove(tab.id);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
              >
                Remove from workspace
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

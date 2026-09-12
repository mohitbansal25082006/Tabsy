import React, { useState } from 'react';
import { Tab } from '../types/workspace';
import { MoreVertical, Trash2, ExternalLink, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TabItemProps {
  tab: Tab;
  onOpen: (url: string, pinned?: boolean) => void;
  onRemove: (tabId: string) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (tabId: string) => void;
  hideActions?: boolean;
  workspaceContext?: string;
  workspaceColor?: string;
  onUpdateTab?: (tab: Tab) => void;
}

export function TabItem({ 
  tab, 
  onOpen, 
  onRemove, 
  selectionMode = false, 
  isSelected = false, 
  onToggleSelect,
  hideActions = false,
  workspaceContext,
  workspaceColor,
  onUpdateTab
}: TabItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(tab.note || '');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleOpen = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect(tab.id);
    } else {
      onOpen(tab.url, tab.pinned);
    }
  };

  return (
    <li 
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl group transition-all relative border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSelected ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleOpen();
      }}
    >
      {selectionMode ? (
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={() => onToggleSelect && onToggleSelect(tab.id)}
          className="w-4 h-4 ml-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      ) : (
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab p-1 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
        >
          <GripVertical size={16} />
        </div>
      )}
      
      <div 
        className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer" 
        onClick={handleOpen}
        title={selectionMode ? 'Toggle selection' : `Open ${tab.title}`}
      >
        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden shadow-sm">
          {tab.favicon ? (
            <img src={tab.favicon} alt="" className="w-4 h-4" />
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">?</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {tab.title}
            </p>
            {tab.pinned && (
              <span className="flex-shrink-0 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                Pinned
              </span>
            )}
            {tab.group && (
              <span 
                className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${tab.group.color}20`, color: tab.group.color, border: `1px solid ${tab.group.color}40` }}
              >
                {tab.group.title || tab.group.color}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5 font-medium">
            {new URL(tab.url).hostname.replace('www.', '')}
          </p>
          
          {isEditingNote ? (
            <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                type="text"
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    setIsEditingNote(false);
                    if (onUpdateTab) onUpdateTab({ ...tab, note: noteValue });
                  } else if (e.key === 'Escape') {
                    setIsEditingNote(false);
                    setNoteValue(tab.note || '');
                  }
                }}
                onBlur={() => {
                  setIsEditingNote(false);
                  if (onUpdateTab) onUpdateTab({ ...tab, note: noteValue });
                }}
                placeholder="Add a note..."
                className="flex-1 text-xs px-2 py-1 bg-white dark:bg-gray-900 border border-blue-300 dark:border-blue-600 rounded focus:outline-none"
              />
            </div>
          ) : tab.note ? (
            <p 
              className="text-xs mt-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded border border-yellow-200 dark:border-yellow-800/50 cursor-text"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingNote(true);
              }}
            >
              {tab.note}
            </p>
          ) : null}
        </div>
      </div>
      
      {!selectionMode && (
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
                    setIsEditingNote(true);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <span className="w-3.5" />
                  {tab.note ? 'Edit Note' : 'Add Note'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onOpen(tab.url, tab.pinned);
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
      )}
    </li>
  );
}

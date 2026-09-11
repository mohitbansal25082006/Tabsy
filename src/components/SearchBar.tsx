import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  // Simple debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(localValue);
    }, 150);
    return () => clearTimeout(handler);
  }, [localValue, onChange]);

  return (
    <div className="relative px-4 py-3 bg-gray-50 dark:bg-gray-900 z-10 sticky top-0 transition-colors">
      <div className="relative flex items-center w-full h-11 rounded-xl bg-white dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all border border-gray-200 dark:border-gray-700 shadow-sm focus-within:shadow-md">
        <div className="grid place-items-center h-full w-12 text-gray-400">
          <Search size={18} />
        </div>
        <input
          className="peer h-full w-full outline-none text-sm text-gray-700 dark:text-gray-200 pr-2 bg-transparent font-medium placeholder-gray-400 dark:placeholder-gray-500"
          type="text"
          id="search"
          placeholder="Search workspaces..."
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
        />
        {localValue && (
          <button 
            onClick={() => setLocalValue('')}
            className="grid place-items-center h-full w-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

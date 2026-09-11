import React, { useEffect, useState } from 'react';

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
    <div className="relative px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 sticky top-0 transition-colors">
      <div className="relative flex items-center w-full h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all border border-transparent dark:border-gray-700">
        <div className="grid place-items-center h-full w-10 text-gray-400">
          <span className="text-sm">🔍</span>
        </div>
        <input
          className="peer h-full w-full outline-none text-sm text-gray-700 dark:text-gray-200 pr-2 bg-transparent"
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
            &times;
          </button>
        )}
      </div>
    </div>
  );
}

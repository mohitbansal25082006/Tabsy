import React from 'react';
import { ICON_NAMES, getIconComponent } from '../utils/iconMap';

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
}

export function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {ICON_NAMES.map(iconName => (
        <button
          key={iconName}
          type="button"
          onClick={() => onSelect(iconName)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            selectedIcon === iconName 
              ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 border-transparent dark:border-transparent scale-110 shadow-sm z-10' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:scale-105'
          }`}
          aria-label={`Select icon ${iconName}`}
        >
          {getIconComponent(iconName, 20)}
        </button>
      ))}
    </div>
  );
}

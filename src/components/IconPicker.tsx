import React from 'react';

export const ICONS = ['💻', '💼', '🎓', '📚', '💰', '✈️', '🎮', '🛒', '🏠', '❤️'];

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
}

export function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {ICONS.map(icon => (
        <button
          key={icon}
          type="button"
          onClick={() => onSelect(icon)}
          className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
            selectedIcon === icon 
              ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 border-transparent dark:border-transparent' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          }`}
          aria-label={`Select icon ${icon}`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

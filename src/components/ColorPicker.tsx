import React from 'react';

// Spec 4.10: Now with more tasteful swatches
export const COLORS = [
  '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#EC4899', 
  '#F43F5E', '#EF4444', '#F97316', '#F59E0B', '#EAB308', 
  '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', 
  '#0EA5E9', '#64748B', '#78716C'
];

interface ColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ selectedColor, onSelect }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {COLORS.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onSelect(color)}
          className={`w-8 h-8 rounded-full transition-all focus:outline-none ring-offset-2 dark:ring-offset-gray-900 border border-black/10 dark:border-white/10 ${
            selectedColor === color 
              ? 'scale-110 ring-2 ring-blue-500 shadow-sm z-10' 
              : 'hover:scale-110 hover:shadow-sm'
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}

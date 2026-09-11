import React from 'react';

// Spec 4.10: 5-6 tasteful swatches
export const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'];

interface ColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ selectedColor, onSelect }: ColorPickerProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {COLORS.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onSelect(color)}
          className={`w-8 h-8 rounded-full transition-transform focus:outline-none ring-offset-2 dark:ring-offset-gray-900 border border-black/10 dark:border-white/10 ${
            selectedColor === color 
              ? 'scale-110 ring-2 ring-blue-500' 
              : 'hover:scale-110'
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}

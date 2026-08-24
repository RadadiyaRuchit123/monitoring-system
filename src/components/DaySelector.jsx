import React from 'react';
import { Plus } from 'lucide-react';

/**
 * Mobile-First Day Selector Component (Horizontal scrollable pill tabs + Add Day button)
 * @param {{ days: Array, selectedDayId: string, onSelectDay: (id: string) => void, onOpenAddDayModal: () => void }} props
 */
export const DaySelector = ({ days = [], selectedDayId, onSelectDay, onOpenAddDayModal }) => {
  return (
    <div className="md:hidden mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Day</span>
        <button
          onClick={onOpenAddDayModal}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1 px-2 py-1 bg-brand-50 rounded-lg"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Day</span>
        </button>
      </div>

      {/* Horizontal Scroll Pill Bar */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {days.map((day) => {
          const isSelected = day.id === selectedDayId;
          return (
            <button
              key={day.id}
              onClick={() => onSelectDay(day.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Day {day.day_number}
            </button>
          );
        })}
      </div>
    </div>
  );
};

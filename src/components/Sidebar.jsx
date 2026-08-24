import React from 'react';
import { Calendar, Plus, ChevronRight } from 'lucide-react';

/**
 * Desktop Sidebar Navigation Component for Day Selection
 * @param {{ days: Array, selectedDayId: string, onSelectDay: (id: string) => void, onOpenAddDayModal: () => void }} props
 */
export const Sidebar = ({ days = [], selectedDayId, onSelectDay, onOpenAddDayModal }) => {
  return (
    <aside className="w-64 flex-shrink-0 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm h-fit">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-brand-600" />
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Days</h2>
        </div>
        <button
          onClick={onOpenAddDayModal}
          className="p-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg transition-colors text-xs font-semibold flex items-center space-x-1"
          title="Create New Day"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {days.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">No days created yet</div>
      ) : (
        <nav className="space-y-1.5" aria-label="Days navigation">
          {days.map((day) => {
            const isSelected = day.id === selectedDayId;
            return (
              <button
                key={day.id}
                onClick={() => onSelectDay(day.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 flex items-center justify-between group ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold flex-shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {day.day_number}
                  </span>
                  <span className="truncate">{day.title}</span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    isSelected ? 'text-white translate-x-0.5' : 'text-slate-400 group-hover:translate-x-0.5'
                  }`}
                />
              </button>
            );
          })}
        </nav>
      )}
    </aside>
  );
};

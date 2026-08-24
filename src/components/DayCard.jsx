import React from 'react';
import { Plus, Edit2, CheckCircle2 } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { calculatePercentage, getDayStatusBadge } from '../utils/progress';

/**
 * Day Summary Header Card Component
 * @param {{ day: object, tasksStats: { dayTotal: number, dayCompleted: number }, onOpenAddTaskModal: () => void, onOpenEditDayModal: (day) => void }} props
 */
export const DayCard = ({ day, tasksStats, onOpenAddTaskModal, onOpenEditDayModal }) => {
  if (!day) return null;

  const { dayTotal = 0, dayCompleted = 0 } = tasksStats || {};
  const dayPercentage = calculatePercentage(dayCompleted, dayTotal);
  const badge = getDayStatusBadge(dayCompleted, dayTotal);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="px-2.5 py-0.5 bg-brand-50 text-brand-700 font-extrabold text-xs rounded-md border border-brand-200/60">
              Day {day.day_number}
            </span>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${badge.colorClass}`}>
              {badge.label}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 leading-snug">{day.title}</h2>
          {day.description && <p className="text-sm text-slate-500 mt-1 max-w-2xl">{day.description}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {onOpenEditDayModal && (
            <button
              onClick={() => onOpenEditDayModal(day)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Edit Day Title"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenAddTaskModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-brand-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Stat Info */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
          <span>Day Completion Progress</span>
          <div className="flex items-center space-x-1 text-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
            <span>
              {dayCompleted} / {dayTotal} tasks ({dayPercentage}%)
            </span>
          </div>
        </div>
        <ProgressBar percentage={dayPercentage} heightClass="h-2.5" />
      </div>
    </div>
  );
};

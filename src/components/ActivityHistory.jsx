import React from 'react';
import { CheckCircle2, RotateCcw, Clock } from 'lucide-react';
import { formatDateTime } from '../utils/date';

/**
 * Audit Log Timeline Component for Task History
 * @param {{ activities: Array, loading: boolean }} props
 */
export const ActivityHistory = ({ activities = [], loading = false }) => {
  if (loading) {
    return (
      <div className="py-8 text-center text-slate-400 text-sm flex items-center justify-center space-x-2">
        <Clock className="w-4 h-4 animate-spin text-brand-600" />
        <span>Loading history audit log...</span>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
        No activity recorded yet for this task.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative border-l-2 border-slate-200 ml-3.5 pl-5 space-y-4">
        {activities.map((item) => {
          const isCompleted = item.action === 'completed';
          return (
            <div key={item.id} className="relative group">
              {/* Event Icon Marker */}
              <div
                className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white ring-4 ring-white ${
                  isCompleted ? 'bg-emerald-500 shadow-sm' : 'bg-amber-500 shadow-sm'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
              </div>

              {/* Event Details */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs">
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span className={isCompleted ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {isCompleted ? '✓ Completed' : '○ Uncompleted'}
                  </span>
                  <span className="text-slate-400 text-[11px] font-normal">
                    {formatDateTime(item.created_at)}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Task status toggled to {item.action} by authenticated user.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { CalendarX, CheckSquare, Clock } from 'lucide-react';

/**
 * Reusable Empty State Card
 */
export const EmptyState = ({ type = 'tasks', actionButton }) => {
  const configs = {
    days: {
      icon: CalendarX,
      title: 'No days available yet',
      description: 'Create your first day container (e.g. Day 1) to start organizing your daily task checklist.',
    },
    tasks: {
      icon: CheckSquare,
      title: 'No tasks for this day yet',
      description: 'Add your first task to start tracking progress and recording completion timestamps.',
    },
    activity: {
      icon: Clock,
      title: 'No activity recorded yet',
      description: 'Check or uncheck tasks to build a detailed timestamp audit log of all your actions.',
    },
  };

  const current = configs[type] || configs.tasks;
  const Icon = current.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
      <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
        <Icon className="w-7 h-7" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-semibold text-slate-800">{current.title}</h3>
        <p className="text-sm text-slate-500">{current.description}</p>
      </div>
      {actionButton && <div className="pt-2">{actionButton}</div>}
    </div>
  );
};

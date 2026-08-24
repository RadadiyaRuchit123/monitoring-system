import React from 'react';
import { Clock, History, Loader2, Trash2, Edit } from 'lucide-react';
import { formatTimeOnly } from '../utils/date';

/**
 * Task Row Component featuring accessible native checkbox and completion timestamp
 * @param {{ task: object, isUpdating: boolean, onToggle: (id, completed) => void, onViewHistory: (task) => void, onEditTask: (task) => void, onDeleteTask: (id) => void }} props
 */
export const TaskItem = ({ task, isUpdating, onToggle, onViewHistory, onEditTask, onDeleteTask }) => {
  if (!task) return null;

  const checkboxId = `task-checkbox-${task.id}`;

  return (
    <div
      className={`group bg-white border rounded-2xl p-4 transition-all duration-200 shadow-xs hover:shadow-md flex items-start justify-between gap-3 ${
        task.completed
          ? 'border-emerald-300 bg-emerald-50/40'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start space-x-3.5 min-w-0 flex-1">
        {/* Real Accessible Native HTML Checkbox */}
        <div className="relative flex items-center h-6 mt-0.5">
          {isUpdating ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <input
              id={checkboxId}
              type="checkbox"
              checked={Boolean(task.completed)}
              onChange={() => onToggle(task.id, Boolean(task.completed))}
              disabled={isUpdating}
              className="w-5 h-5 text-blue-600 bg-white border-2 border-slate-400 rounded-md focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:cursor-wait transition-all"
            />
          )}
        </div>

        {/* Task Title & Description */}
        <div className="min-w-0 flex-1">
          <label
            htmlFor={checkboxId}
            className={`text-sm font-semibold block cursor-pointer transition-colors leading-snug select-none ${
              task.completed ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-900'
            }`}
          >
            {task.title}
          </label>

          {task.description && (
            <p className={`text-xs mt-0.5 leading-relaxed ${task.completed ? 'text-slate-400' : 'text-slate-600'}`}>
              {task.description}
            </p>
          )}

          {/* Completion Timestamp Display */}
          {task.completed && task.completed_at && (
            <div className="flex items-center space-x-1.5 mt-2 text-xs font-bold text-emerald-800 bg-emerald-100 w-fit px-2.5 py-1 rounded-lg border border-emerald-300">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Completed at {formatTimeOnly(task.completed_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1">
        {/* Activity History Trigger */}
        <button
          onClick={() => onViewHistory(task)}
          className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-100 bg-slate-100 rounded-xl transition-colors"
          title="View Activity History"
          aria-label="View activity history log"
        >
          <History className="w-4 h-4 text-blue-600" />
        </button>

        {/* Edit Task Trigger */}
        {onEditTask && (
          <button
            onClick={() => onEditTask(task)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
            title="Edit Task"
            aria-label="Edit task details"
          >
            <Edit className="w-4 h-4 text-slate-700" />
          </button>
        )}

        {/* Delete Task Trigger */}
        {onDeleteTask && (
          <button
            onClick={() => onDeleteTask(task.id)}
            className="p-2 text-slate-600 hover:text-rose-700 hover:bg-rose-100 bg-slate-100 rounded-xl transition-colors"
            title="Delete Task"
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
          </button>
        )}
      </div>
    </div>
  );
};

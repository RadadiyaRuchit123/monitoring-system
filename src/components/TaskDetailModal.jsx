import React, { useState, useEffect } from 'react';
import { X, History, CheckCircle2, Clock } from 'lucide-react';
import { ActivityHistory } from './ActivityHistory';
import { taskService } from '../services/taskService';
import { formatDateTime } from '../utils/date';

/**
 * Task History & Details Modal Dialog
 * @param {{ task: object, userId: string, onClose: () => void }} props
 */
export const TaskDetailModal = ({ task, userId, onClose }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadHistory() {
      if (!task?.id || !userId) return;
      setLoading(true);
      try {
        const data = await taskService.getTaskActivity(task.id, userId);
        if (mounted) setActivities(data);
      } catch (err) {
        console.error('Failed to load task history:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadHistory();
    return () => {
      mounted = false;
    };
  }, [task, userId]);

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Task Activity & Details</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Task Info Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Status</span>
              {task.completed ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Completed</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending</span>
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-slate-900 leading-snug">{task.title}</h4>
            {task.description && <p className="text-xs text-slate-500 mt-1">{task.description}</p>}

            {task.completed && task.completed_at && (
              <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs font-medium text-slate-600 flex items-center justify-between">
                <span>Latest completion:</span>
                <span className="font-bold text-slate-800">{formatDateTime(task.completed_at)}</span>
              </div>
            )}
          </div>

          {/* Chronological Activity Log Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Activity History Log ({activities.length})
            </h4>
            <ActivityHistory activities={activities} loading={loading} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

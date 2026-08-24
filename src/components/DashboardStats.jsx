import React from 'react';
import { CheckCircle2, Clock, ListTodo, TrendingUp } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { calculatePercentage } from '../utils/progress';

/**
 * Top Dashboard Overview Statistics Component
 * @param {{ stats: { globalTotal: number, globalCompleted: number, globalPending: number } }} props
 */
export const DashboardStats = ({ stats }) => {
  const { globalTotal = 0, globalCompleted = 0, globalPending = 0 } = stats || {};
  const overallPercentage = calculatePercentage(globalCompleted, globalTotal);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Tasks */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Tasks</span>
          <div className="w-9 h-9 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
            <ListTodo className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900">{globalTotal}</div>
        <div className="text-xs text-slate-500 mt-1">Across all assigned days</div>
      </div>

      {/* Completed */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed</span>
          <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-emerald-600">{globalCompleted}</div>
        <div className="text-xs text-slate-500 mt-1">Tasks checkmarked done</div>
      </div>

      {/* Pending */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending</span>
          <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-amber-600">{globalPending}</div>
        <div className="text-xs text-slate-500 mt-1">Awaiting completion</div>
      </div>

      {/* Overall Progress */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Progress</span>
            <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-2xl font-extrabold text-slate-900">{overallPercentage}%</span>
            <span className="text-xs font-medium text-slate-500">
              ({globalCompleted} / {globalTotal})
            </span>
          </div>
        </div>
        <ProgressBar percentage={overallPercentage} heightClass="h-2.5" />
      </div>
    </div>
  );
};

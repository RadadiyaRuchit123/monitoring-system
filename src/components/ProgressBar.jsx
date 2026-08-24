import React from 'react';

/**
 * Animated Gradient Progress Bar Component
 * @param {{ percentage: number, heightClass?: string, showLabel?: boolean }} props
 */
export const ProgressBar = ({ percentage = 0, heightClass = 'h-3', showLabel = false }) => {
  const safePercent = Math.min(100, Math.max(0, Math.round(percentage)));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1">
          <span>Progress</span>
          <span>{safePercent}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className="bg-gradient-to-r from-brand-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${safePercent}%` }}
          role="progressbar"
          aria-valuenow={safePercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

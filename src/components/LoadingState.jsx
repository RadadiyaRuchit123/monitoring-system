import React from 'react';

/**
 * Skeleton Loader & Spinner States
 */
export const LoadingSpinner = ({ label = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-3">
    <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
    <p className="text-sm font-medium text-slate-500 animate-pulse">{label}</p>
  </div>
);

export const SkeletonDashboard = () => (
  <div className="space-y-6 animate-pulse">
    {/* Stats Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
      ))}
    </div>

    {/* Day Card Skeleton */}
    <div className="h-32 bg-slate-200 rounded-2xl"></div>

    {/* Tasks Skeleton */}
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-slate-200 rounded-xl"></div>
      ))}
    </div>
  </div>
);

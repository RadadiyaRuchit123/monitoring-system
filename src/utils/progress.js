/**
 * Progress Calculation & Status Utilities
 */

/**
 * Calculates progress percentage safely.
 * @param {number} completedCount
 * @param {number} totalCount
 * @returns {number} Integer between 0 and 100
 */
export const calculatePercentage = (completedCount, totalCount) => {
  if (!totalCount || totalCount <= 0) return 0;
  const percentage = Math.round((completedCount / totalCount) * 100);
  return Math.min(100, Math.max(0, percentage));
};

/**
 * Determines day completion status badge details based on task counts.
 * @param {number} completedCount
 * @param {number} totalCount
 * @returns {{ label: string, colorClass: string, badgeBg: string }}
 */
export const getDayStatusBadge = (completedCount, totalCount) => {
  if (totalCount === 0) {
    return {
      label: 'No Tasks',
      colorClass: 'text-slate-500 bg-slate-100 border-slate-200',
    };
  }

  if (completedCount === 0) {
    return {
      label: 'Not Started',
      colorClass: 'text-slate-600 bg-slate-100 border-slate-200',
    };
  }

  if (completedCount === totalCount) {
    return {
      label: 'Completed',
      colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    };
  }

  return {
    label: 'In Progress',
    colorClass: 'text-brand-700 bg-brand-50 border-brand-200',
  };
};

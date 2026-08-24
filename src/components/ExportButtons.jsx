import React, { useState } from 'react';
import { FileSpreadsheet, History, Loader2 } from 'lucide-react';
import { exportService } from '../services/exportService';

/**
 * CSV Export Trigger Buttons Component
 * @param {{ profile: object, onError?: (err: string) => void }} props
 */
export const ExportButtons = ({ profile, onError }) => {
  const [exportingChecklist, setExportingChecklist] = useState(false);
  const [exportingActivity, setExportingActivity] = useState(false);

  const handleExportChecklist = async () => {
    if (!profile) return;
    setExportingChecklist(true);
    try {
      await exportService.exportChecklistCSV(profile);
    } catch (err) {
      console.error('Checklist CSV export failed:', err);
      if (onError) onError(err.message || 'Failed to export checklist CSV');
    } finally {
      setExportingChecklist(false);
    }
  };

  const handleExportActivity = async () => {
    if (!profile) return;
    setExportingActivity(true);
    try {
      await exportService.exportActivityCSV(profile);
    } catch (err) {
      console.error('Activity CSV export failed:', err);
      if (onError) onError(err.message || 'Failed to export activity CSV');
    } finally {
      setExportingActivity(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleExportChecklist}
        disabled={exportingChecklist || !profile}
        className="inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold rounded-xl border border-emerald-300 shadow-xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        title="Download all checklist tasks and status records as CSV"
      >
        {exportingChecklist ? (
          <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 text-emerald-700 stroke-[2.2]" />
        )}
        <span>Export Checklist CSV</span>
      </button>

      <button
        onClick={handleExportActivity}
        disabled={exportingActivity || !profile}
        className="inline-flex items-center space-x-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs sm:text-sm font-bold rounded-xl border border-blue-300 shadow-xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        title="Download complete completion timestamp history log as CSV"
      >
        {exportingActivity ? (
          <Loader2 className="w-4 h-4 text-blue-700 animate-spin" />
        ) : (
          <History className="w-4 h-4 text-blue-700 stroke-[2.2]" />
        )}
        <span>Export Activity CSV</span>
      </button>
    </div>
  );
};

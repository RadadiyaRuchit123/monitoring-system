import React from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * Dismissible Error Alert Banner
 * @param {{ message: string, onClose?: () => void }} props
 */
export const ErrorMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-start justify-between shadow-sm animate-fade-in mb-4">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm font-medium leading-relaxed">{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-rose-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-100 transition-colors ml-3"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
